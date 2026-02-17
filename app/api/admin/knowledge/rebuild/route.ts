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

import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { ingestWebsite } from "@/lib/ingest/website";

function getAdminEmail() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL environment variable is required");
  return email;
}

export const maxDuration = 300; // 5 minutes max

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email !== getAdminEmail()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("🔄 Starting knowledge base rebuild via shared ingest...");

    const stats = await ingestWebsite({
      clearExisting: true,
    });

    console.log("✅ Knowledge base rebuild complete!");

    return NextResponse.json({
      success: true,
      message: "Knowledge base rebuilt successfully",
      stats: {
        urlsFound: stats.urlsFound,
        urlsProcessed: stats.urlsProcessed,
        errors: stats.errors,
        chunksCreated: stats.chunksCreated,
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
      { status: 500 },
    );
  }
}
