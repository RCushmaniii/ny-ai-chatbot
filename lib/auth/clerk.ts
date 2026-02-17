import "server-only";

/**
 * Test-safe wrappers for Clerk server functions.
 * In test/CI mode (PLAYWRIGHT=true), these return safe defaults
 * instead of calling Clerk (which requires valid keys and middleware).
 */

const isTestEnv = Boolean(
  process.env.PLAYWRIGHT || process.env.CI_PLAYWRIGHT,
);

type AuthResult = { userId: string | null };
type ClerkUser = {
  id: string;
  primaryEmailAddress?: { emailAddress: string } | null;
  fullName?: string | null;
  imageUrl?: string | null;
} | null;

export async function safeAuth(): Promise<AuthResult> {
  if (isTestEnv) return { userId: null };
  const { auth } = await import("@clerk/nextjs/server");
  return auth();
}

export async function safeCurrentUser(): Promise<ClerkUser> {
  if (isTestEnv) return null;
  const { currentUser } = await import("@clerk/nextjs/server");
  return currentUser();
}
