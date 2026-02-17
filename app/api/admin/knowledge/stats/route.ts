import postgres from "postgres";
import { auth } from "@/app/(auth)/auth";

function getAdminEmail() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL environment variable is required");
  return email;
}

export async function GET() {
  try {
    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return Response.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const client = postgres(postgresUrl);

    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email !== getAdminEmail()) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get count from website_content table
    const websiteResult = await client`
      SELECT COUNT(*) as count FROM website_content
    `;

    // Get count from Document_Knowledge table
    const manualResult = await client`
      SELECT COUNT(*) as count FROM "Document_Knowledge"
    `;

    const manualEmbeddingStats = await client`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE embedding IS NOT NULL)::int as with_embedding,
        COUNT(*) FILTER (WHERE embedding IS NULL)::int as without_embedding,
        MAX("createdAt") as latest_created_at
      FROM "Document_Knowledge"
    `;

    const manualBySourceType = await client`
      SELECT
        COALESCE((metadata::jsonb ->> 'sourceType'), 'unknown') as source_type,
        COUNT(*)::int as count
      FROM "Document_Knowledge"
      GROUP BY 1
      ORDER BY count DESC
    `;

    return Response.json({
      websiteContent: Number(websiteResult[0]?.count || 0),
      manualContent: Number(manualResult[0]?.count || 0),
      manualEmbedding: {
        total: Number(manualEmbeddingStats[0]?.total || 0),
        withEmbedding: Number(manualEmbeddingStats[0]?.with_embedding || 0),
        withoutEmbedding: Number(
          manualEmbeddingStats[0]?.without_embedding || 0,
        ),
        latestCreatedAt: manualEmbeddingStats[0]?.latest_created_at || null,
      },
      manualBySourceType,
    });
  } catch (error) {
    console.error("Error fetching knowledge base stats:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
