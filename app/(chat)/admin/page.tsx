"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { AdminTabs } from "@/components/admin-tabs";

/**
 * Admin Dashboard Page
 *
 * NOTE: Admin access is verified server-side in layout.tsx
 * This page only renders for authenticated admin users
 */
export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("manual");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Show loading state while Clerk loads
  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress || "";
  const userId = user.id;

  const handleAccountClick = () => {
    setActiveTab("account");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader userEmail={email} onAccountClick={handleAccountClick} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your AI chatbot's knowledge base and settings
            </p>
          </div>
          <AdminTabs userEmail={email} userId={userId} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
