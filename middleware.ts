import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

const isTestEnv = Boolean(
  process.env.PLAYWRIGHT || process.env.CI_PLAYWRIGHT,
);

function handleCors(request: NextRequest): NextResponse | undefined {
  const origin = request.headers.get("origin");
  if (
    origin &&
    (origin.includes("localhost") || origin.includes("127.0.0.1"))
  ) {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/api/embed") || pathname.startsWith("/embed")) {
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
}

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // In test/CI, skip Clerk entirely — just handle CORS and pass through
  if (isTestEnv) {
    return handleCors(request) ?? NextResponse.next();
  }

  // Production: dynamically import Clerk to avoid key validation at module load
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isProtectedRoute = createRouteMatcher([
    "/admin(.*)",
    "/api/admin(.*)",
  ]);

  const clerkHandler = clerkMiddleware(async (auth, req) => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  });

  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
