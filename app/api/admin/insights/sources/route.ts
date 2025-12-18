import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getTopSources } from "@/lib/db/queries";

function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    "info@nyenglishteacher.com"
  );
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Single-tenant: Only admin can access
    if (session.user.email !== getAdminEmail()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
