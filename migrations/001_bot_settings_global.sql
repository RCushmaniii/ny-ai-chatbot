-- Migration 001: Convert bot_settings to global singleton
-- Safe to run multiple times (idempotent)
-- Purpose: Remove userId dependency, enforce single active settings row

BEGIN;

-- Drop foreign key constraint if it exists
ALTER TABLE bot_settings DROP CONSTRAINT IF EXISTS bot_settings_userId_fkey;

-- Drop userId column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_settings' AND column_name = 'userId'
  ) THEN
    ALTER TABLE bot_settings DROP COLUMN "userId";
    RAISE NOTICE 'Dropped userId column from bot_settings';
  ELSE
    RAISE NOTICE 'userId column already removed from bot_settings';
  END IF;
END$$;

-- Add is_active flag for singleton pattern
ALTER TABLE bot_settings
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure only one active settings row exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_settings_active
  ON bot_settings(is_active) WHERE is_active = true;

-- If multiple rows exist, keep the newest and mark others inactive
DO $$
DECLARE
  newest_id INTEGER;
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM bot_settings;
  
  IF row_count > 1 THEN
    -- Get the newest settings row
    SELECT id INTO newest_id
    FROM bot_settings
    ORDER BY COALESCE("updatedAt", "createdAt", NOW()) DESC
    LIMIT 1;
    
    -- Mark all others as inactive
    UPDATE bot_settings
    SET is_active = false
    WHERE id != newest_id;
    
    RAISE NOTICE 'Consolidated % bot_settings rows into one active row (id: %)', row_count, newest_id;
  ELSIF row_count = 1 THEN
    -- Ensure the single row is active
    UPDATE bot_settings SET is_active = true;
    RAISE NOTICE 'Single bot_settings row marked as active';
  ELSE
    -- No settings exist, create a default row
    INSERT INTO bot_settings (
      "botName",
      "customInstructions",
      "starterQuestions",
      is_active,
      "createdAt",
      "updatedAt"
    ) VALUES (
      'NY English Teacher Assistant',
      NULL, -- Will be set via admin panel
      NULL, -- Will be set via admin panel
      true,
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Created default bot_settings row';
  END IF;
END$$;

COMMIT;
