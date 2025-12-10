-- Migration 004: Backfill sessionId for existing chats
-- Safe to run multiple times (idempotent)
-- Purpose: Assign sessionIds to all existing chats for continuity

BEGIN;

-- Strategy:
-- 1. For chats with userId: Create deterministic sessionId based on userId + date
--    This groups chats from the same user on the same day into one session
-- 2. For chats without userId: Generate random sessionId
--    Each chat becomes its own session

-- Count chats needing migration
DO $$
DECLARE
  chats_needing_session INTEGER;
  chats_with_user INTEGER;
  chats_without_user INTEGER;
BEGIN
  SELECT COUNT(*) INTO chats_needing_session 
  FROM "Chat" 
  WHERE "sessionId" IS NULL;
  
  SELECT COUNT(*) INTO chats_with_user 
  FROM "Chat" 
  WHERE "sessionId" IS NULL AND "userId" IS NOT NULL;
  
  SELECT COUNT(*) INTO chats_without_user 
  FROM "Chat" 
  WHERE "sessionId" IS NULL AND "userId" IS NULL;
  
  RAISE NOTICE 'Starting sessionId backfill:';
  RAISE NOTICE '  Total chats needing sessionId: %', chats_needing_session;
  RAISE NOTICE '  Chats with userId: %', chats_with_user;
  RAISE NOTICE '  Chats without userId: %', chats_without_user;
END$$;

-- 1) Deterministic sessionId for chats with userId
-- Format: md5(userId || date) truncated to 32 chars
-- This keeps all chats from same user on same day in one session
UPDATE "Chat" c
SET "sessionId" = LEFT(md5(c."userId"::text || '|' || DATE(c."createdAt")::text), 32)
WHERE c."sessionId" IS NULL 
  AND c."userId" IS NOT NULL;

-- 2) Random sessionId for chats without userId
-- Each orphaned chat becomes its own session
UPDATE "Chat" c
SET "sessionId" = REPLACE(gen_random_uuid()::text, '-', '')
WHERE c."sessionId" IS NULL 
  AND c."userId" IS NULL;

-- Verify all chats now have sessionId
DO $$
DECLARE
  remaining_null INTEGER;
  total_sessions INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_null 
  FROM "Chat" 
  WHERE "sessionId" IS NULL;
  
  SELECT COUNT(DISTINCT "sessionId") INTO total_sessions 
  FROM "Chat" 
  WHERE "sessionId" IS NOT NULL;
  
  IF remaining_null > 0 THEN
    RAISE WARNING 'Migration incomplete: % chats still missing sessionId', remaining_null;
  ELSE
    RAISE NOTICE 'Migration complete: All chats have sessionId';
    RAISE NOTICE 'Total unique sessions: %', total_sessions;
  END IF;
END$$;

COMMIT;
