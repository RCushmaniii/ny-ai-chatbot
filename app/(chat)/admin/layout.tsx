import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * Server-side admin access control
 * Clerk middleware already protects /admin routes (requires sign-in),
 * but this layout additionally verifies the signed-in user is the admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUserId = await requireAdmin();

  if (!dbUserId) {
    // Signed in but not the admin email — send home
    redirect("/");
  }

  return <>{children}</>;
}
