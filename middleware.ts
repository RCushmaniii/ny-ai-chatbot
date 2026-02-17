import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Playwright test endpoint
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Protect admin routes — redirects to Clerk sign-in if not authenticated
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Add CORS headers for local development on embed routes
  const origin = request.headers.get("origin");
  if (
    origin &&
    (origin.includes("localhost") || origin.includes("127.0.0.1"))
  ) {
    if (
      pathname.startsWith("/api/embed") ||
      pathname.startsWith("/embed")
    ) {
      const response = NextResponse.next();
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS",
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
      response.headers.set("Access-Control-Allow-Credentials", "true");
      return response;
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
