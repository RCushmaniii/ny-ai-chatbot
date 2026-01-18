/**
 * Redis-based Rate Limiting with Upstash
 *
 * Provides persistent rate limiting across serverless function instances.
 * Falls back to in-memory rate limiting if Redis is not configured.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // Requests per minute
  requestsPerMinute: 10,
  // Requests per hour
  requestsPerHour: 50,
  // Requests per day
  requestsPerDay: 200,
};

// Initialize Redis client (only if env vars are set)
let redis: Redis | null = null;
let rateLimitPerMinute: Ratelimit | null = null;
let rateLimitPerHour: Ratelimit | null = null;

/**
 * Initialize Upstash Redis rate limiters
 */
function initializeRedis() {
  if (redis) return; // Already initialized

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[RateLimit] Upstash Redis not configured, using in-memory fallback",
    );
    return;
  }

  try {
    redis = new Redis({ url, token });

    // Per-minute rate limiter (sliding window)
    rateLimitPerMinute = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.requestsPerMinute,
        "1 m",
      ),
      prefix: "ratelimit:minute",
      analytics: true,
    });

    // Per-hour rate limiter
    rateLimitPerHour = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.requestsPerHour,
        "1 h",
      ),
      prefix: "ratelimit:hour",
      analytics: true,
    });

    console.log("[RateLimit] Upstash Redis rate limiting initialized");
  } catch (error) {
    console.error("[RateLimit] Failed to initialize Redis:", error);
    redis = null;
  }
}

// In-memory fallback store
const memoryStore = new Map<
  string,
  { count: number; resetAt: number; hourlyCount: number; hourlyResetAt: number }
>();

/**
 * Check rate limit using Redis (with in-memory fallback)
 */
export async function checkRateLimitRedis(identifier: string): Promise<{
  allowed: boolean;
  error?: string;
  retryAfter?: number;
  remaining?: number;
}> {
  // Try to initialize Redis if not done yet
  initializeRedis();

  // Use Redis if available
  if (rateLimitPerMinute && rateLimitPerHour) {
    try {
      // Check per-minute limit first
      const minuteResult = await rateLimitPerMinute.limit(identifier);
      if (!minuteResult.success) {
        return {
          allowed: false,
          error: "Too many messages. Please wait a moment.",
          retryAfter: Math.ceil((minuteResult.reset - Date.now()) / 1000),
          remaining: minuteResult.remaining,
        };
      }

      // Check per-hour limit
      const hourResult = await rateLimitPerHour.limit(identifier);
      if (!hourResult.success) {
        return {
          allowed: false,
          error: "Too many messages this hour. Please try again later.",
          retryAfter: Math.ceil((hourResult.reset - Date.now()) / 1000),
          remaining: hourResult.remaining,
        };
      }

      return {
        allowed: true,
        remaining: Math.min(minuteResult.remaining, hourResult.remaining),
      };
    } catch (error) {
      console.error("[RateLimit] Redis error, falling back to memory:", error);
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  return checkRateLimitMemory(identifier);
}

/**
 * In-memory rate limiting fallback
 */
function checkRateLimitMemory(identifier: string): {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
  remaining?: number;
} {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + 60 * 1000,
      hourlyCount: 1,
      hourlyResetAt: now + 60 * 60 * 1000,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.requestsPerMinute - 1,
    };
  }

  // Check hourly limit
  if (now > entry.hourlyResetAt) {
    entry.hourlyCount = 1;
    entry.hourlyResetAt = now + 60 * 60 * 1000;
  } else if (entry.hourlyCount >= RATE_LIMIT_CONFIG.requestsPerHour) {
    const retryAfter = Math.ceil((entry.hourlyResetAt - now) / 1000);
    return {
      allowed: false,
      error: "Too many messages this hour. Please try again later.",
      retryAfter,
      remaining: 0,
    };
  }

  // Check per-minute limit
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + 60 * 1000;
    entry.hourlyCount++;
  } else if (entry.count >= RATE_LIMIT_CONFIG.requestsPerMinute) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      error: "Too many messages. Please wait a moment.",
      retryAfter,
      remaining: 0,
    };
  } else {
    entry.count++;
    entry.hourlyCount++;
  }

  memoryStore.set(identifier, entry);
  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.requestsPerMinute - entry.count,
  };
}

/**
 * Clean up expired entries from memory store
 */
export function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.hourlyResetAt) {
      memoryStore.delete(key);
    }
  }
}

// Periodic cleanup for in-memory store (every 5 minutes)
if (typeof globalThis !== "undefined" && !redis) {
  setInterval(cleanupMemoryStore, 5 * 60 * 1000);
}

/**
 * Check if Redis rate limiting is available
 */
export function isRedisRateLimitingEnabled(): boolean {
  initializeRedis();
  return redis !== null;
}
