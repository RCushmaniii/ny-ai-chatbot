-- Migration: Add knowledge_events table for RAG Intelligence Layer
-- Purpose: Track which knowledge sources are used, identify gaps, measure RAG performance
-- Date: 2024-12-09

-- Create knowledge_events table
CREATE TABLE IF NOT EXISTS knowledge_events (
  id SERIAL PRIMARY KEY,
  "chatId" UUID REFERENCES "Chat"(id) ON DELETE CASCADE,
  "messageId" UUID,
  "sessionId" TEXT,
  query TEXT NOT NULL,                -- The user message that triggered retrieval
  "sourceType" TEXT,                  -- 'website' | 'document'
  "sourceId" TEXT,                    -- URL or document ID
  "chunkId" TEXT,                     -- specific chunk reference
  relevance NUMERIC,                  -- cosine similarity score (0-1)
  hit BOOLEAN DEFAULT TRUE,           -- TRUE = matched chunk, FALSE = no results
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ke_chatId ON knowledge_events("chatId");
CREATE INDEX IF NOT EXISTS idx_ke_messageId ON knowledge_events("messageId");
CREATE INDEX IF NOT EXISTS idx_ke_sourceId ON knowledge_events("sourceId");
CREATE INDEX IF NOT EXISTS idx_ke_chunkId ON knowledge_events("chunkId");
CREATE INDEX IF NOT EXISTS idx_ke_createdAt ON knowledge_events("createdAt");
CREATE INDEX IF NOT EXISTS idx_ke_hit ON knowledge_events(hit);
CREATE INDEX IF NOT EXISTS idx_ke_sourceType ON knowledge_events("sourceType");

-- Add comments for documentation
COMMENT ON TABLE knowledge_events IS 'Tracks RAG retrieval events for knowledge base optimization';
COMMENT ON COLUMN knowledge_events.query IS 'User query that triggered RAG retrieval';
COMMENT ON COLUMN knowledge_events."sourceType" IS 'Type of knowledge source: website or document';
COMMENT ON COLUMN knowledge_events."sourceId" IS 'URL for website content or document ID';
COMMENT ON COLUMN knowledge_events."chunkId" IS 'Specific chunk identifier within the source';
COMMENT ON COLUMN knowledge_events.relevance IS 'Cosine similarity score (0-1) indicating match quality';
COMMENT ON COLUMN knowledge_events.hit IS 'FALSE when no knowledge was retrieved for the query';

-- Verification query
DO $$
BEGIN
  RAISE NOTICE 'knowledge_events table created successfully';
  RAISE NOTICE 'Indexes created for optimal query performance';
END $$;
