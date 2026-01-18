import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import * as cheerio from "cheerio";
import postgres from "postgres";
import { parseStringPromise } from "xml2js";

// Shared website ingestion logic for use in API routes and scripts

const DEFAULT_CONFIG = {
  sitemapUrl: "https://www.nyenglishteacher.com/sitemap-0.xml",
  tableName: "website_content",
  chunkSize: 1000,
  chunkOverlap: 200,
  // Include BOTH English and Spanish pages
  filterPattern: /^https:\/\/www\.nyenglishteacher\.com\/(en\/|es\/|$)/,
};

export const DEFAULT_INGEST_CONFIG = DEFAULT_CONFIG;

export interface IngestOptions {
  sitemapUrl?: string;
  clearExisting?: boolean;
}

export interface IngestStats {
  urlsFound: number;
  urlsProcessed: number;
  chunksCreated: number;
  errors: number;
}

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

function createClient() {
  // biome-ignore lint: Forbidden non-null assertion.
  return postgres(process.env.POSTGRES_URL!);
}

async function fetchSitemapUrls(
  config: typeof DEFAULT_CONFIG,
): Promise<string[]> {
  const sitemapUrl = config.sitemapUrl;
  console.log("📥 Fetching sitemap:", sitemapUrl);

  try {
    const response = await fetch(sitemapUrl);

    if (!response.ok) {
      console.warn(
        `⚠️  Sitemap not found at ${sitemapUrl}, using fallback URLs`,
      );
      return getFallbackUrls();
    }

    const xmlText = await response.text();

    const result = await parseStringPromise(xmlText);

    const urls: string[] = [];
    if (result.urlset && result.urlset.url) {
      for (const entry of result.urlset.url) {
        if (entry.loc && entry.loc[0]) {
          const url = entry.loc[0];
          if (config.filterPattern.test(url)) {
            urls.push(url);
          }
        }
      }
    }

    console.log(`✅ Found ${urls.length} URLs in sitemap (English + Spanish)`);
    return urls.length > 0 ? urls : getFallbackUrls();
  } catch (error) {
    console.warn("⚠️  Failed to parse sitemap, using fallback URLs", error);
    return getFallbackUrls();
  }
}

function getFallbackUrls(): string[] {
  const urls = [
    "https://www.nyenglishteacher.com/",
    "https://www.nyenglishteacher.com/en/about",
    "https://www.nyenglishteacher.com/en/services/",
    "https://www.nyenglishteacher.com/en/blog/",
    "https://www.nyenglishteacher.com/en/contact",
  ];
  console.log(`📋 Using ${urls.length} fallback URLs`);
  return urls;
}

async function scrapePage(url: string): Promise<PageData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NYEnglishTeacher/1.0; +http://www.nyenglishteacher.com)",
      },
    });

    if (!response.ok) {
      console.warn(`⚠️  Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, iframe, noscript").remove();

    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text().trim() ||
      url;

    const description =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      "";

    const content = $("body").text().replace(/\s+/g, " ").trim();

    return { url, title, description, content };
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error);
    return null;
  }
}

function splitIntoChunks(
  page: PageData,
  config: typeof DEFAULT_CONFIG,
): Chunk[] {
  const chunks: Chunk[] = [];
  const { content, url, title, description } = page;

  let start = 0;
  let chunkIndex = 0;

  while (start < content.length) {
    const end = Math.min(start + config.chunkSize, content.length);
    const chunkContent = content.slice(start, end);

    const language = url.includes("/es/") ? "es" : "en";

    chunks.push({
      content: chunkContent,
      metadata: {
        url,
        title,
        description,
        source: "website",
        language,
        scraped_at: new Date().toISOString(),
        chunk_index: chunkIndex,
      },
    });

    start += config.chunkSize - config.chunkOverlap;
    chunkIndex++;
  }

  return chunks;
}

async function storeChunk(
  client: postgres.Sql,
  config: typeof DEFAULT_CONFIG,
  chunk: Chunk,
): Promise<void> {
  const { content, metadata } = chunk;

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: content,
  });

  await client`
    INSERT INTO ${client(config.tableName)} (content, metadata, embedding, url, created_at)
    VALUES (
      ${content},
      ${JSON.stringify(metadata)},
      ${JSON.stringify(embedding)},
      ${metadata.url},
      NOW()
    )
  `;
}

export async function ingestWebsite(
  options: IngestOptions = {},
): Promise<IngestStats> {
  const config: typeof DEFAULT_CONFIG = {
    ...DEFAULT_CONFIG,
    ...(options.sitemapUrl ? { sitemapUrl: options.sitemapUrl } : {}),
  };

  const client = createClient();

  try {
    console.log("🚀 Starting ingestion pipeline...\n");

    const urls = await fetchSitemapUrls(config);

    if (options.clearExisting) {
      console.log("🧹 Clearing old website_content data...");
      await client`TRUNCATE TABLE ${client(config.tableName)}`;
      console.log("✅ Table cleared\n");
    }

    let totalChunks = 0;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[${i + 1}/${urls.length}] Processing: ${url}`);

      const pageData = await scrapePage(url);
      if (!pageData) {
        errorCount++;
        continue;
      }

      const chunks = splitIntoChunks(pageData, config);
      console.log(`  📄 Generated ${chunks.length} chunks`);

      for (const chunk of chunks) {
        try {
          await storeChunk(client, config, chunk);
          totalChunks++;
        } catch (error) {
          errorCount++;
          console.error("❌ Failed to store chunk:", error);
        }
      }

      processedCount++;
      console.log(`  ✅ Stored ${chunks.length} chunks\n`);
    }

    console.log(`🎉 Ingestion complete! Total chunks: ${totalChunks}`);

    return {
      urlsFound: urls.length,
      urlsProcessed: processedCount,
      chunksCreated: totalChunks,
      errors: errorCount,
    };
  } finally {
    await client.end();
  }
}

export default ingestWebsite;
