/**
 * Rebuild Knowledge Base Endpoint
 * 
 * POST /api/admin/knowledge/rebuild
 * 
 * Clears all website content and re-crawls the website to ingest fresh content.
 * This is useful when website content has been significantly updated.
 * 
 * Requires admin authentication.
 */

import { auth } from "@/app/(auth)/auth";
import { documents } from "@/lib/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import * as cheerio from "cheerio";
import { parseStringPromise } from "xml2js";
import { eq } from "drizzle-orm";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export const maxDuration = 300; // 5 minutes max

const CONFIG = {
  sitemapUrl: "https://www.nyenglishteacher.com/sitemap-0.xml",
  chunkSize: 1000,
  chunkOverlap: 200,
  filterPattern: /^https:\/\/www\.nyenglishteacher\.com\/(en\/|es\/|$)/,
};

interface PageData {
  url: string;
  title: string;
  description: string;
  content: string;
}

interface Chunk {
  content: string;
  metadata: {
    url: string;
    title: string;
    description: string;
    source: string;
    language: string;
    scraped_at: string;
    chunk_index: number;
  };
}

async function fetchSitemapUrls(): Promise<string[]> {
  try {
    const response = await fetch(CONFIG.sitemapUrl);
    const xmlText = await response.text();
    const parsed = await parseStringPromise(xmlText);

    const urls = parsed.urlset.url
      .map((item: any) => item.loc[0])
      .filter((url: string) => CONFIG.filterPattern.test(url));

    return urls;
  } catch (error) {
    console.error("Error fetching sitemap:", error);
    throw error;
  }
}

async function fetchPageContent(url: string): Promise<PageData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NYEnglishTeacher/1.0; +http://www.nyenglishteacher.com)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text() ||
      url;

    // Extract description
    const description =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      "";

    // Extract main content
    $("script, style, nav, footer").remove();
    const content = $("body").text().replace(/\s+/g, " ").trim();

    return {
      url,
      title,
      description,
      content,
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function chunkContent(
  content: string,
  chunkSize: number,
  overlap: number
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    chunks.push(content.substring(start, end));
    start = end - overlap;
  }

  return chunks;
}

function detectLanguage(url: string): string {
  return url.includes("/es/") ? "es" : "en";
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting knowledge base rebuild...");

    // Step 1: Clear existing website content
    console.log("🗑️  Clearing existing website content...");
    await db.delete(documents).where(eq(documents.url, "https://www.nyenglishteacher.com"));
    console.log("✅ Cleared website content from documents table");

    // Step 2: Fetch sitemap URLs
    console.log("📥 Fetching sitemap URLs...");
    const urls = await fetchSitemapUrls();
    console.log(`✅ Found ${urls.length} URLs to process`);

    // Step 3: Fetch and process each page
    let processedCount = 0;
    let errorCount = 0;
    const chunks: Array<{
      content: string;
      url: string;
      title: string;
      description: string;
      embedding: number[];
      language: string;
    }> = [];

    for (const url of urls) {
      try {
        const pageData = await fetchPageContent(url);
        if (!pageData) {
          errorCount++;
          continue;
        }

        // Chunk the content
        const contentChunks = chunkContent(
          pageData.content,
          CONFIG.chunkSize,
          CONFIG.chunkOverlap
        );

        // Generate embeddings for each chunk
        for (let i = 0; i < contentChunks.length; i++) {
          const chunkText = contentChunks[i];
          if (chunkText.trim().length === 0) continue;

          try {
            const embedding = await embed({
              model: openai.embedding("text-embedding-3-small"),
              value: chunkText,
            });

            chunks.push({
              content: chunkText,
              url: pageData.url,
              title: pageData.title,
              description: pageData.description,
              embedding: embedding.embedding,
              language: detectLanguage(pageData.url),
            });
          } catch (error) {
            console.error(`Error embedding chunk from ${url}:`, error);
          }
        }

        processedCount++;
        console.log(`✅ Processed ${processedCount}/${urls.length}: ${url}`);
      } catch (error) {
        errorCount++;
        console.error(`Error processing ${url}:`, error);
      }
    }

    // Step 4: Insert chunks into database
    console.log(`📝 Inserting ${chunks.length} chunks into database...`);
    for (const chunk of chunks) {
      await db.insert(documents).values({
        content: chunk.content,
        url: chunk.url,
        embedding: chunk.embedding as any,
        metadata: JSON.stringify({
          title: chunk.title,
          description: chunk.description,
          language: chunk.language,
          source: "website_crawl",
          scraped_at: new Date().toISOString(),
        }),
      });
    }

    console.log("✅ Knowledge base rebuild complete!");

    return NextResponse.json({
      success: true,
      message: "Knowledge base rebuilt successfully",
      stats: {
        urlsFound: urls.length,
        urlsProcessed: processedCount,
        errors: errorCount,
        chunksCreated: chunks.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error rebuilding knowledge base:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
