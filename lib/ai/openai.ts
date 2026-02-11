import { createOpenAI } from "@ai-sdk/openai";

// Create OpenAI provider that calls the OpenAI API directly,
// bypassing Vercel AI Gateway (which requires credit card setup).
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});
