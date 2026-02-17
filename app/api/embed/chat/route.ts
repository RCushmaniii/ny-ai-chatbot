import { generateText } from "ai";
import { NextResponse } from "next/server";
import { regularPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { searchKnowledgeDirect } from "@/lib/ai/tools/search-knowledge";
import {
  checkRateLimitRedis,
  getClientIdentifier,
  validateMessage,
} from "@/lib/security/validation";
import {
  detectLanguage,
  getLearnMoreText,
  translateUrl,
} from "@/lib/utils/language-detector";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimitRedis(clientId);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter || 60),
          },
        },
      );
    }

    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // Validate message content
    const validation = validateMessage(message);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Search knowledge base
    const knowledgeResults = await searchKnowledgeDirect(message);

    // Detect language
    const detectedLang = detectLanguage(message);
    const learnMoreText = getLearnMoreText(detectedLang);

    // Build context with knowledge results - use the same system prompt as main chat
    let context = regularPrompt;

    if (knowledgeResults.length > 0) {
      const uniqueUrls = Array.from(
        new Set(knowledgeResults.map((r) => r.url).filter(Boolean)),
      ).map((url) => translateUrl(url as string, detectedLang));

      context += `\n\nKnowledge base results:\n${knowledgeResults
        .map((r) => r.content)
        .join("\n\n")}`;

      if (uniqueUrls.length > 0) {
        context += `\n\nInclude these links at the end of your response:\n${learnMoreText}\n${uniqueUrls.map((url) => `- ${url}`).join("\n")}`;
      }
    }

    // Generate response
    const model = myProvider.languageModel("chat-model");
    const { text } = await generateText({
      model,
      messages: [
        { role: "system", content: context },
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Embed chat error:", error);

    const rawMessage =
      error instanceof Error ? error.message : String(error ?? "");
    const normalized = rawMessage.toLowerCase();

    // Surface actionable error details instead of generic 500
    let userMessage =
      "Failed to process message. Please try again in a moment.";
    let status = 500;

    if (
      normalized.includes("ai gateway requires a valid credit card") ||
      normalized.includes("activate_gateway")
    ) {
      userMessage =
        "AI Gateway needs billing enabled. Please contact the site administrator.";
      status = 502;
    } else if (
      normalized.includes("openai_api_key") ||
      normalized.includes("api key") ||
      normalized.includes("no api key") ||
      normalized.includes("missing api key")
    ) {
      userMessage =
        "The chatbot is not configured correctly (missing API key). Please contact the site administrator.";
      status = 502;
    } else if (
      normalized.includes("401") ||
      normalized.includes("unauthorized")
    ) {
      userMessage =
        "The chatbot credentials were rejected. Please contact the site administrator.";
      status = 502;
    } else if (
      normalized.includes("429") ||
      normalized.includes("rate limit")
    ) {
      userMessage =
        "The chatbot is temporarily rate-limited. Please wait a minute and try again.";
      status = 429;
    } else if (
      normalized.includes("timeout") ||
      normalized.includes("timed out")
    ) {
      userMessage = "The response took too long to generate. Please try again.";
      status = 504;
    }

    return NextResponse.json({ error: userMessage }, { status });
  }
}
