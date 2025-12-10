import postgres from "postgres";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);

export interface LogKnowledgeEventParams {
  chatId?: string;
  messageId?: string;
  sessionId?: string;
  query: string;
  results: Array<{
    content: string;
    url: string | null;
    similarity: number;
    metadata: Record<string, any>;
  }>;
}

/**
 * Log RAG retrieval events to knowledge_events table
 * This tracks which knowledge sources are used and identifies gaps
 */
export async function logKnowledgeEvent(params: LogKnowledgeEventParams) {
  const { chatId, messageId, sessionId, query, results } = params;

  try {
    // If no results, log a single "no hit" event
    if (!results || results.length === 0) {
      await client`
        INSERT INTO knowledge_events (
          "chatId", "messageId", "sessionId", query, hit, "createdAt"
        ) VALUES (
          ${chatId || null},
          ${messageId || null},
          ${sessionId || null},
          ${query},
          FALSE,
          NOW()
        )
      `;
      return;
    }

    // Log each retrieved chunk
    for (const result of results) {
      const sourceType = result.url?.includes("Document_Knowledge")
        ? "document"
        : "website";
      const sourceId = result.url || "unknown";
      const chunkId = result.metadata?.chunkId || result.metadata?.id || null;

      await client`
        INSERT INTO knowledge_events (
          "chatId", "messageId", "sessionId", query, 
          "sourceType", "sourceId", "chunkId", relevance, hit, "createdAt"
        ) VALUES (
          ${chatId || null},
          ${messageId || null},
          ${sessionId || null},
          ${query},
          ${sourceType},
          ${sourceId},
          ${chunkId},
          ${result.similarity},
          TRUE,
          NOW()
        )
      `;
    }
  } catch (error) {
    // Don't throw - logging failures shouldn't break the chat
    console.error("Failed to log knowledge event:", error);
  }
}
