import { config as dotenvConfig } from "dotenv";
import postgres from "postgres";

// Load environment variables
dotenvConfig({ path: ".env.development.local" });
dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);

async function checkKnowledge() {
  console.log("📊 Checking knowledge base stats...\n");

  try {
    // Get overall stats
    // Note: metadata is stored as TEXT (JSON string), not JSONB
    const stats = await client`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT url) as unique_urls,
        COUNT(CASE WHEN url LIKE '%/es/%' THEN 1 END) as spanish_chunks,
        COUNT(CASE WHEN url LIKE '%/en/%' THEN 1 END) as english_chunks,
        COUNT(CASE WHEN url NOT LIKE '%/es/%' AND url NOT LIKE '%/en/%' THEN 1 END) as other_urls
      FROM website_content
    `;

    console.log("📈 Overall Stats:");
    console.log(`   Total chunks: ${stats[0].total_chunks}`);
    console.log(`   Unique URLs: ${stats[0].unique_urls}`);
    console.log(`   Spanish chunks: ${stats[0].spanish_chunks}`);
    console.log(`   English chunks: ${stats[0].english_chunks}`);
    console.log(`   Other URLs: ${stats[0].other_urls}\n`);

    // Get sample URLs by language
    const spanishUrls = await client`
      SELECT DISTINCT url
      FROM website_content
      WHERE url LIKE '%/es/%'
      LIMIT 5
    `;

    const englishUrls = await client`
      SELECT DISTINCT url
      FROM website_content
      WHERE url LIKE '%/en/%'
      LIMIT 5
    `;

    console.log("🇪🇸 Sample Spanish URLs:");
    spanishUrls.forEach((row) => console.log(`   - ${row.url}`));

    console.log("\n🇺🇸 Sample English URLs:");
    englishUrls.forEach((row) => console.log(`   - ${row.url}`));

    console.log("\n✅ Knowledge base check complete!");
  } catch (error) {
    console.error("❌ Error checking knowledge base:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the check
checkKnowledge().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});
