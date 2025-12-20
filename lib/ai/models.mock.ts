import type { LanguageModel } from "ai";

function getLatestUserText(options: any): string {
  const candidates = [options?.messages, options?.prompt, options?.input];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (Array.isArray(candidate)) {
      for (let i = candidate.length - 1; i >= 0; i -= 1) {
        const item = candidate[i];
        if (!item) continue;

        if (item.role === "user") {
          const content = item.content;
          if (typeof content === "string") return content;

          if (Array.isArray(content)) {
            const textParts = content
              .map((part: any) =>
                typeof part?.text === "string" ? part.text : "",
              )
              .filter(Boolean);
            if (textParts.length > 0) return textParts.join("\n");
          }

          if (Array.isArray(item.parts)) {
            const textParts = item.parts
              .map((part: any) =>
                typeof part?.text === "string" ? part.text : "",
              )
              .filter(Boolean);
            if (textParts.length > 0) return textParts.join("\n");
          }
        }
      }
    }

    if (typeof candidate === "string") return candidate;
  }

  return "";
}

function getMockResponseText(
  userText: string,
  kind: "chat" | "reasoning",
): string {
  const normalized = userText.toLowerCase();

  if (normalized.includes("what are the advantages of")) {
    return "With Next.js, you can ship fast!";
  }

  if (normalized.includes("why is grass green")) {
    return kind === "reasoning"
      ? "It's just green duh!\n<think>Grass is green because of chlorophyll absorption!</think>"
      : "It's just green duh!";
  }

  if (normalized.includes("why is the sky blue")) {
    return kind === "reasoning"
      ? "It's just blue duh!\n<think>The sky is blue because of rayleigh scattering!</think>"
      : "It's just blue duh!";
  }

  if (normalized.includes("who painted this")) {
    return "This painting is by Monet!";
  }

  if (
    normalized.includes("what's the weather in sf") ||
    normalized.includes("weather in sf")
  ) {
    return "The current temperature in San Francisco is 17°C.";
  }

  return "Mock response";
}

const createMockModel = (
  kind: "chat" | "reasoning" = "chat",
): LanguageModel => {
  return {
    specificationVersion: "v2",
    provider: "mock",
    modelId: "mock-model",
    defaultObjectGenerationMode: "tool",
    supportedUrls: [],
    supportsImageUrls: false,
    supportsStructuredOutputs: false,
    doGenerate: async (options: any) => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: "stop",
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      content: [
        {
          type: "text",
          text: getMockResponseText(getLatestUserText(options), kind),
        },
      ],
      warnings: [],
    }),
    doStream: async (options: any) => ({
      stream: new ReadableStream({
        start(controller) {
          const responseText = getMockResponseText(
            getLatestUserText(options),
            kind,
          );
          controller.enqueue({
            type: "text-delta",
            id: "mock-id",
            delta: responseText,
          });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  } as unknown as LanguageModel;
};

export const chatModel = createMockModel("chat");
export const reasoningModel = createMockModel("reasoning");
export const titleModel = createMockModel("chat");
export const artifactModel = createMockModel("chat");
