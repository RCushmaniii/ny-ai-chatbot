import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getMissingKnowledge } from "@/lib/db/queries";

export async function GET(req: Request) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? 30);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const { groups, raw } = await getMissingKnowledge({
      days,
      limit,
      includeRaw: true,
    });

    return NextResponse.json({ groups, raw });
  } catch (error) {
    console.error("Error fetching missing knowledge:", error);
    return NextResponse.json(
      { error: "Failed to fetch missing knowledge" },
      { status: 500 },
    );
  }
}
