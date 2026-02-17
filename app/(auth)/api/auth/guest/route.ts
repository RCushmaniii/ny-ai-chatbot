import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";
import {
  checkRateLimitRedis,
  getClientIdentifier,
} from "@/lib/security/validation";

export async function GET(request: Request) {
  // Rate limit guest account creation to prevent DB spam
  const clientId = getClientIdentifier(request);
  const rateLimitResult = await checkRateLimitRedis(`guest:${clientId}`);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawRedirect = searchParams.get("redirectUrl") || "/";
  // Prevent open redirect — only allow relative paths
  const redirectUrl = rawRedirect.startsWith("/") ? rawRedirect : "/";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return signIn("guest", { redirect: true, redirectTo: redirectUrl });
}
