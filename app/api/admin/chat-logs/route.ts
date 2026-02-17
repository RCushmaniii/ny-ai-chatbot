import { auth } from "@/app/(auth)/auth";
import {
  getAllChatsWithMessages,
  getChatWithFullTranscript,
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
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const searchQuery = searchParams.get("search") || undefined;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const chatId = searchParams.get("chatId");

    // If chatId is provided, return full transcript
    if (chatId) {
      const transcript = await getChatWithFullTranscript(chatId);
      return Response.json(transcript);
    }

    // Parse dates
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Get paginated chat logs
    const result = await getAllChatsWithMessages({
      limit,
      offset,
      searchQuery,
      startDate,
      endDate,
    });

    return Response.json(result);
  } catch (error) {
    console.error("Error fetching chat logs:", error);
    return Response.json(
      { error: "Failed to fetch chat logs" },
      { status: 500 },
    );
  }
}
