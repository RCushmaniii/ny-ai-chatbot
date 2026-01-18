import { config as dotenvConfig } from "dotenv";
import postgres from "postgres";

// Load environment variables
dotenvConfig({ path: ".env.development.local" });
dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);

async function checkMetadata() {
  console.log("🔍 Checking actual metadata structure...\n");

  try {
    // Get a few sample chunks to see what metadata looks like
    const samples = await client`
      SELECT 
        url,
        metadata,
        LEFT(content, 100) as content_preview
      FROM website_content
      LIMIT 5
    `;

    console.log("📄 Sample chunks:\n");
    samples.forEach((row, i) => {
      console.log(`Sample ${i + 1}:`);
      console.log(`  URL: ${row.url}`);
      console.log(`  Metadata:`, JSON.stringify(row.metadata, null, 2));
      console.log(`  Content preview: ${row.content_preview}...`);
      console.log();
    });

    // Check if any URLs contain /es/
    const spanishUrlCount = await client`
      SELECT COUNT(*) as count
      FROM website_content
      WHERE url LIKE '%/es/%'
    `;

    const englishUrlCount = await client`
      SELECT COUNT(*) as count
      FROM website_content
      WHERE url LIKE '%/en/%'
    `;

    console.log("🌐 URL Language Detection:");
    console.log(`  URLs with /es/: ${spanishUrlCount[0].count}`);
    console.log(`  URLs with /en/: ${englishUrlCount[0].count}`);

    // Get sample Spanish and English URLs
    const spanishSamples = await client`
      SELECT DISTINCT url
      FROM website_content
      WHERE url LIKE '%/es/%'
      LIMIT 3
    `;

    const englishSamples = await client`
      SELECT DISTINCT url
      FROM website_content
      WHERE url LIKE '%/en/%'
      LIMIT 3
    `;

    console.log("\n🇪🇸 Sample Spanish URLs:");
    spanishSamples.forEach((row) => console.log(`  - ${row.url}`));

    console.log("\n🇺🇸 Sample English URLs:");
    englishSamples.forEach((row) => console.log(`  - ${row.url}`));
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await client.end();
  }
}

checkMetadata().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});
