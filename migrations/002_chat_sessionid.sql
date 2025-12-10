-- Migration 002: Add anonymous session support to Chat table
-- Safe to run multiple times (idempotent)
-- Purpose: Enable sessionId-based chat tracking without requiring user accounts

BEGIN;

-- Add sessionId column for anonymous session tracking
ALTER TABLE "Chat"
  ADD COLUMN IF NOT EXISTS "sessionId" VARCHAR(64);

-- Make userId optional (allow NULL for anonymous chats)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_name = 'Chat' AND column_name = 'userId'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "Chat" ALTER COLUMN "userId" DROP NOT NULL;
    RAISE NOTICE 'Made userId nullable in Chat table';
  ELSE
    RAISE NOTICE 'userId is already nullable in Chat table';
  END IF;
END$$;

-- Create indexes for efficient session-based queries
CREATE INDEX IF NOT EXISTS idx_chat_sessionId 
  ON "Chat"("sessionId") 
  WHERE "sessionId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_createdAt 
  ON "Chat"("createdAt" DESC);

-- Composite index for session + date queries
CREATE INDEX IF NOT EXISTS idx_chat_session_date 
  ON "Chat"("sessionId", "createdAt" DESC) 
  WHERE "sessionId" IS NOT NULL;

-- Log migration status
DO $$
DECLARE
  total_chats INTEGER;
  chats_with_session INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_chats FROM "Chat";
  SELECT COUNT(*) INTO chats_with_session FROM "Chat" WHERE "sessionId" IS NOT NULL;
  
  RAISE NOTICE 'Chat table updated: % total chats, % with sessionId', 
    total_chats, chats_with_session;
END$$;

COMMIT;
