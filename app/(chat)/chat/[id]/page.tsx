import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { getDbUserId } from "@/lib/auth/admin";
import { safeAuth, safeCurrentUser } from "@/lib/auth/clerk";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { getOrCreateSessionId } from "@/lib/session";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  // Get Clerk user (if signed in) and anonymous sessionId
  const { userId: clerkUserId } = await safeAuth();
  const sessionId = await getOrCreateSessionId();

  // Resolve DB user ID for signed-in users
  let dbUserId: string | undefined;
  if (clerkUserId) {
    const clerkUser = await safeCurrentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    if (email) {
      dbUserId = (await getDbUserId(email)) ?? undefined;
    }
  }

  // Private chats: must be the owner (by userId or sessionId)
  if (chat.visibility === "private") {
    const isOwner =
      (dbUserId && chat.userId === dbUserId) ||
      (chat.sessionId && chat.sessionId === sessionId);

    if (!isOwner) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({ id });
  const uiMessages = convertToUIMessages(messagesFromDb);

  const isReadonly =
    dbUserId !== chat.userId &&
    (!chat.sessionId || chat.sessionId !== sessionId);

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={isReadonly}
      />
      <DataStreamHandler />
    </>
  );
}
