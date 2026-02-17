import "server-only";

import { safeAuth, safeCurrentUser } from "@/lib/auth/clerk";
import { getUser } from "@/lib/db/queries";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@nyenglishteacher.com";

/**
 * Check if the current request is from an authenticated admin.
 * Returns the DB user UUID or null.
 */
export async function requireAdmin(): Promise<string | null> {
  const { userId } = await safeAuth();
  if (!userId) return null;

  const user = await safeCurrentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email || email !== ADMIN_EMAIL) return null;

  return getDbUserId(email);
}

/**
 * Look up a DB user by email and return their UUID.
 * Returns null if no matching user exists.
 */
export async function getDbUserId(email: string): Promise<string | null> {
  const users = await getUser(email);
  return users.length > 0 ? users[0].id : null;
}
