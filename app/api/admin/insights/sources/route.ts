import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getTopSources } from "@/lib/db/queries";

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
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const items = await getTopSources({ days, limit });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching top sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch top sources" },
      { status: 500 }
    );
  }
}
