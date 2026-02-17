/**
 * Script to ensure admin user row exists in the database.
 * With Clerk (Google OAuth), this just creates the DB row for the admin email.
 * Authentication is handled entirely by Clerk — no password needed.
 *
 * Usage: npx tsx scripts/create-admin.ts
 */

import { config as dotenvConfig } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Load environment variables
dotenvConfig({ path: ".env.development.local" });
dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });

// Database schema (minimal for this script)
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const dbUrl = process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.error("POSTGRES_URL not found in environment variables");
    process.exit(1);
  }

  console.log("Creating admin user row...");
  console.log(`Email: ${email}`);

  const client = postgres(dbUrl);
  const db = drizzle(client);

  try {
    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (existingUsers.length > 0) {
      console.log("Admin user already exists in database.");
      console.log(`User ID: ${existingUsers[0].id}`);
      await client.end();
      return;
    }

    // Create new admin user (no password — Clerk handles auth)
    const [created] = await db
      .insert(user)
      .values({ email, password: null })
      .returning();

    console.log("Admin user created successfully!");
    console.log(`User ID: ${created.id}`);
    console.log(`Email: ${created.email}`);
    console.log("\nSign in via Clerk (Google OAuth) at /sign-in");

    await client.end();
  } catch (error) {
    console.error("Failed to create admin user:", error);
    await client.end();
    process.exit(1);
  }
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
