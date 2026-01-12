-- Migration: Clean up deprecated v1 tables
-- Date: 2026-01-11
--
-- IMPORTANT: Review this migration carefully before running in production!
-- The deprecated tables may still contain historical data that hasn't been migrated.
--
-- Steps:
-- 1. First verify no data exists in deprecated tables that isn't in v2
-- 2. Backup any data if needed
-- 3. Then uncomment and run the DROP statements

-- Check counts before dropping (run these first to verify)
-- SELECT 'Message (deprecated)' as table_name, COUNT(*) as count FROM "Message"
-- UNION ALL
-- SELECT 'Message_v2 (current)' as table_name, COUNT(*) as count FROM "Message_v2"
-- UNION ALL
-- SELECT 'Vote (deprecated)' as table_name, COUNT(*) as count FROM "Vote"
-- UNION ALL
-- SELECT 'Vote_v2 (current)' as table_name, COUNT(*) as count FROM "Vote_v2";

-- Drop deprecated Vote table first (has foreign key to Message)
-- UNCOMMENT AFTER VERIFICATION:
-- DROP TABLE IF EXISTS "Vote" CASCADE;

-- Drop deprecated Message table
-- UNCOMMENT AFTER VERIFICATION:
-- DROP TABLE IF EXISTS "Message" CASCADE;

-- Note: If you need to preserve data, run this backup first:
-- CREATE TABLE "Message_backup" AS SELECT * FROM "Message";
-- CREATE TABLE "Vote_backup" AS SELECT * FROM "Vote";
