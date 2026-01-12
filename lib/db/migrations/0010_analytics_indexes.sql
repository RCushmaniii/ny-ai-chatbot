-- Migration: Add indexes for analytics performance
-- Date: 2026-01-11

-- Indexes for knowledge_events table (RAG analytics)
CREATE INDEX IF NOT EXISTS idx_knowledge_events_chat_id
  ON knowledge_events("chatId");

CREATE INDEX IF NOT EXISTS idx_knowledge_events_created_at
  ON knowledge_events("createdAt");

CREATE INDEX IF NOT EXISTS idx_knowledge_events_session_id
  ON knowledge_events("sessionId");

CREATE INDEX IF NOT EXISTS idx_knowledge_events_hit
  ON knowledge_events("hit");

-- Composite index for common analytics queries
CREATE INDEX IF NOT EXISTS idx_knowledge_events_analytics
  ON knowledge_events("createdAt", "hit", "sourceType");

-- Indexes for chat_analytics table
CREATE INDEX IF NOT EXISTS idx_chat_analytics_session_id
  ON chat_analytics("sessionId");

CREATE INDEX IF NOT EXISTS idx_chat_analytics_last_activity
  ON chat_analytics("lastActivityAt");

CREATE INDEX IF NOT EXISTS idx_chat_analytics_created_at
  ON chat_analytics("createdAt");

-- Indexes for Chat table (improve history queries)
CREATE INDEX IF NOT EXISTS idx_chat_session_id
  ON "Chat"("sessionId");

CREATE INDEX IF NOT EXISTS idx_chat_user_id
  ON "Chat"("userId");

CREATE INDEX IF NOT EXISTS idx_chat_created_at
  ON "Chat"("createdAt");

-- Indexes for Message_v2 table (improve message retrieval)
CREATE INDEX IF NOT EXISTS idx_message_v2_chat_id
  ON "Message_v2"("chatId");

CREATE INDEX IF NOT EXISTS idx_message_v2_created_at
  ON "Message_v2"("createdAt");
