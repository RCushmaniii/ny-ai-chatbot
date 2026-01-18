import { auth } from "@/app/(auth)/auth";
import { ingestWebsite } from "@/lib/ingest/website";

export const maxDuration = 300; // 5 minutes for ingestion

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sitemapUrl: string | undefined = body?.sitemapUrl;

    if (!sitemapUrl) {
      return Response.json(
        { error: "Sitemap URL is required" },
        { status: 400 },
      );
    }

    console.log("Starting ingestion for sitemap via API:", sitemapUrl);

    const stats = await ingestWebsite({
      sitemapUrl,
      clearExisting: false,
    });

    return Response.json({
      success: true,
      pagesProcessed: stats.urlsProcessed,
      chunksCreated: stats.chunksCreated,
      urlsFound: stats.urlsFound,
      errors: stats.errors,
      message: "Ingestion completed successfully",
    });
  } catch (error) {
    console.error("Error running ingestion:", error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to run ingestion",
      },
      { status: 500 },
    );
  }
}
