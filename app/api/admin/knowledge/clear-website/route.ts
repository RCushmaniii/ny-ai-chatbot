import postgres from "postgres";
import { requireAdmin } from "@/lib/auth/admin";

export async function DELETE() {
  try {
    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return Response.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const client = postgres(postgresUrl);

    const adminId = await requireAdmin();
    if (!adminId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear the website_content table
    await client`TRUNCATE TABLE website_content`;

    return Response.json({
      success: true,
      message: "Website content cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing website content:", error);
    return Response.json(
      { error: "Failed to clear website content" },
      { status: 500 },
    );
  }
}
