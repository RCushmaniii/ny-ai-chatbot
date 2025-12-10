import { auth } from "@/app/(auth)/auth";
import { getGlobalBotSettings, updateGlobalBotSettings } from "@/lib/db/queries";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SINGLE-TENANT: Get global bot settings (no userId filtering)
    const settings = await getGlobalBotSettings();

    if (!settings) {
      return Response.json({ error: "Settings not found" }, { status: 404 });
    }

    return Response.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      botName,
      customInstructions,
      starterQuestions,
      colors,
      settings: userSettings,
      embedSettings,
    } = body;

    // SINGLE-TENANT: Update global bot settings (upsert pattern)
    await updateGlobalBotSettings({
      botName,
      customInstructions,
      starterQuestions,
      colors,
      settings: userSettings,
      embedSettings,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return Response.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
