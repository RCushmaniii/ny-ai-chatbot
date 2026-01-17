import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { guestRegex } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Playwright test endpoint
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Skip auth routes, cron jobs, and embed endpoints (no auth needed)
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/embed") ||
    pathname.startsWith("/embed")
  ) {
    const response = NextResponse.next();

    // Add CORS headers for local development
    const origin = request.headers.get("origin");
    if (
      origin &&
      (origin.includes("localhost") || origin.includes("127.0.0.1"))
    ) {
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
    }

    return response;
  }

  // Get the session using the new `auth()` helper
  const session = await auth();

  // Not logged in → redirect to guest login
  if (!session) {
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  const userEmail = session.user?.email ?? "";
  const isGuest = guestRegex.test(userEmail);

  // If authenticated and not a guest, block login/register
  if (!isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/chat/:id", "/api/:path*", "/login", "/register"],
};
