import "server-only";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

/**
 * Session management for anonymous chat users
 * Uses HTTP-only cookies to track sessions across requests
 */

const SESSION_COOKIE_NAME = "chatbot_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Get existing sessionId from cookie or create a new one
 * SessionId format: UUID without hyphens (32 chars)
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    // Generate new sessionId (UUID without hyphens)
    sessionId = randomUUID().replace(/-/g, "");

    // Set cookie with security flags
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true, // Prevent JavaScript access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: SESSION_MAX_AGE,
      path: "/", // Available across entire site
    });

    console.log(`[Session] Created new session: ${sessionId.substring(0, 8)}...`);
  }

  return sessionId;
}

/**
 * Get existing sessionId without creating a new one
 * Returns null if no session exists
 */
export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

/**
 * Clear the session cookie (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  console.log("[Session] Session cleared");
}

/**
 * Refresh session cookie expiration
 * Call this on each request to extend session lifetime
 */
export async function refreshSession(): Promise<void> {
  const sessionId = await getSessionId();
  if (sessionId) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }
}
