import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  lt,
  type SQL,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateUUID } from "../utils";
import {
  type BotSettings,
  botSettings,
  chat,
  type DBMessage,
  document,
  knowledgeEvents,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email",
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user",
    );
  }
}

export async function saveChat({
  id,
  userId,
  sessionId,
  title,
  visibility,
}: {
  id: string;
  userId?: string; // Optional for anonymous sessions
  sessionId?: string; // For anonymous sessions
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId: userId || null,
      sessionId: sessionId || null,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id",
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (error) {
    console.error("Error in getChatById:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id",
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id",
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id",
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id",
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp",
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions",
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id",
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id",
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id,
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp",
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id",
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await db
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

// REMOVED: getMessageCountByUserId() - Replaced by getMessageCountBySessionId()

/**
 * Analytics Functions for Admin Dashboard
 */

export async function getAnalyticsData(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total chats in period
    const totalChats = await db
      .select({ count: count(chat.id) })
      .from(chat)
      .where(gte(chat.createdAt, startDate));

    // Total messages in period
    const totalMessages = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(gte(chat.createdAt, startDate));

    // Unique sessions in period
    const uniqueSessions = await db
      .selectDistinct({ sessionId: chat.sessionId })
      .from(chat)
      .where(and(gte(chat.createdAt, startDate), isNotNull(chat.sessionId)));

    // Messages per chat (average)
    const messagesPerChat = await db
      .select({
        chatId: message.chatId,
        count: count(message.id),
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(gte(chat.createdAt, startDate))
      .groupBy(message.chatId);

    const avgMessagesPerChat =
      messagesPerChat.length > 0
        ? messagesPerChat.reduce((sum, c) => sum + Number(c.count), 0) /
          messagesPerChat.length
        : 0;

    return {
      totalChats: totalChats[0]?.count || 0,
      totalMessages: totalMessages[0]?.count || 0,
      uniqueSessions: uniqueSessions.length,
      avgMessagesPerChat: Math.round(avgMessagesPerChat * 10) / 10,
    };
  } catch (error) {
    console.error("Error getting analytics data:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get analytics data",
    );
  }
}

export async function getTopQuestions(limit: number = 10) {
  try {
    // Get first user message from each chat
    const questions = await db
      .select({
        parts: message.parts,
        chatId: message.chatId,
        createdAt: chat.createdAt,
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(eq(message.role, "user"))
      .orderBy(desc(chat.createdAt))
      .limit(100); // Get recent questions

    // Count occurrences of similar questions (simple text matching)
    const questionCounts = new Map<string, number>();

    questions.forEach((q) => {
      // Extract text from parts (which is a JSON array)
      const parts = q.parts as any[];
      const text = parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join(" ");

      if (text) {
        const normalized = text.toLowerCase().trim().slice(0, 100);
        questionCounts.set(
          normalized,
          (questionCounts.get(normalized) || 0) + 1,
        );
      }
    });

    // Convert to array and sort by count
    const topQuestions = Array.from(questionCounts.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return topQuestions;
  } catch (error) {
    console.error("Error getting top questions:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get top questions",
    );
  }
}

export async function getDailyStats(days: number = 14) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyChats = await db
      .select({
        date: sql<string>`DATE(${chat.createdAt})`,
        count: count(chat.id),
      })
      .from(chat)
      .where(gte(chat.createdAt, startDate))
      .groupBy(sql`DATE(${chat.createdAt})`)
      .orderBy(sql`DATE(${chat.createdAt})`);

    return dailyChats.map((d) => ({
      date: d.date,
      chats: Number(d.count),
    }));
  } catch (error) {
    console.error("Error getting daily stats:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get daily stats");
  }
}

/**
 * Chat Logs Functions for Admin Dashboard
 */

export async function getAllChatsWithMessages({
  limit = 20,
  offset = 0,
  searchQuery,
  startDate,
  endDate,
}: {
  limit?: number;
  offset?: number;
  searchQuery?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    // Build where conditions
    const conditions: SQL[] = [];

    if (startDate) {
      conditions.push(gte(chat.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lt(chat.createdAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get chats with message count
    const chats = await db
      .select({
        id: chat.id,
        title: chat.title,
        sessionId: chat.sessionId,
        userId: chat.userId,
        createdAt: chat.createdAt,
        visibility: chat.visibility,
        messageCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${message} 
          WHERE ${message.chatId} = ${chat.id}
        )`,
      })
      .from(chat)
      .where(whereClause)
      .orderBy(desc(chat.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: count(chat.id) })
      .from(chat)
      .where(whereClause);

    // If search query, filter by message content
    if (searchQuery && chats.length > 0) {
      const chatIds = chats.map((c) => c.id);

      const messagesWithSearch = await db
        .select({
          chatId: message.chatId,
        })
        .from(message)
        .where(
          and(
            inArray(message.chatId, chatIds),
            sql`${message.parts}::text ILIKE ${`%${searchQuery}%`}`,
          ),
        )
        .groupBy(message.chatId);

      const matchingChatIds = new Set(messagesWithSearch.map((m) => m.chatId));

      return {
        chats: chats.filter((c) => matchingChatIds.has(c.id)),
        total: matchingChatIds.size,
        hasMore: offset + limit < matchingChatIds.size,
      };
    }

    return {
      chats,
      total: Number(totalCount),
      hasMore: offset + limit < Number(totalCount),
    };
  } catch (error) {
    console.error("Error getting all chats:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get all chats");
  }
}

export async function getChatWithFullTranscript(chatId: string) {
  try {
    const [chatData] = await db.select().from(chat).where(eq(chat.id, chatId));

    if (!chatData) {
      throw new ChatSDKError("not_found:database", "Chat not found");
    }

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(asc(message.createdAt));

    return {
      chat: chatData,
      messages,
    };
  } catch (error) {
    console.error("Error getting chat transcript:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chat transcript",
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id",
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id",
    );
  }
}

// ============================================================================
// SINGLE-TENANT: Bot Settings (Global Singleton)
// ============================================================================

/**
 * Get global bot settings (single active row)
 * Returns null if no settings exist
 */
export async function getGlobalBotSettings(): Promise<BotSettings | null> {
  try {
    const settings = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.is_active, true))
      .limit(1);

    return settings[0] || null;
  } catch (error) {
    console.error("Error fetching global bot settings:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get global bot settings",
    );
  }
}

/**
 * Update global bot settings (upsert pattern)
 * Creates settings if none exist, updates if they do
 */
export async function updateGlobalBotSettings(
  data: Partial<
    Omit<BotSettings, "id" | "createdAt" | "updatedAt" | "is_active">
  >,
): Promise<void> {
  try {
    const existing = await getGlobalBotSettings();

    if (existing) {
      // Update existing settings
      await db
        .update(botSettings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(botSettings.id, existing.id));
    } else {
      // Create new settings
      await db.insert(botSettings).values({
        ...data,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error updating global bot settings:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update global bot settings",
    );
  }
}

// ============================================================================
// SINGLE-TENANT: Session-Based Chat Queries
// ============================================================================

/**
 * Get chats by sessionId (for anonymous users)
 * Replaces getChatsByUserId for single-tenant architecture
 */
export async function getChatsBySessionId({
  sessionId,
  limit = 50,
}: {
  sessionId: string;
  limit?: number;
}) {
  try {
    const chats = await db
      .select()
      .from(chat)
      .where(eq(chat.sessionId, sessionId))
      .orderBy(desc(chat.createdAt))
      .limit(limit);

    return chats;
  } catch (error) {
    console.error("Error in getChatsBySessionId:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by session id",
    );
  }
}

/**
 * Get all chats (admin view)
 * No user filtering - returns all chats across all sessions
 */
export async function getAllChats({
  limit = 100,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
}) {
  try {
    const chats = await db
      .select()
      .from(chat)
      .orderBy(desc(chat.createdAt))
      .limit(limit)
      .offset(offset);

    return chats;
  } catch (error) {
    console.error("Error in getAllChats:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get all chats");
  }
}

/**
 * Get message count by sessionId (for rate limiting)
 */
export async function getMessageCountBySessionId({
  sessionId,
  differenceInHours,
}: {
  sessionId: string;
  differenceInHours: number;
}) {
  try {
    const hoursAgo = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.sessionId, sessionId),
          gte(message.createdAt, hoursAgo),
          eq(message.role, "user"),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    console.error("Error in getMessageCountBySessionId:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by session id",
    );
  }
}

/**
 * Knowledge Insights Functions for RAG Intelligence Layer
 */

export async function getRagHitRatio(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [{ totalEvents }] = await db
      .select({ totalEvents: count(knowledgeEvents.id) })
      .from(knowledgeEvents)
      .where(gte(knowledgeEvents.createdAt, startDate));

    const [{ hitEvents }] = await db
      .select({ hitEvents: count(knowledgeEvents.id) })
      .from(knowledgeEvents)
      .where(
        and(
          gte(knowledgeEvents.createdAt, startDate),
          eq(knowledgeEvents.hit, true),
        ),
      );

    const total = Number(totalEvents) || 0;
    const hits = Number(hitEvents) || 0;
    const ratio = total > 0 ? (hits / total) * 100 : 0;

    return {
      total,
      hits,
      misses: total - hits,
      ratio: Math.round(ratio * 10) / 10,
    };
  } catch (error) {
    console.error("Error getting RAG hit ratio:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get RAG hit ratio",
    );
  }
}

function toIsoStringOrEmpty(value: unknown) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }
  return "";
}

export async function getTopSources({
  days = 30,
  limit = 50,
}: {
  days?: number;
  limit?: number;
}) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sources = await db
      .select({
        sourceId: knowledgeEvents.sourceId,
        sourceType: knowledgeEvents.sourceType,
        hits: count(knowledgeEvents.id),
        avgRelevance: sql<number>`AVG(${knowledgeEvents.relevance})`,
        lastHit: sql<Date>`MAX(${knowledgeEvents.createdAt})`,
      })
      .from(knowledgeEvents)
      .where(
        and(
          eq(knowledgeEvents.hit, true),
          gte(knowledgeEvents.createdAt, startDate),
        ),
      )
      .groupBy(knowledgeEvents.sourceId, knowledgeEvents.sourceType)
      .orderBy(desc(count(knowledgeEvents.id)))
      .limit(limit);

    // Get example queries for each source
    const sourcesWithExamples = await Promise.all(
      sources.map(async (source) => {
        const [example] = await db
          .select({ query: knowledgeEvents.query })
          .from(knowledgeEvents)
          .where(
            and(
              eq(knowledgeEvents.sourceId, source.sourceId!),
              eq(knowledgeEvents.hit, true),
            ),
          )
          .limit(1);

        return {
          sourceId: source.sourceId || "",
          sourceType: source.sourceType || "",
          hits: Number(source.hits),
          avgRelevance: source.avgRelevance
            ? Math.round(Number(source.avgRelevance) * 1000) / 1000
            : 0,
          exampleQuery: example?.query || "",
          lastHit: toIsoStringOrEmpty(source.lastHit),
        };
      }),
    );

    return sourcesWithExamples;
  } catch (error) {
    console.error("Error getting top sources:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get top sources");
  }
}

export async function getMissingKnowledge({
  days = 30,
  limit = 50,
  includeRaw = false,
}: {
  days?: number;
  limit?: number;
  includeRaw?: boolean;
}) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get queries that had no hits
    const missedQueries = await db
      .select({
        query: knowledgeEvents.query,
        count: count(knowledgeEvents.id),
        lastAsked: sql<Date>`MAX(${knowledgeEvents.createdAt})`,
      })
      .from(knowledgeEvents)
      .where(
        and(
          eq(knowledgeEvents.hit, false),
          gte(knowledgeEvents.createdAt, startDate),
        ),
      )
      .groupBy(knowledgeEvents.query)
      .orderBy(desc(count(knowledgeEvents.id)))
      .limit(limit);

    // Group similar queries into topics (simple version - just use the query as topic)
    const groups = missedQueries.map((q) => ({
      topic: q.query,
      count: Number(q.count),
      examples: [q.query],
    }));

    const raw = includeRaw
      ? missedQueries.map((q) => ({
          query: q.query,
          date: q.lastAsked?.toISOString().split("T")[0] || "",
        }))
      : [];

    return { groups, raw };
  } catch (error) {
    console.error("Error getting missing knowledge:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get missing knowledge",
    );
  }
}

export async function getTopChunks({
  days = 30,
  limit = 50,
}: {
  days?: number;
  limit?: number;
}) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const chunks = await db
      .select({
        chunkId: knowledgeEvents.chunkId,
        sourceId: knowledgeEvents.sourceId,
        sourceType: knowledgeEvents.sourceType,
        hits: count(knowledgeEvents.id),
        avgRelevance: sql<number>`AVG(${knowledgeEvents.relevance})`,
      })
      .from(knowledgeEvents)
      .where(
        and(
          eq(knowledgeEvents.hit, true),
          isNotNull(knowledgeEvents.chunkId),
          gte(knowledgeEvents.createdAt, startDate),
        ),
      )
      .groupBy(
        knowledgeEvents.chunkId,
        knowledgeEvents.sourceId,
        knowledgeEvents.sourceType,
      )
      .orderBy(desc(count(knowledgeEvents.id)))
      .limit(limit);

    return chunks.map((c) => ({
      chunkId: c.chunkId || "",
      sourceId: c.sourceId || "",
      sourceType: c.sourceType || "",
      hits: Number(c.hits),
      avgRelevance: c.avgRelevance
        ? Math.round(Number(c.avgRelevance) * 1000) / 1000
        : 0,
    }));
  } catch (error) {
    console.error("Error getting top chunks:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get top chunks");
  }
}

export async function getRagTrends(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await db
      .select({
        date: sql<string>`DATE(${knowledgeEvents.createdAt})`,
        totalQueries: count(knowledgeEvents.id),
        hits: sql<number>`SUM(CASE WHEN ${knowledgeEvents.hit} = TRUE THEN 1 ELSE 0 END)`,
        misses: sql<number>`SUM(CASE WHEN ${knowledgeEvents.hit} = FALSE THEN 1 ELSE 0 END)`,
        avgScore: sql<number>`AVG(CASE WHEN ${knowledgeEvents.hit} = TRUE THEN ${knowledgeEvents.relevance} ELSE NULL END)`,
      })
      .from(knowledgeEvents)
      .where(gte(knowledgeEvents.createdAt, startDate))
      .groupBy(sql`DATE(${knowledgeEvents.createdAt})`)
      .orderBy(sql`DATE(${knowledgeEvents.createdAt})`);

    return trends.map((t) => ({
      date: t.date,
      totalQueries: Number(t.totalQueries),
      hits: Number(t.hits),
      misses: Number(t.misses),
      avgScore: t.avgScore ? Math.round(Number(t.avgScore) * 1000) / 1000 : 0,
    }));
  } catch (error) {
    console.error("Error getting RAG trends:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get RAG trends");
  }
}
