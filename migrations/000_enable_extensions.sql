-- Migration 000: Enable required PostgreSQL extensions
-- Safe to run multiple times (idempotent)
-- Purpose: Ensure pgcrypto is available for gen_random_uuid()

BEGIN;

-- Enable pgcrypto for UUID generation
-- Note: pgvector should already be enabled in your Vercel/Neon setup
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extensions are enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'pgcrypto extension failed to install';
  END IF;
  
  RAISE NOTICE 'Extensions verified: pgcrypto is enabled';
END$$;

COMMIT;
