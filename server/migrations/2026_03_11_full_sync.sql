-- ============================================================
-- Migration: Full DB sync with latest application code
-- Date: 2026-03-11
-- Description: Comprehensive migration that brings the database
--   in line with the current TypeScript codebase. Safe to run
--   on any state (fresh schema or partially migrated).
-- Run this in your Supabase SQL Editor.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. APPLICATIONS TABLE
-- ============================================================

-- Add columns that may be missing
ALTER TABLE applications ADD COLUMN IF NOT EXISTS training_start_date DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS training_end_date DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS referred_agent_name TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;

-- ============================================================
-- 2. EMPLOYEES TABLE — Add missing columns
-- ============================================================

-- Extended boolean / text columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_iconnect BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_assistant BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS assistant_of TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_szh_training BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS szh_training_date TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS szh_official_letter_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_top BOOLEAN DEFAULT false;

-- Date / flag columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS training_start_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS training_end_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fireup_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;

-- Computed-tag boolean columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_first_transaction BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS exclude_from_kpi BOOLEAN DEFAULT false;

-- Make employee fields optional so iConnect move can succeed even with partial application data
ALTER TABLE employees ALTER COLUMN application_id DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN iconnect_name DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN family_name DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN interested_office DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN birth_place DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN ethnicity DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN register_number DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN home_address DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN emergency_phone DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN email DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN facebook DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN family_members DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN education DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN languages DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN work_experience DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN awards DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN other_skills DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN strengths_weaknesses DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_driver_license DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN photo_url DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN referral_source DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN signature_url DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN training_number DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN certificate_number DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN citizen_registration_number DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN szh_certificate_number DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN certificate_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN remax_email DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN mls DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN bank DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN account_number DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN district DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN detailed_address DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN children_count DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN employment_start_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN office_name DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN status DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN hired_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_iconnect DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN is_assistant DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN assistant_of DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_szh_training DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN szh_training_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN szh_official_letter_number DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_top DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN training_start_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN training_end_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN fireup_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN is_transfer DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_first_transaction DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN exclude_from_kpi DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN updated_at DROP NOT NULL;

-- ============================================================
-- 2b. EMPLOYEES — Migrate old status values to new ones
-- ============================================================

-- Map legacy statuses to the new 8-value set.
-- Only updates rows that still carry an old value.
UPDATE employees SET status = 'active_transaction'    WHERE status IN ('active', 'top');
UPDATE employees SET status = 'active_no_transaction' WHERE status IN ('new_0_3', 'new_0_6', 'month_6_12', 'experienced_1_3', 'over_3_years', 'team_member');
UPDATE employees SET status = 'on_leave_iconnect'     WHERE status IN ('on_leave', 'maternity_leave');
-- 'inactive_transaction', 'inactive' stay as-is (unchanged names)

-- ============================================================
-- 2c. EMPLOYEES — Update status CHECK constraint
-- ============================================================

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;
ALTER TABLE employees ADD CONSTRAINT employees_status_check CHECK (
  status IN (
    'active_transaction',
    'active_no_transaction',
    'inactive_transaction',
    'inactive',
    'on_leave_iconnect',
    'on_leave_closed',
    'hidden_iconnect',
    'left_team'
  )
);

-- ============================================================
-- 3. RESIGNED_AGENTS TABLE — Add missing columns
-- ============================================================

-- Extended boolean / text columns (copied from employee on resignation)
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS has_iconnect BOOLEAN DEFAULT false;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS is_assistant BOOLEAN DEFAULT false;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS assistant_of TEXT;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS has_szh_training BOOLEAN DEFAULT false;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS szh_training_date TEXT;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS szh_official_letter_number TEXT;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS has_top BOOLEAN DEFAULT false;

-- Date / flag columns
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS training_start_date DATE;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS training_end_date DATE;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS fireup_date DATE;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;

-- Computed-tag boolean columns
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS has_first_transaction BOOLEAN DEFAULT false;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS exclude_from_kpi BOOLEAN DEFAULT false;

-- ============================================================
-- 4. VERIFICATION QUERIES
-- ============================================================

-- Check employees columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees'
ORDER BY ordinal_position;

-- Check applications columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
ORDER BY ordinal_position;

-- Check resigned_agents columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'resigned_agents'
ORDER BY ordinal_position;

-- Check employee status constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'employees'::regclass AND contype = 'c';

COMMIT;
