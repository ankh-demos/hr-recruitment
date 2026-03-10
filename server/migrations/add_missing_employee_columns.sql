-- Migration: Add missing employee columns and update status constraint
-- Run this in Supabase SQL Editor

-- 1. Add missing columns to employees table
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

-- 2. Update the status CHECK constraint to include all new statuses
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;
ALTER TABLE employees ADD CONSTRAINT employees_status_check CHECK (status IN (
  'active', 'new_0_3', 'new_0_6', 'month_6_12', 'experienced_1_3', 'over_3_years',
  'inactive_transaction', 'inactive', 'active_no_transaction',
  'on_leave', 'maternity_leave', 'team_member', 'top'
));

-- 3. Add missing columns to resigned_agents table too
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS has_iconnect BOOLEAN DEFAULT false;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS is_assistant BOOLEAN DEFAULT false;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS assistant_of TEXT;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS has_szh_training BOOLEAN DEFAULT false;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS szh_training_date TEXT;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS szh_official_letter_number TEXT;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS training_start_date DATE;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS training_end_date DATE;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS fireup_date DATE;
ALTER TABLE resigned_agents ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;

-- 4. Add missing columns to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS training_start_date DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS training_end_date DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS referred_agent_name TEXT;
