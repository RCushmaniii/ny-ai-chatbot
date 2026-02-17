import postgres from "postgres";
import { auth } from "@/app/(auth)/auth";

function getAdminEmail() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL environment variable is required");
  return email;
}

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

    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email !== getAdminEmail()) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
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
