import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { botSettings } from "@/lib/db/schema";

// Default embed settings - hardcoded URL for reliability
const DEFAULT_EMBED_SETTINGS = {
  buttonColor: "#4f46e5",
  buttonSize: 1.0,
  position: "bottom-right" as const,
  welcomeMessage: "",
  showWelcomeMessage: false,
  placeholder: "Type your message...",
  botIcon: "https://ny-ai-chatbot.vercel.app/images/chatbot-icon.jpg",
  suggestedQuestions: [
    "What are the prices for classes?",
    "What services do you offer?",
    "How do I book a session?",
  ],
};

// CORS headers for embed widget (public endpoint)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return NextResponse.json(DEFAULT_EMBED_SETTINGS, {
        headers: corsHeaders,
      });
    }

    const client = postgres(postgresUrl);
    const db = drizzle(client);

    // Get the most recent bot settings (no auth required for embed)
    const settings = await db
      .select()
      .from(botSettings)
      .orderBy(desc(botSettings.updatedAt))
      .limit(1);

    if (settings.length === 0 || !settings[0].embedSettings) {
      // Return defaults if no settings found
      return NextResponse.json(DEFAULT_EMBED_SETTINGS, {
        headers: corsHeaders,
      });
    }

    // Merge with defaults to ensure all fields are present
    const embedSettings = {
      ...DEFAULT_EMBED_SETTINGS,
      ...settings[0].embedSettings,
    };

    return NextResponse.json(embedSettings, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching embed settings:", error);
    // Return defaults on error
    return NextResponse.json(DEFAULT_EMBED_SETTINGS, { headers: corsHeaders });
  }
}
