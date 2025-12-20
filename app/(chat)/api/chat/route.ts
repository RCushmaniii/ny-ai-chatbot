import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import { auth, type UserType } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/visibility-selector";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import type { ChatModel } from "@/lib/ai/models";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import {
  searchKnowledgeDirect,
  searchKnowledgeTool,
} from "@/lib/ai/tools/search-knowledge";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountBySessionId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import {
  handleCorsPreflightRequest,
  setCorsHeaders,
} from "@/lib/security/cors";
import {
  checkRateLimit,
  getClientIdentifier,
  validateMessage,
} from "@/lib/security/validation";
import { getOrCreateSessionId } from "@/lib/session";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import {
  convertToUIMessages,
  generateUUID,
  getTextFromMessage,
} from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return handleCorsPreflightRequest(origin);
}

let globalStreamContext: ResumableStreamContext | null = null;

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err,
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 }, // 24 hours
);

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL",
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  // Apply CORS
  const origin = request.headers.get("origin");

  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    const errorResponse = new ChatSDKError("bad_request:api").toResponse();
    return setCorsHeaders(errorResponse, origin);
  }

  // Rate limiting check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId);

  if (!rateLimitResult.allowed) {
    const errorResponse = new Response(
      JSON.stringify({ error: rateLimitResult.error }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter || 60),
        },
      },
    );
    return setCorsHeaders(errorResponse, origin);
  }

  try {
    const { id, message, selectedVisibilityType } = requestBody;

    const effectiveChatModel: ChatModel["id"] = DEFAULT_CHAT_MODEL;

    // SINGLE-TENANT: Support both authenticated admin and anonymous sessions
    const session = await auth();
    const sessionId = await getOrCreateSessionId();

    // Validate message content
    const messageText = getTextFromMessage(message);
    const validation = validateMessage(messageText);

    if (!validation.valid) {
      const errorResponse = new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
      return setCorsHeaders(errorResponse, origin);
    }

    // Rate limiting by sessionId (not userId)
    const messageCount = await getMessageCountBySessionId({
      sessionId,
      differenceInHours: 24,
    });

    // Use guest entitlements for anonymous users (daily limit)
    const userType: UserType = session?.user?.type || "guest";
    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];

    if (chat) {
      // Verify chat belongs to this session (not userId)
      if (chat.sessionId !== sessionId && chat.userId !== session?.user?.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      // Only fetch messages if chat already exists
      messagesFromDb = await getMessagesByChatId({ id });

      // Check session-based rate limit (20 messages per session) for non-admin users
      if (!session?.user) {
        const { RATE_LIMITS, RATE_LIMIT_MESSAGES } = await import(
          "@/lib/config/rate-limits"
        );
        const sessionMessages = messagesFromDb.length;

        if (sessionMessages >= RATE_LIMITS.messagesPerSession) {
          // Detect language for appropriate message
          let limitMessage: string = RATE_LIMIT_MESSAGES.en.sessionLimit;
          try {
            const { detectLanguage } = await import(
              "@/lib/utils/language-detector"
            );
            const messageText = getTextFromMessage(message) ?? "";
            const lang = detectLanguage(messageText);
            limitMessage = RATE_LIMIT_MESSAGES[lang].sessionLimit as string;
          } catch (error) {
            console.error(
              "Language detection failed for rate limit message:",
              error,
            );
          }

          const errorResponse = new Response(
            JSON.stringify({
              error: "rate_limit_exceeded",
              message: limitMessage,
              limit: RATE_LIMITS.messagesPerSession,
              current: sessionMessages,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": "3600", // 1 hour
              },
            },
          );
          return setCorsHeaders(errorResponse, origin);
        }
      }
    } else {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session?.user?.id, // Optional - only for admin
        sessionId, // Always set for anonymous tracking
        title,
        visibility: selectedVisibilityType,
      });
      // New chat - no need to fetch messages, it's empty
    }

    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Build knowledge context from vector DB for the latest user message.
    const latestUserText = getTextFromMessage(message) ?? "";

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const knowledgeResults = await searchKnowledgeDirect(latestUserText, {
      chatId: id,
      messageId: message.id,
      sessionId,
    });

    // Detect language from user's message (with error handling)
    let detectedLang: "en" | "es" = "en";
    let learnMoreText = "Learn more:";
    let translateUrlFn: ((url: string, lang: "en" | "es") => string) | null =
      null;

    try {
      const { detectLanguage, translateUrl, getLearnMoreText } = await import(
        "@/lib/utils/language-detector"
      );
      detectedLang = detectLanguage(latestUserText);
      learnMoreText = getLearnMoreText(detectedLang);
      translateUrlFn = translateUrl;
      console.log(
        `🌐 Detected language: ${detectedLang} for message: "${latestUserText.substring(0, 50)}..."`,
      );
    } catch (error) {
      console.error(
        "⚠️  Language detection failed, defaulting to English:",
        error,
      );
    }

    // Debug: Log knowledge results
    if (knowledgeResults.length > 0) {
      console.log(
        `📚 Found ${knowledgeResults.length} knowledge results for: "${latestUserText}"`,
      );
      knowledgeResults.forEach((r, idx) => {
        console.log(`  ${idx + 1}. URL: ${r.url}, Similarity: ${r.similarity}`);
      });
    } else {
      console.log(`⚠️  No knowledge results found for: "${latestUserText}"`);
    }

    // Extract unique URLs from knowledge results and translate them based on detected language
    const uniqueUrls = knowledgeResults.length
      ? Array.from(
          new Set(knowledgeResults.map((r) => r.url).filter(Boolean)),
        ).map((url) => {
          if (translateUrlFn) {
            const translated = translateUrlFn(url as string, detectedLang);
            console.log(`🔗 Translating URL: ${url} -> ${translated}`);
            return translated;
          }
          return url as string;
        })
      : [];

    const knowledgeContext = knowledgeResults.length
      ? `\n\n=== KNOWLEDGE BASE RESULTS ===
Use these facts in your answer, and prefer them over your own assumptions when talking about New York English Teacher.

${knowledgeResults
  .map((r, idx) => {
    const prefix = `${idx + 1}) `;
    const urlPart = r.url ? ` (source: ${r.url})` : "";
    return `${prefix}${r.content.trim()}${urlPart}`;
  })
  .join("\n\n")}

MANDATORY: After your answer, add this exact section:

${learnMoreText}
${uniqueUrls.map((url) => `- ${url}`).join("\n")}
=== END KNOWLEDGE BASE RESULTS ===`
      : "";

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    let finalMergedUsage: AppUsage | undefined;
    let streamErrorMessage: string | null = null;
    const emptyAssistantFallbackMessage =
      "I wasn’t able to generate a response. Please try again in a moment.";

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const systemPromptText = await systemPrompt({
          selectedChatModel: effectiveChatModel,
          requestHints,
        });
        const result = streamText({
          model: myProvider.languageModel(effectiveChatModel),
          system: `${systemPromptText}${knowledgeContext}`,
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools: [
            "searchKnowledge",
            "createDocument",
            "updateDocument",
            "requestSuggestions",
          ],
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: {
            searchKnowledge: searchKnowledgeTool,
            // Document tools only available for authenticated users
            ...(session
              ? {
                  createDocument: createDocument({ session, dataStream }),
                  updateDocument: updateDocument({ session, dataStream }),
                  requestSuggestions: requestSuggestions({
                    session,
                    dataStream,
                  }),
                }
              : {}),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async ({ usage }) => {
            try {
              const providers = await getTokenlensCatalog();
              const modelId =
                myProvider.languageModel(effectiveChatModel).modelId;
              if (!modelId) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              if (!providers) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              const summary = getUsage({ modelId, usage, providers });
              finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            } catch (err) {
              console.warn("TokenLens enrichment failed", err);
              finalMergedUsage = usage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        const messagesToSave = messages
          .map((currentMessage) => {
            if (currentMessage.role !== "assistant") return currentMessage;

            const parts = currentMessage.parts;

            if (Array.isArray(parts) && parts.length > 0) {
              return currentMessage;
            }

            return {
              ...currentMessage,
              parts: [
                {
                  type: "text",
                  text: streamErrorMessage ?? emptyAssistantFallbackMessage,
                },
              ],
            };
          })
          .filter(Boolean) as typeof messages;

        await saveMessages({
          messages: messagesToSave.map((currentMessage) => ({
            id: currentMessage.id,
            role: currentMessage.role,
            parts: currentMessage.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });

        if (finalMergedUsage) {
          try {
            await updateChatLastContextById({
              chatId: id,
              context: finalMergedUsage,
            });
          } catch (err) {
            console.warn("Unable to persist last usage for chat", id, err);
          }
        }
      },
      onError: (error) => {
        const vercelId = request.headers.get("x-vercel-id");
        console.error("Chat stream error:", error, { vercelId, chatId: id });

        const rawMessage =
          error instanceof Error ? error.message : String(error ?? "");
        const normalized = rawMessage.toLowerCase();

        if (
          normalized.includes("ai gateway requires a valid credit card") ||
          normalized.includes("activate_gateway")
        ) {
          streamErrorMessage =
            "AI Gateway needs billing enabled (credit card) to serve requests. Please add a card in Vercel → AI Gateway, then try again.";
        } else if (
          normalized.includes("openai_api_key") ||
          normalized.includes("api key") ||
          normalized.includes("no api key") ||
          normalized.includes("missing api key")
        ) {
          streamErrorMessage =
            "The chatbot model isn’t configured in production (missing OpenAI API key). Add OPENAI_API_KEY in Vercel Environment Variables, then redeploy.";
        } else if (
          normalized.includes("401") ||
          normalized.includes("unauthorized")
        ) {
          streamErrorMessage =
            "The chatbot model credentials were rejected (401). Double-check your OPENAI_API_KEY (or AI Gateway config) in Vercel, then redeploy.";
        } else if (
          normalized.includes("429") ||
          normalized.includes("rate limit")
        ) {
          streamErrorMessage =
            "The chatbot is temporarily rate-limited by the model provider. Please wait a minute and try again.";
        } else if (
          normalized.includes("timeout") ||
          normalized.includes("timed out")
        ) {
          streamErrorMessage =
            "The model provider timed out generating a response. Please try again.";
        } else {
          streamErrorMessage =
            "I ran into a technical issue generating a response. Please try again in a moment.";
        }

        if (vercelId) {
          streamErrorMessage = `${streamErrorMessage} (ref: ${vercelId})`;
        }
        return streamErrorMessage;
      },
    });

    // const streamContext = getStreamContext();

    // if (streamContext) {
    //   return new Response(
    //     await streamContext.resumableStream(streamId, () =>
    //       stream.pipeThrough(new JsonToSseTransformStream())
    //     )
    //   );
    // }

    const response = new Response(
      stream.pipeThrough(new JsonToSseTransformStream()),
    );
    return setCorsHeaders(response, origin);
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return setCorsHeaders(error.toResponse(), origin);
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests",
      )
    ) {
      return setCorsHeaders(
        new ChatSDKError("bad_request:activate_gateway").toResponse(),
        origin,
      );
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return setCorsHeaders(
      new ChatSDKError("offline:chat").toResponse(),
      origin,
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
