"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Lightbulb, Flame, BookOpenCheck } from "lucide-react";

type Overview = {
  hitRatio: { hits: number; misses: number; ratio: number; total: number };
  trends: { date: string; hits: number; misses: number; totalQueries: number; avgScore: number }[];
  topSources: {
    sourceId: string;
    sourceType: string;
    hits: number;
    avgRelevance: number;
    exampleQuery?: string;
    lastHit?: string;
  }[];
  topChunks: {
    chunkId: string;
    sourceId: string;
    sourceType: string;
    hits: number;
    avgRelevance: number;
  }[];
  missingKnowledge: { topic: string; count: number; examples: string[] }[];
};

export function AdminInsights() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let abort = false;
    setLoading(true);
    fetch(`/api/admin/insights/overview?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (!abort) setData(d);
      })
      .catch((err) => {
        console.error("Failed to load insights:", err);
      })
      .finally(() => {
        if (!abort) setLoading(false);
      });
    return () => {
      abort = true;
    };
  }, [days]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Lightbulb className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Knowledge Insights</h2>
      </header>

      <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
        <TabsList>
          <TabsTrigger value="7">Last 7 days</TabsTrigger>
          <TabsTrigger value="30">Last 30 days</TabsTrigger>
          <TabsTrigger value="90">Last 90 days</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {!loading && data && (
        <>
          {/* Performance cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              title="RAG Hit Ratio"
              value={`${Math.round(data.hitRatio.ratio)}%`}
              subtitle={`${data.hitRatio.hits} hits / ${data.hitRatio.misses} misses`}
            />
            <StatCard
              title="KB Hits (Period)"
              value={String(data.hitRatio.hits)}
              subtitle="Matches using knowledge"
            />
            <StatCard
              title="No-Hit Queries"
              value={String(data.hitRatio.misses)}
              subtitle="Needs content"
            />
            <StatCard
              title="Top Chunk Score"
              value={fmtPct(maxAvgRelevance(data.topChunks))}
              subtitle="Best performing chunk"
            />
          </div>

          {/* Trends */}
          <Card>
            <CardHeader>
              <CardTitle>RAG Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {data.trends.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trend data.</p>
              ) : (
                <div className="space-y-1">
                  {data.trends.map((t) => (
                    <div key={t.date} className="flex justify-between text-sm">
                      <span>{t.date}</span>
                      <span className="tabular-nums">
                        Hits {t.hits} · Misses {t.misses}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4" /> Top Knowledge Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Hits</TableHead>
                    <TableHead className="text-right">Avg Score</TableHead>
                    <TableHead>Example Query</TableHead>
                    <TableHead>Last Hit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topSources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground">
                        No source usage yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.topSources.map((s) => (
                    <TableRow key={`${s.sourceType}:${s.sourceId}`}>
                      <TableCell className="truncate max-w-[320px]" title={s.sourceId}>
                        {s.sourceId}
                      </TableCell>
                      <TableCell>{s.sourceType}</TableCell>
                      <TableCell className="text-right">{s.hits}</TableCell>
                      <TableCell className="text-right">{fmtPct(s.avgRelevance)}</TableCell>
                      <TableCell className="truncate max-w-[240px]">
                        {s.exampleQuery ?? "—"}
                      </TableCell>
                      <TableCell>
                        {s.lastHit ? new Date(s.lastHit).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Missing Knowledge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-4 h-4" /> Missing Knowledge (Unanswered)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.missingKnowledge.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No gaps detected in this period.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.missingKnowledge.map((g, i) => (
                    <li key={i} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{g.topic}</div>
                        <div className="text-sm text-muted-foreground">{g.count} queries</div>
                      </div>
                      {g.examples?.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                          {g.examples.slice(0, 3).map((ex, j) => (
                            <li key={j}>{ex}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Chunk Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Top Chunks</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chunk</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Hits</TableHead>
                    <TableHead className="text-right">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topChunks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">
                        No chunk data.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.topChunks.map((c) => (
                    <TableRow key={c.chunkId}>
                      <TableCell className="truncate max-w-[240px]">{c.chunkId}</TableCell>
                      <TableCell className="truncate max-w-[320px]" title={c.sourceId}>
                        {c.sourceId}
                      </TableCell>
                      <TableCell className="text-right">{c.hits}</TableCell>
                      <TableCell className="text-right">{fmtPct(c.avgRelevance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

function fmtPct(n?: number) {
  if (n === undefined || n === null) return "—";
  return `${Math.round(n * 100)}%`;
}

function maxAvgRelevance(chunks: { avgRelevance: number }[]) {
  if (!chunks?.length) return 0;
  return Math.max(...chunks.map((c) => c.avgRelevance ?? 0));
}
