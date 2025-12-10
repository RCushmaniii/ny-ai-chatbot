"use client";

import { redirect, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AdminTabs } from "@/components/admin-tabs";
import { AdminHeader } from "@/components/admin-header";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("manual");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Single-tenant: Only the owner can access admin
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "info@nyenglishteacher.com";
  
  if (session.user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  const handleAccountClick = () => {
    setActiveTab("account");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader 
        userEmail={session.user.email || ""} 
        onAccountClick={handleAccountClick}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your AI chatbot's knowledge base and settings
            </p>
          </div>
          <AdminTabs 
            userEmail={session.user.email || ""} 
            userId={session.user.id}
            activeTab={activeTab}
          />
        </div>
      </div>
    </div>
  );
}
