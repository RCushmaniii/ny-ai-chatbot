import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Debug mode for development
  debug: false,

  // Filter out common non-actionable errors
  ignoreErrors: [
    // Rate limiting (expected behavior)
    "rate_limit",
    // User session errors
    "unauthorized",
    "forbidden",
  ],
});
