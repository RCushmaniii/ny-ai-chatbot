"use client";

import {
  Activity,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsStats {
  totalChats: number;
  totalMessages: number;
  uniqueSessions: number;
  avgMessagesPerChat: number;
}

interface AnalyticsData {
  stats: {
    last7Days: AnalyticsStats;
    last30Days: AnalyticsStats;
    allTime: AnalyticsStats;
  };
  topQuestions: Array<{ question: string; count: number }>;
  dailyStats: Array<{ date: string; chats: number }>;
}

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/analytics");

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    const skeletonKeys = ["total", "messages", "sessions", "avg"];
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {skeletonKeys.map((key) => (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Analytics</CardTitle>
          <CardDescription>{error || "No data available"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="7days" className="w-full">
        <TabsList>
          <TabsTrigger value="7days">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30days">Last 30 Days</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value="7days" className="space-y-4">
          <StatsGrid stats={data.stats.last7Days} />
        </TabsContent>

        <TabsContent value="30days" className="space-y-4">
          <StatsGrid stats={data.stats.last30Days} />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <StatsGrid stats={data.stats.allTime} />
        </TabsContent>
      </Tabs>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity (Last 14 Days)</CardTitle>
          <CardDescription>Number of chats created per day</CardDescription>
        </CardHeader>
        <CardContent>
          <DailyChart data={data.dailyStats} />
        </CardContent>
      </Card>

      {/* Top Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Most Common Questions</CardTitle>
          <CardDescription>
            Top 10 questions from recent conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No questions yet. Start chatting to see analytics!
              </p>
            ) : (
              data.topQuestions.map((q) => (
                <div
                  key={`${q.question}-${q.count}`}
                  className="flex items-start justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {q.count}x
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsGrid({ stats }: { stats: AnalyticsStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalChats}</div>
          <p className="text-xs text-muted-foreground">Conversations started</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMessages}</div>
          <p className="text-xs text-muted-foreground">Messages exchanged</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueSessions}</div>
          <p className="text-xs text-muted-foreground">Different users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Messages/Chat
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgMessagesPerChat}</div>
          <p className="text-xs text-muted-foreground">Engagement level</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DailyChart({
  data,
}: {
  data: Array<{ date: string; chats: number }>;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity data available yet
      </p>
    );
  }

  const maxChats = Math.max(...data.map((d) => d.chats), 1);

  return (
    <div className="space-y-2">
      {data.map((day) => (
        <div key={day.date} className="flex items-center gap-4">
          <div className="w-24 text-sm text-muted-foreground">
            {new Date(day.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="flex-1">
            <div className="relative h-8 w-full rounded-md bg-muted">
              <div
                className="absolute left-0 top-0 h-full rounded-md bg-primary transition-all"
                style={{
                  width: `${(day.chats / maxChats) * 100}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-sm font-medium">{day.chats}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
