/**
 * Daily Usage Report Generator
 *
 * Generates and emails a daily summary of chatbot usage and costs
 * Only sends email if there was activity that day
 */

import postgres from "postgres";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);

export interface DailyUsageStats {
  date: string;
  totalChats: number;
  totalMessages: number;
  totalSessions: number;
  uniqueUsers: number; // Based on sessions
  averageMessagesPerChat: number;
  languageBreakdown: {
    en: number;
    es: number;
  };
  estimatedCost: number;
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
}

/**
 * Get usage statistics for a specific date
 */
export async function getDailyUsageStats(
  date: Date,
): Promise<DailyUsageStats | null> {
  try {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get total messages for the day
    const messageStats = await client`
      SELECT COUNT(*) as total_messages
      FROM "Message"
      WHERE "createdAt" >= ${startOfDay}
        AND "createdAt" <= ${endOfDay}
    `;

    const totalMessages = Number(messageStats[0]?.total_messages || 0);

    // If no messages, return null (no report needed)
    if (totalMessages === 0) {
      return null;
    }

    // Get chat stats
    const chatStats = await client`
      SELECT COUNT(DISTINCT id) as total_chats,
             COUNT(DISTINCT "sessionId") as total_sessions
      FROM "Chat"
      WHERE "createdAt" >= ${startOfDay}
        AND "createdAt" <= ${endOfDay}
    `;

    const totalChats = Number(chatStats[0]?.total_chats || 0);
    const totalSessions = Number(chatStats[0]?.total_sessions || 0);

    // Get language breakdown (estimate based on message content)
    const languageStats = await client`
      SELECT 
        SUM(CASE WHEN content ~* '[áéíóúñ¿¡]' THEN 1 ELSE 0 END) as spanish_messages,
        COUNT(*) - SUM(CASE WHEN content ~* '[áéíóúñ¿¡]' THEN 1 ELSE 0 END) as english_messages
      FROM "Message"
      WHERE "createdAt" >= ${startOfDay}
        AND "createdAt" <= ${endOfDay}
        AND role = 'user'
    `;

    const spanishMessages = Number(languageStats[0]?.spanish_messages || 0);
    const englishMessages = Number(languageStats[0]?.english_messages || 0);

    // Get top questions (first user message in each chat)
    const topQuestionsResult = await client`
      SELECT content, COUNT(*) as count
      FROM (
        SELECT DISTINCT ON (m."chatId") m.content
        FROM "Message" m
        INNER JOIN "Chat" c ON m."chatId" = c.id
        WHERE m."createdAt" >= ${startOfDay}
          AND m."createdAt" <= ${endOfDay}
          AND m.role = 'user'
        ORDER BY m."chatId", m."createdAt" ASC
      ) first_messages
      GROUP BY content
      ORDER BY count DESC
      LIMIT 5
    `;

    const topQuestions = topQuestionsResult.map((row: any) => ({
      question: String(row.content).substring(0, 100), // Truncate long questions
      count: Number(row.count),
    }));

    // Estimate cost
    // Rough estimate: $0.01 per message (includes prompt + completion + embeddings)
    const estimatedCost = totalMessages * 0.01;

    // Calculate averages
    const averageMessagesPerChat =
      totalChats > 0 ? totalMessages / totalChats : 0;

    return {
      date: dateStr,
      totalChats,
      totalMessages,
      totalSessions,
      uniqueUsers: totalSessions, // Each session = unique user
      averageMessagesPerChat: Math.round(averageMessagesPerChat * 10) / 10, // Round to 1 decimal
      languageBreakdown: {
        en: englishMessages,
        es: spanishMessages,
      },
      estimatedCost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimals
      topQuestions,
    };
  } catch (error) {
    console.error("Error getting daily usage stats:", error);
    throw error;
  }
}

/**
 * Format usage stats as HTML email
 */
export function formatUsageReportEmail(stats: DailyUsageStats): string {
  const totalLanguageMessages =
    stats.languageBreakdown.en + stats.languageBreakdown.es;
  const enPercent =
    totalLanguageMessages > 0
      ? Math.round((stats.languageBreakdown.en / totalLanguageMessages) * 100)
      : 0;
  const esPercent =
    totalLanguageMessages > 0
      ? Math.round((stats.languageBreakdown.es / totalLanguageMessages) * 100)
      : 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; margin-top: 5px; }
    .cost { color: #059669; }
    .section { margin: 20px 0; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #1f2937; }
    .question-list { background: white; padding: 15px; border-radius: 6px; }
    .question-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .question-item:last-child { border-bottom: none; }
    .question-text { color: #374151; }
    .question-count { color: #6b7280; font-size: 14px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📊 Daily Chatbot Usage Report</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${stats.date}</p>
    </div>
    
    <div class="content">
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Total Messages</div>
          <div class="stat-value">${stats.totalMessages}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Chats</div>
          <div class="stat-value">${stats.totalChats}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unique Users</div>
          <div class="stat-value">${stats.uniqueUsers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Estimated Cost</div>
          <div class="stat-value cost">$${stats.estimatedCost.toFixed(2)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📈 Engagement Metrics</div>
        <div class="stat-card">
          <div class="stat-label">Average Messages per Chat</div>
          <div class="stat-value">${stats.averageMessagesPerChat}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🌍 Language Breakdown</div>
        <div class="stat-card">
          <div style="margin-bottom: 10px;">
            <span style="font-weight: bold;">English:</span> ${stats.languageBreakdown.en} messages (${enPercent}%)
          </div>
          <div>
            <span style="font-weight: bold;">Spanish:</span> ${stats.languageBreakdown.es} messages (${esPercent}%)
          </div>
        </div>
      </div>

      ${
        stats.topQuestions.length > 0
          ? `
      <div class="section">
        <div class="section-title">💬 Top Questions</div>
        <div class="question-list">
          ${stats.topQuestions
            .map(
              (q) => `
            <div class="question-item">
              <div class="question-text">"${q.question}${q.question.length >= 100 ? "..." : ""}"</div>
              <div class="question-count">Asked ${q.count} time${q.count > 1 ? "s" : ""}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      `
          : ""
      }

      <div class="footer">
        <p>This report was automatically generated by your NY English Teacher chatbot.</p>
        <p>View detailed analytics in your <a href="https://ny-ai-chatbot.vercel.app/admin">admin dashboard</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send usage report email
 */
export async function sendUsageReportEmail(
  stats: DailyUsageStats,
  toEmail: string,
): Promise<void> {
  try {
    const htmlContent = formatUsageReportEmail(stats);

    // Use Resend API for sending emails
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set, skipping email send");
      console.log("Email content would have been:", htmlContent);
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NY English Teacher Chatbot <noreply@nyenglishteacher.com>",
        to: [toEmail],
        subject: `📊 Daily NY English Teacher Chatbot Report - ${stats.date} ($${stats.estimatedCost.toFixed(2)} spent)`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log(`✅ Daily usage report sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending usage report email:", error);
    throw error;
  }
}
