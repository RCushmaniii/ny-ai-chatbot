export async function GET() {
  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
      hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
