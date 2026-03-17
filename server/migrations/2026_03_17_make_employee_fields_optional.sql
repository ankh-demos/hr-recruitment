-- ============================================================
-- Migration: Make employee fields optional for iConnect move flow
-- Date: 2026-03-17
-- Description: Drops NOT NULL constraints from employee columns
--   (except primary key), so partial applications can be moved
--   into employees without insert failures.
-- ============================================================

BEGIN;

-- Drop old status constraint first to allow updates
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;

-- Update old status values to new ones BEFORE making columns nullable
-- Map legacy statuses to their modern equivalents
UPDATE employees SET status = 'active' WHERE status IS NULL OR status = '';
UPDATE employees SET status = 'active_transaction' WHERE status IN ('new_0_3', 'new_0_6', 'new_6_12', 'new_', 'team_member');
UPDATE employees SET status = 'on_leave_iconnect' WHERE status IN ('on_leave', 'maternity_leave');
UPDATE employees SET status = 'inactive' WHERE status IN ('old', 'inactive');
-- Catch-all: map any remaining unmapped statuses to 'active'
UPDATE employees SET status = 'active' WHERE status NOT IN (
  'active', 'active_transaction', 'active_no_transaction', 
  'inactive_transaction', 'inactive', 'on_leave_iconnect', 
  'on_leave_closed', 'hidden_iconnect', 'left_team'
);

-- Now make columns nullable
-- Ensure columns exist before changing nullability
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_iconnect BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_assistant BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS assistant_of TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_szh_training BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS szh_training_date TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS szh_official_letter_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS training_start_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS training_end_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fireup_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_first_transaction BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS exclude_from_kpi BOOLEAN DEFAULT false;

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
-- Keep status as NOT NULL (it's critical for the application)
ALTER TABLE employees ALTER COLUMN hired_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_iconnect DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN is_assistant DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN assistant_of DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_szh_training DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN szh_training_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN szh_official_letter_number DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN training_start_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN training_end_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN fireup_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN is_transfer DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_first_transaction DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN exclude_from_kpi DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN updated_at DROP NOT NULL;

-- Fix status CHECK constraint to match the current status values used by the application.
-- The original schema only had old values; new statuses were added in later migrations
-- but the constraint may not have been updated in all environments.
ALTER TABLE employees ADD CONSTRAINT employees_status_check CHECK (status IN (
  'active',
  'active_transaction',
  'active_no_transaction',
  'inactive_transaction',
  'inactive',
  'on_leave_iconnect',
  'on_leave_closed',
  'hidden_iconnect',
  'left_team'
));

COMMIT;
