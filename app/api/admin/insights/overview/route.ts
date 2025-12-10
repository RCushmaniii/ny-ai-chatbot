import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getRagHitRatio,
  getTopSources,
  getMissingKnowledge,
  getTopChunks,
  getRagTrends,
} from "@/lib/db/queries";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Single-tenant: Only admin can access
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@nyenglishteacher.com";
    if (session.user.email !== ADMIN_EMAIL) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? 30);

    const [hitRatio, topSources, missing, topChunks, trends] = await Promise.all([
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
    return NextResponse.json(
      { error: "Failed to fetch insights overview" },
      { status: 500 }
    );
  }
}
