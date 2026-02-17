import { safeAuth, safeCurrentUser } from "@/lib/auth/clerk";
import { getDbUserId } from "@/lib/auth/admin";
import { getChatById, getVotesByChatId, voteMessage } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { getOrCreateSessionId } from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter chatId is required.",
    ).toResponse();
  }

  const { userId: clerkUserId } = await safeAuth();
  const sessionId = await getOrCreateSessionId();

  let dbUserId: string | undefined;
  if (clerkUserId) {
    const clerkUser = await safeCurrentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    if (email) {
      dbUserId = (await getDbUserId(email)) ?? undefined;
    }
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError("not_found:chat").toResponse();
  }

  // Must own the chat
  const isOwner =
    (dbUserId && chat.userId === dbUserId) ||
    (chat.sessionId && chat.sessionId === sessionId);

  if (!isOwner) {
    return new ChatSDKError("forbidden:vote").toResponse();
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: "up" | "down" } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameters chatId, messageId, and type are required.",
    ).toResponse();
  }

  const { userId: clerkUserId } = await safeAuth();
  const sessionId = await getOrCreateSessionId();

  let dbUserId: string | undefined;
  if (clerkUserId) {
    const clerkUser = await safeCurrentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    if (email) {
      dbUserId = (await getDbUserId(email)) ?? undefined;
    }
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError("not_found:vote").toResponse();
  }

  const isOwner =
    (dbUserId && chat.userId === dbUserId) ||
    (chat.sessionId && chat.sessionId === sessionId);

  if (!isOwner) {
    return new ChatSDKError("forbidden:vote").toResponse();
  }

  await voteMessage({
    chatId,
    messageId,
    type,
  });

  return new Response("Message voted", { status: 200 });
}
