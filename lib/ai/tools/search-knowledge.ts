import { createHash } from "node:crypto";
import { embed, tool } from "ai";
import postgres from "postgres";
import { z } from "zod";
import { openai } from "@/lib/ai/openai";
import { logKnowledgeEvent } from "./log-knowledge-event";

// Shared Postgres client for knowledge searches.
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);

export type KnowledgeSearchResult = {
  content: string;
  url: string | null;
  similarity: number;
  metadata: Record<string, any>;
};

function safeParseMetadata(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, any>;
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value) as Record<string, any>;
  } catch {
    return {};
  }
}

function stableChunkId(
  sourceTable: string,
  url: string | null,
  content: string,
) {
  const base = `${sourceTable}::${url ?? ""}::${content.slice(0, 500)}`;
  return createHash("sha1").update(base).digest("hex");
}

const MANUAL_SIMILARITY_THRESHOLD = 0.25;
const MANUAL_TOP_K = 20;

// Simple in-memory cache for embeddings (prevents rate limiting during testing)
const embeddingCache = new Map<string, number[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export async function searchKnowledgeDirect(
  query: string,
  context?: {
    chatId?: string;
    messageId?: string;
    sessionId?: string;
  },
): Promise<KnowledgeSearchResult[]> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. Generate embedding for the query (with caching)
    let embedding: number[];
    const cacheKey = trimmed.toLowerCase();
    const cachedEmbedding = embeddingCache.get(cacheKey);
    const cacheTime = cacheTimestamps.get(cacheKey);

    if (cachedEmbedding && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
      console.log(
        `📦 Using cached embedding for: "${trimmed.substring(0, 50)}..."`,
      );
      embedding = cachedEmbedding;
    } else {
      try {
        console.log(
          `🔄 Generating new embedding for: "${trimmed.substring(0, 50)}..."`,
        );
        const result = await embed({
          model: openai.embedding("text-embedding-3-small"),
          value: trimmed,
        });
        embedding = result.embedding;

        // Cache the embedding
        embeddingCache.set(cacheKey, embedding);
        cacheTimestamps.set(cacheKey, Date.now());

        // Clean up old cache entries (keep cache size manageable)
        if (embeddingCache.size > 100) {
          const oldestKey = Array.from(cacheTimestamps.entries()).sort(
            (a, b) => a[1] - b[1],
          )[0][0];
          embeddingCache.delete(oldestKey);
          cacheTimestamps.delete(oldestKey);
        }
      } catch (embedError) {
        console.error("⚠️  Embedding generation failed:", embedError);
        return []; // Return empty results if embedding fails
      }
    }

    // 2. Search BOTH knowledge sources and merge results
    // Search website_content (scraped from nyenglishteacher.com)
    const websiteResults = await client.unsafe(`
      SELECT content, url, metadata,
        1 - (embedding <=> '${JSON.stringify(embedding)}'::vector) as similarity
      FROM website_content
      WHERE 1 - (embedding <=> '${JSON.stringify(embedding)}'::vector) > 0.5
      ORDER BY similarity DESC
      LIMIT 5
    `);

    // Search Document_Knowledge (manually added content from admin)
    const manualResults = await client.unsafe(`
      SELECT id, content, url, metadata,
        1 - (embedding <=> '${JSON.stringify(embedding)}'::vector) as similarity
      FROM "Document_Knowledge"
      WHERE embedding IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ${MANUAL_TOP_K}
    `);

    const websiteMapped: KnowledgeSearchResult[] = websiteResults.map(
      (row: any) => {
        const parsed = safeParseMetadata(row.metadata);
        const url = (row.url as string) ?? null;
        const content = row.content as string;
        const chunkId =
          parsed?.chunkId ?? stableChunkId("website_content", url, content);
        return {
          content,
          url,
          similarity: Number(row.similarity),
          metadata: {
            ...parsed,
            sourceTable: "website_content",
            sourceType: "website",
            chunkId,
          },
        };
      },
    );

    const manualMappedAll: KnowledgeSearchResult[] = manualResults.map(
      (row: any) => {
        const parsed = safeParseMetadata(row.metadata);
        const inferredSourceType =
          parsed?.sourceType ?? (parsed?.sourceFile ? "pdf" : "manual");
        const url = (row.url as string) ?? null;
        const content = row.content as string;
        const chunkId =
          parsed?.chunkId ?? `Document_Knowledge:${String(row.id)}`;
        return {
          content,
          url,
          similarity: Number(row.similarity),
          metadata: {
            ...parsed,
            sourceTable: "Document_Knowledge",
            sourceType: inferredSourceType,
            chunkId,
          },
        };
      },
    );

    const manualMapped = manualMappedAll.filter(
      (r) => Number(r.similarity) >= MANUAL_SIMILARITY_THRESHOLD,
    );

    if (process.env.NODE_ENV !== "production") {
      const top = manualMappedAll.slice(0, 5).map((r) => ({
        similarity: Number(r.similarity),
        sourceFile: r.metadata?.sourceFile,
        sourceType: r.metadata?.sourceType,
      }));
      console.log("[RAG] Document_Knowledge candidates:", {
        total: manualMappedAll.length,
        passed: manualMapped.length,
        threshold: MANUAL_SIMILARITY_THRESHOLD,
        top,
      });
    }

    // Merge and sort by similarity, take top 5
    let results = [...websiteMapped, ...manualMapped]
      .sort((a, b) => Number(b.similarity) - Number(a.similarity))
      .slice(0, 5);

    if (results.length === 0) {
      const markerTokens = trimmed.match(/[A-Z0-9_]{8,}/g) ?? [];
      const stopWords = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "to",
        "for",
        "of",
        "in",
        "on",
        "at",
        "is",
        "are",
        "was",
        "were",
        "be",
        "with",
        "your",
        "my",
        "our",
        "when",
        "what",
        "which",
        "who",
        "how",
        "why",
      ]);

      const words =
        trimmed
          .toLowerCase()
          .match(/[a-z0-9]+/g)
          ?.filter((w) => w.length >= 4 && !stopWords.has(w)) ?? [];

      const keywordTerms = Array.from(new Set(words)).slice(0, 5);
      const fallbackTerms =
        markerTokens.length > 0
          ? markerTokens.slice(0, 3)
          : keywordTerms.length > 0
            ? keywordTerms
            : [trimmed];

      if (process.env.NODE_ENV !== "production") {
        console.log("[RAG] Keyword fallback terms:", fallbackTerms);
      }
      const keywordRows: any[] = [];

      for (const term of fallbackTerms) {
        const rows = await client`
          SELECT id, content, url, metadata, 0.99 as similarity
          FROM "Document_Knowledge"
          WHERE content ILIKE ${`%${term}%`}
          ORDER BY "createdAt" DESC
          LIMIT 5
        `;
        keywordRows.push(...rows);
      }

      const deduped = new Map<string, KnowledgeSearchResult>();
      for (const row of keywordRows) {
        const parsed = safeParseMetadata(row.metadata);
        const inferredSourceType =
          parsed?.sourceType ?? (parsed?.sourceFile ? "pdf" : "manual");
        const url = (row.url as string) ?? null;
        const content = row.content as string;
        const chunkId =
          parsed?.chunkId ?? `Document_Knowledge:${String(row.id)}`;
        const mapped: KnowledgeSearchResult = {
          content,
          url,
          similarity: Number(row.similarity),
          metadata: {
            ...parsed,
            sourceTable: "Document_Knowledge",
            sourceType: inferredSourceType,
            chunkId,
          },
        };

        const key = `${mapped.url ?? ""}::${mapped.content.slice(0, 80)}`;
        if (!deduped.has(key)) deduped.set(key, mapped);
      }

      results = Array.from(deduped.values()).slice(0, 5);

      if (process.env.NODE_ENV !== "production") {
        console.log("[RAG] Keyword fallback results:", {
          rows: keywordRows.length,
          deduped: results.length,
        });
      }
    }

    // Log knowledge event for RAG insights
    if (context) {
      await logKnowledgeEvent({
        chatId: context.chatId,
        messageId: context.messageId,
        sessionId: context.sessionId,
        query: trimmed,
        results,
      });
    }

    return results;
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return [];
  }
}

export const searchKnowledgeTool = tool({
  description:
    "Search the knowledge base for information about New York English Teacher services, pricing, coaching approach, and business details. Use this when the user asks about services, pricing, coaching methods, or any business-related questions. ALWAYS include the source URL in your response when referencing information.",

  inputSchema: z.object({
    query: z.string().describe("The search query to find relevant information"),
  }),

  execute: async (input) => {
    const { query } = input;
    const results = await searchKnowledgeDirect(query);

    if (!results.length) {
      return {
        results: [],
        message:
          "No relevant information found in the knowledge base. Please provide a general answer or ask the user to contact Robert directly.",
      };
    }

    // Format results with clear source attribution
    const formattedResults = results.map((r) => ({
      content: r.content,
      source_url: r.url,
      page_title: r.metadata?.title || "New York English Teacher",
      similarity_score: r.similarity,
    }));

    return {
      results: formattedResults,
      instruction:
        "When answering, include the source URL(s) so users can learn more. Format as: 'Learn more: [URL]' or 'Read more about this: [URL]'",
    };
  },
});
