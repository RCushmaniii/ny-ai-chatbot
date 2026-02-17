import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getMissingKnowledge,
  getRagHitRatio,
  getRagTrends,
  getTopChunks,
  getTopSources,
} from "@/lib/db/queries";

function isMissingRelationError(error: unknown, relationName: string) {
  if (!error || typeof error !== "object") return false;
  const anyErr = error as any;
  const message =
    typeof anyErr?.message === "string" ? (anyErr.message as string) : "";
  const code = typeof anyErr?.code === "string" ? (anyErr.code as string) : "";

  if (code === "42P01") return true;
  return (
    message.toLowerCase().includes("does not exist") &&
    message.toLowerCase().includes(relationName.toLowerCase())
  );
}

function emptyOverviewResponse() {
  return {
    hitRatio: { hits: 0, misses: 0, ratio: 0, total: 0 },
    trends: [],
    topSources: [],
    topChunks: [],
    missingKnowledge: [],
  };
}

export async function GET(req: Request) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? 30);

    const [hitRatio, topSources, missing, topChunks, trends] =
      await Promise.all([
        getRagHitRatio(days),
        getTopSources({ days, limit: 10 }),
        getMissingKnowledge({ days, limit: 20 }),
        getTopChunks({ days, limit: 20 }),
        getRagTrends(days),
      ]);

    return NextResponse.json({
      hitRatio,
      trends,
      topSources,
      topChunks,
      missingKnowledge: missing.groups,
    });
  } catch (error) {
    console.error("Error fetching insights overview:", error);

    // Common local/dev case: DB schema not migrated yet (knowledge_events missing).
    // Don't crash the UI; return an empty dashboard.
    if (isMissingRelationError(error, "knowledge_events")) {
      return NextResponse.json(emptyOverviewResponse(), { status: 200 });
    }

    const details =
      process.env.NODE_ENV !== "production" &&
      typeof (error as any)?.message === "string" &&
      (error as any).message
        ? String((error as any).message)
        : undefined;

    // In dev, prefer a functional UI over a hard failure.
    // Return an empty payload so the Insights tab can render an empty state.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          ...emptyOverviewResponse(),
          ...(details ? { details } : {}),
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch insights overview",
        ...(details ? { details } : {}),
      },
      { status: 500 },
    );
  }
}
