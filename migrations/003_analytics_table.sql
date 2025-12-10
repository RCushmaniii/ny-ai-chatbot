-- Migration 003: Create chat analytics table
-- Safe to run multiple times (idempotent)
-- Purpose: Track usage metrics, performance, and conversation quality

BEGIN;

-- Create analytics table
CREATE TABLE IF NOT EXISTS chat_analytics (
  id SERIAL PRIMARY KEY,
  "chatId" UUID REFERENCES "Chat"(id) ON DELETE CASCADE,
  "sessionId" VARCHAR(64),
  "messageCount" INTEGER DEFAULT 0,
  "knowledgeHits" INTEGER DEFAULT 0,
  "avgResponseTime" INTEGER, -- milliseconds
  "userLanguage" VARCHAR(10), -- 'en', 'es', etc.
  "hasKnowledgeResults" BOOLEAN DEFAULT false,
  "firstMessageAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastActivityAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_analytics_session 
  ON chat_analytics("sessionId") 
  WHERE "sessionId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_created 
  ON chat_analytics("createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_chatid 
  ON chat_analytics("chatId");

CREATE INDEX IF NOT EXISTS idx_analytics_language 
  ON chat_analytics("userLanguage") 
  WHERE "userLanguage" IS NOT NULL;

-- Index for date-range queries (common in analytics)
CREATE INDEX IF NOT EXISTS idx_analytics_activity 
  ON chat_analytics("lastActivityAt" DESC);

-- Add comment for documentation
COMMENT ON TABLE chat_analytics IS 'Tracks chat session metrics for admin analytics dashboard';
COMMENT ON COLUMN chat_analytics."messageCount" IS 'Total messages in conversation (user + assistant)';
COMMENT ON COLUMN chat_analytics."knowledgeHits" IS 'Number of times knowledge base was queried';
COMMENT ON COLUMN chat_analytics."avgResponseTime" IS 'Average AI response time in milliseconds';
COMMENT ON COLUMN chat_analytics."hasKnowledgeResults" IS 'Whether any knowledge base results were found';

-- Log table creation
DO $$
BEGIN
  RAISE NOTICE 'chat_analytics table created with indexes';
END$$;

COMMIT;
