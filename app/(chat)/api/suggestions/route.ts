import { getDbUserId } from "@/lib/auth/admin";
import { safeAuth, safeCurrentUser } from "@/lib/auth/clerk";
import { getSuggestionsByDocumentId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter documentId is required.",
    ).toResponse();
  }

  const { userId: clerkUserId } = await safeAuth();
  if (!clerkUserId) {
    return new ChatSDKError("unauthorized:suggestions").toResponse();
  }

  const clerkUser = await safeCurrentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!email) {
    return new ChatSDKError("unauthorized:suggestions").toResponse();
  }

  const dbUserId = await getDbUserId(email);
  if (!dbUserId) {
    return new ChatSDKError("unauthorized:suggestions").toResponse();
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.userId !== dbUserId) {
    return new ChatSDKError("forbidden:api").toResponse();
  }

  return Response.json(suggestions, { status: 200 });
}
