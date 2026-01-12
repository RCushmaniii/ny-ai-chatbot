/**
 * Input validation and sanitization for production safety
 */

import {
  checkRateLimitRedis,
  isRedisRateLimitingEnabled,
} from "./rate-limit-redis";

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_MESSAGES_PER_MINUTE = 10;
export const MAX_MESSAGES_PER_HOUR = 50;

// Re-export Redis rate limiting functions
export { checkRateLimitRedis, isRedisRateLimitingEnabled };

/**
 * Validate user message input
 */
export function validateMessage(message: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  // Check if message exists
  if (!message || typeof message !== "string") {
    return { valid: false, error: "Message is required" };
  }

  // Trim whitespace
  const trimmed = message.trim();

  // Check minimum length
  if (trimmed.length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }

  // Check maximum length
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
    };
  }

  // Check for potential prompt injection patterns
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now/i,
    /system\s*:/i,
    /\[SYSTEM\]/i,
    /forget\s+everything/i,
    /disregard\s+(all\s+)?instructions/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: "Message contains suspicious content",
      };
    }
  }

  // Sanitize: remove excessive whitespace
  const sanitized = trimmed.replace(/\s+/g, " ");

  return { valid: true, sanitized };
}

/**
 * Rate limiting storage (in-memory for now, use Redis in production)
 */
const rateLimitStore = new Map<
  string,
  { count: number; resetAt: number; hourlyCount: number; hourlyResetAt: number }
>();

/**
 * Check rate limit for an identifier (IP address or session ID)
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    // First request
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + 60 * 1000, // 1 minute
      hourlyCount: 1,
      hourlyResetAt: now + 60 * 60 * 1000, // 1 hour
    });
    return { allowed: true };
  }

  // Check hourly limit
  if (now > entry.hourlyResetAt) {
    entry.hourlyCount = 1;
    entry.hourlyResetAt = now + 60 * 60 * 1000;
  } else if (entry.hourlyCount >= MAX_MESSAGES_PER_HOUR) {
    const retryAfter = Math.ceil((entry.hourlyResetAt - now) / 1000);
    return {
      allowed: false,
      error: "Too many messages this hour. Please try again later.",
      retryAfter,
    };
  }

  // Check per-minute limit
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + 60 * 1000;
    entry.hourlyCount++;
  } else if (entry.count >= MAX_MESSAGES_PER_MINUTE) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      error: "Too many messages. Please wait a moment.",
      retryAfter,
    };
  } else {
    entry.count++;
    entry.hourlyCount++;
  }

  rateLimitStore.set(identifier, entry);
  return { allowed: true };
}

/**
 * Get client identifier from request (IP or session)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (Vercel provides this)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0] || realIp || "unknown";
}

/**
 * Clean up old rate limit entries (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.hourlyResetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof window === "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
