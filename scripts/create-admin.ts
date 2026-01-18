/**
 * Script to create an admin user for single-tenant chatbot
 * Usage: npx tsx scripts/create-admin.ts
 */

import { hash } from "bcrypt-ts";
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
  const password = process.env.ADMIN_PASSWORD || "changeme123";
  const dbUrl = process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.error("❌ POSTGRES_URL not found in environment variables");
    process.exit(1);
  }

  console.log("🔧 Creating admin user...");
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
      console.log("⚠️  Admin user already exists!");
      console.log("✅ You can login with this email at /login");
      await client.end();
      return;
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new admin user
    await db.insert(user).values({
      email,
      password: hashedPassword,
    });

    console.log("✅ Admin user created successfully!");
    console.log("\n📋 Login credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log("\n🔗 Login at: http://localhost:3000/login");
    console.log("\n⚠️  IMPORTANT: Change your password after first login!");

    await client.end();
  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
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
