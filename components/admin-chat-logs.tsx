"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Search,
  Download,
  Eye,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ChatLog {
  id: string;
  title: string;
  sessionId: string | null;
  userId: string | null;
  createdAt: Date;
  visibility: string;
  messageCount: number;
}

interface ChatMessage {
  id: string;
  role: string;
  parts: any;
  createdAt: Date;
}

interface ChatTranscript {
  chat: ChatLog;
  messages: ChatMessage[];
}

export function AdminChatLogs() {
  const [chats, setChats] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatTranscript | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchChatLogs();
  }, [currentPage, searchQuery]);

  const fetchChatLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: (currentPage * ITEMS_PER_PAGE).toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/admin/chat-logs?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch chat logs");
      }

      const data = await response.json();
      setChats(data.chats);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      toast.error("Failed to load chat logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const viewChatTranscript = async (chatId: string) => {
    try {
      setLoadingTranscript(true);
      setViewDialogOpen(true);

      const response = await fetch(`/api/admin/chat-logs?chatId=${chatId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch transcript");
      }

      const data = await response.json();
      setSelectedChat(data);
    } catch (error) {
      toast.error("Failed to load chat transcript");
      console.error(error);
      setViewDialogOpen(false);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const exportToCSV = (chat: ChatLog) => {
    // Simple CSV export - can be enhanced
    const csvContent = [
      ["Chat ID", "Title", "Session ID", "Created At", "Messages"],
      [
        chat.id,
        chat.title,
        chat.sessionId || "N/A",
        new Date(chat.createdAt).toLocaleString(),
        chat.messageCount.toString(),
      ],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${chat.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported to CSV");
  };

  const extractTextFromParts = (parts: any): string => {
    if (!parts) return "";
    try {
      const partsArray = Array.isArray(parts) ? parts : JSON.parse(parts);
      return partsArray
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join(" ");
    } catch {
      return String(parts);
    }
  };

  if (loading && chats.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Logs</CardTitle>
          <CardDescription>
            View and search all chat conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(0);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat List */}
      <div className="space-y-3">
        {chats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No chats found matching your search" : "No chats yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          chats.map((chat) => (
            <Card key={chat.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{chat.title}</CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(chat.createdAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {chat.messageCount} messages
                      </span>
                      {chat.sessionId && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Session: {chat.sessionId.slice(0, 8)}...
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewChatTranscript(chat.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(chat)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min((currentPage + 1) * ITEMS_PER_PAGE, total)} of {total} chats
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* View Transcript Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedChat?.chat.title || "Chat Transcript"}
            </DialogTitle>
            <DialogDescription>
              {selectedChat && (
                <>
                  Created {new Date(selectedChat.chat.createdAt).toLocaleString()} •{" "}
                  {selectedChat.messages.length} messages
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {loadingTranscript ? (
            <div className="space-y-4 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : selectedChat ? (
            <div className="space-y-4 py-4">
              {selectedChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-4 ${
                    msg.role === "user"
                      ? "bg-primary/10 ml-8"
                      : "bg-muted mr-8"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase">
                      {msg.role}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {extractTextFromParts(msg.parts)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
