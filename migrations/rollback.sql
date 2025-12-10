-- ROLLBACK SCRIPT - Use with extreme caution!
-- This will undo the single-tenant migrations
-- Only use if you need to revert to multi-tenant architecture

-- WARNING: This will not restore deleted data
-- Make sure you have a backup before running this!

BEGIN;

-- Rollback 004: Remove sessionIds (optional - you may want to keep these)
-- UPDATE "Chat" SET "sessionId" = NULL;

-- Rollback 003: Drop analytics table
DROP TABLE IF EXISTS chat_analytics CASCADE;

-- Rollback 002: Revert Chat table changes
-- Note: We cannot make userId NOT NULL again if there are NULL values
-- You would need to delete or fix those rows first
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "sessionId";

-- Rollback 001: Revert bot_settings to multi-tenant
-- Note: This requires re-adding userId column and foreign key
-- You'll need to manually assign userIds to settings rows
ALTER TABLE bot_settings DROP COLUMN IF EXISTS is_active;
DROP INDEX IF EXISTS idx_bot_settings_active;

-- Add userId back (but you'll need to populate it manually)
-- ALTER TABLE bot_settings ADD COLUMN "userId" UUID;
-- ALTER TABLE bot_settings ADD CONSTRAINT bot_settings_userId_fkey 
--   FOREIGN KEY ("userId") REFERENCES "User"(id);

-- Rollback 000: Extensions cannot be safely removed if other features depend on them
-- DROP EXTENSION IF EXISTS pgcrypto;

COMMIT;

-- After running this rollback, you will need to:
-- 1. Manually assign userIds to bot_settings rows
-- 2. Manually assign userIds to any Chat rows that have NULL
-- 3. Re-enable NOT NULL constraint on Chat.userId
-- 4. Update your application code to use multi-tenant logic again
