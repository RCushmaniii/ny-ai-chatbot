/**
 * Daily Usage Report Cron Job
 *
 * Runs daily at midnight to generate and email usage report
 * Only sends email if there was activity that day
 *
 * Vercel Cron: https://vercel.com/docs/cron-jobs
 */

import { NextResponse } from "next/server";
import {
  getDailyUsageStats,
  sendUsageReportEmail,
} from "@/lib/reports/daily-usage";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds max

export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request from Vercel
    // Vercel automatically adds the Authorization header with the cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not set");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn(
        "Unauthorized cron request - missing or invalid auth header",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕐 Running daily usage report cron job...");

    // Get yesterday's stats (run at midnight, so report on previous day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const stats = await getDailyUsageStats(yesterday);

    // If no activity, skip email
    if (!stats) {
      console.log("✅ No activity yesterday, skipping report");
      return NextResponse.json({
        success: true,
        message: "No activity to report",
        date: yesterday.toISOString().split("T")[0],
      });
    }

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.warn("⚠️  ADMIN_EMAIL not set, cannot send report");
      return NextResponse.json(
        {
          success: false,
          error: "ADMIN_EMAIL not configured",
          stats,
        },
        { status: 500 },
      );
    }

    await sendUsageReportEmail(stats, adminEmail);

    console.log(`✅ Daily report sent successfully for ${stats.date}`);
    console.log(
      `   Messages: ${stats.totalMessages}, Cost: $${stats.estimatedCost.toFixed(2)}`,
    );

    return NextResponse.json({
      success: true,
      message: "Report sent successfully",
      stats: {
        date: stats.date,
        totalMessages: stats.totalMessages,
        totalChats: stats.totalChats,
        estimatedCost: stats.estimatedCost,
      },
    });
  } catch (error) {
    console.error("❌ Error in daily report cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
