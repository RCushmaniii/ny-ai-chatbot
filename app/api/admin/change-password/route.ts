import { compare, hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { auth } from "@/app/(auth)/auth";
import { user } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return Response.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const client = postgres(postgresUrl);
    const db = drizzle(client);

    const session = await auth();

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Get current user from database
    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!currentUser || !currentUser.password) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const passwordMatch = await compare(currentPassword, currentUser.password);

    if (!passwordMatch) {
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await db
      .update(user)
      .set({ password: hashedPassword })
      .where(eq(user.id, session.user.id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return Response.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
