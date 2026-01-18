-- Add sessionId column to Chat table for anonymous session tracking
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "sessionId" varchar(64);

-- Add lastContext column if it doesn't exist (used for context storage)
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "lastContext" jsonb;
