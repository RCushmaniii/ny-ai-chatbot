import { auth } from "@/app/(auth)/auth";
import {
  getAnalyticsData,
  getDailyStats,
  getTopQuestions,
} from "@/lib/db/queries";

function getAdminEmail() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL environment variable is required");
  return email;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email !== getAdminEmail()) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30";
    const _days = parseInt(period, 10);

    // Get all analytics data in parallel
    const [stats7, stats30, statsAll, topQuestions, dailyStats] =
      await Promise.all([
        getAnalyticsData(7),
        getAnalyticsData(30),
        getAnalyticsData(365), // All time (1 year)
        getTopQuestions(10),
        getDailyStats(14),
      ]);

    return Response.json({
      stats: {
        last7Days: stats7,
        last30Days: stats30,
        allTime: statsAll,
      },
      topQuestions,
      dailyStats,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return Response.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
