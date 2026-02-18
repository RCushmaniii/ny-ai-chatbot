import type { NextRequest } from "next/server";
import { getChatsBySessionId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { getOrCreateSessionId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
    const startingAfter = searchParams.get("starting_after");
    const endingBefore = searchParams.get("ending_before");

    if (startingAfter && endingBefore) {
      return new ChatSDKError(
        "bad_request:api",
        "Only one of starting_after or ending_before can be provided.",
      ).toResponse();
    }

    // SINGLE-TENANT: Use sessionId for anonymous users
    const sessionId = await getOrCreateSessionId();

    // Simple pagination by limit only (no cursor-based pagination for now)
    const chats = await getChatsBySessionId({
      sessionId,
      limit,
    });

    return Response.json({ chats, hasMore: chats.length === limit });
  } catch (error) {
    console.error("[API /history] Unhandled error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  // SINGLE-TENANT: Delete all chats for this session
  const _sessionId = await getOrCreateSessionId();

  // For now, we'll implement this later if needed
  // Deleting all chats for a session is less common in anonymous mode
  return new ChatSDKError(
    "bad_request:history",
    "Bulk delete not available for anonymous sessions",
  ).toResponse();
}
