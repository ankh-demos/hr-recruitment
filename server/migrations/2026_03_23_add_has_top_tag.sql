-- ============================================================
-- Migration: Add TOP yes/no tag columns
-- Date: 2026-03-23
-- Description: Adds has_top to employees and resigned_agents
--   so TOP can be managed as an additional boolean tag.
-- ============================================================

BEGIN;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_top BOOLEAN DEFAULT false;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS has_top BOOLEAN DEFAULT false;

ALTER TABLE employees ALTER COLUMN has_top DROP NOT NULL;
ALTER TABLE resigned_agents ALTER COLUMN has_top DROP NOT NULL;

COMMIT;
