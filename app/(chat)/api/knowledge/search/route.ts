import { embed } from "ai";
import postgres from "postgres";
import { requireAdmin } from "@/lib/auth/admin";
import { openai } from "@/lib/ai/openai";

export async function POST(req: Request) {
  try {
    // Require authenticated admin
    const adminId = await requireAdmin();
    if (!adminId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return Response.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const client = postgres(postgresUrl, {
      max: 1,
    });

    const { query, limit = 4 } = await req.json();

    if (!query) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    // Clamp limit to prevent abuse
    const safeLimit = Math.min(Math.max(1, Number(limit) || 4), 20);

    // Create embedding for the query
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    // SQL: Cosine similarity search using pgvector (parameterized)
    const embeddingStr = JSON.stringify(embedding);
    const results = await client`
      SELECT
        content,
        metadata,
        url,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM website_content
      WHERE 1 - (embedding <=> ${embeddingStr}::vector) > 0.5
      ORDER BY similarity DESC
      LIMIT ${safeLimit}
    `;

    // Format context for the LLM
    const contextText = results
      .map((r) => {
        const meta =
          typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
        return `SOURCE: ${meta.title || "Untitled"} (${r.url})\nCONTENT: ${r.content}`;
      })
      .join("\n\n---\n\n");

    return Response.json({
      context: contextText,
      sources: results.map((r) => ({
        url: r.url,
        title:
          typeof r.metadata === "string"
            ? JSON.parse(r.metadata).title
            : r.metadata?.title,
        similarity: r.similarity,
      })),
    });
  } catch (error) {
    console.error("Knowledge search error:", error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
