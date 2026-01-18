/**
 * CORS configuration for production security
 *
 * Configure additional origins via ALLOWED_ORIGINS environment variable
 * Example: ALLOWED_ORIGINS=https://ny-eng.vercel.app,https://staging.nyenglishteacher.com
 */

// Parse additional origins from environment variable
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

// Allowed origins for embed widget
const ALLOWED_ORIGINS = [
  // Production domains
  "https://www.nyenglishteacher.com",
  "https://nyenglishteacher.com",
  // ny-eng integration (Vercel deployment)
  "https://ny-eng.vercel.app",
  "https://www.ny-eng.vercel.app",
  // Custom domain variants
  "https://chat.nyenglishteacher.com",
  // Additional origins from environment
  ...envOrigins,
  // Development origins
  ...(process.env.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4321", // Astro default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4321",
      ]
    : []),
];

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Set CORS headers on response
 */
export function setCorsHeaders(
  response: Response,
  origin: string | null,
): Response {
  const headers = new Headers(response.headers);

  if (origin && isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsPreflightRequest(origin: string | null): Response {
  if (!origin || !isOriginAllowed(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
