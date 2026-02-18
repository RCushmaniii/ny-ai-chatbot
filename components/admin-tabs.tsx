"use client";

import {
  BarChart3,
  Code,
  Database,
  Globe,
  Lightbulb,
  MessageSquare,
  ScrollText,
  Settings,
  User,
} from "lucide-react";
import { AdminAccount } from "@/components/admin-account";
import { AdminAnalytics } from "@/components/admin-analytics";
import { AdminChatLogs } from "@/components/admin-chat-logs";
import { AdminEmbedCode } from "@/components/admin-embed-code";
import { AdminInsights } from "@/components/admin-insights";
import { AdminKnowledgeBase } from "@/components/admin-knowledge-base";
import { AdminStarterQuestions } from "@/components/admin-starter-questions";
import { AdminSystemInstructions } from "@/components/admin-system-instructions";
import { AdminWebsiteScraping } from "@/components/admin-website-scraping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminTabsProps {
  userEmail: string;
  userId: string;
  activeTab?: string;
}

export function AdminTabs({ userEmail, userId, activeTab }: AdminTabsProps) {
  return (
    <Tabs defaultValue={activeTab || "manual"} className="w-full">
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <TabsList className="inline-flex w-auto min-w-full gap-1">
          <TabsTrigger value="manual" className="flex items-center gap-1.5 px-3">
            <Database className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Manual</span>
          </TabsTrigger>
          <TabsTrigger value="website" className="flex items-center gap-1.5 px-3">
            <Globe className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Website</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5 px-3">
            <Settings className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-1.5 px-3">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Instructions</span>
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-1.5 px-3">
            <Code className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Embed</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5 px-3">
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1.5 px-3">
            <ScrollText className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1.5 px-3">
            <Lightbulb className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1.5 px-3">
            <User className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="manual" className="mt-6">
        <AdminKnowledgeBase />
      </TabsContent>

      <TabsContent value="website" className="mt-6">
        <AdminWebsiteScraping />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <AdminStarterQuestions />
      </TabsContent>

      <TabsContent value="prompts" className="mt-6">
        <AdminSystemInstructions />
      </TabsContent>

      <TabsContent value="embed" className="mt-6">
        <AdminEmbedCode />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <AdminAnalytics />
      </TabsContent>

      <TabsContent value="logs" className="mt-6">
        <AdminChatLogs />
      </TabsContent>

      <TabsContent value="insights" className="mt-6">
        <AdminInsights />
      </TabsContent>

      <TabsContent value="account" className="mt-6">
        <AdminAccount userEmail={userEmail} userId={userId} />
      </TabsContent>
    </Tabs>
  );
}
