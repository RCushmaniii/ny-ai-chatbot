import { cookies } from "next/headers";
import Script from "next/script";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatLayoutProvider } from "@/components/chat-layout-provider";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { safeCurrentUser } from "@/lib/auth/clerk";

const isTestEnv = Boolean(process.env.PLAYWRIGHT || process.env.CI_PLAYWRIGHT);

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clerkUser, cookieStore] = await Promise.all([
    safeCurrentUser(),
    cookies(),
  ]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  // Build a simple user prop for sidebar (or undefined for anonymous)
  const user = clerkUser
    ? {
        email: clerkUser.primaryEmailAddress?.emailAddress ?? undefined,
        name: clerkUser.fullName ?? undefined,
        imageUrl: clerkUser.imageUrl ?? undefined,
      }
    : undefined;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      {!isTestEnv && <SiteHeader />}
      <ChatLayoutProvider isAuthenticated={!!user}>
        <DataStreamProvider>
          <SidebarProvider defaultOpen={!isCollapsed}>
            {user && <AppSidebar user={user} />}
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </DataStreamProvider>
      </ChatLayoutProvider>
    </>
  );
}
