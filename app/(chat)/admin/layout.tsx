import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";

/**
 * Server-side admin access control
 * This layout runs on the server and checks admin access before rendering
 */

// Admin email is only checked server-side (never exposed to client)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@nyenglishteacher.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Not authenticated - redirect to login
  if (!session?.user) {
    redirect("/login");
  }

  // Not admin - redirect to home
  if (session.user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  // Admin verified - render children
  return <>{children}</>;
}
