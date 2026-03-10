-- Migration: Add missing columns to employees table
-- Run this in your Supabase SQL Editor

-- Add fireup_date column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fireup_date DATE;

-- Add training dates columns  
ALTER TABLE employees ADD COLUMN IF NOT EXISTS training_start_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS training_end_date DATE;

-- Add is_transfer column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;

-- Update the status CHECK constraint to include all valid statuses
-- First, drop the old constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;

-- Add new constraint with all valid statuses
ALTER TABLE employees ADD CONSTRAINT employees_status_check 
  CHECK (status IN (
    'active', 
    'new_0_6', 
    'month_6_12', 
    'experienced_1_3', 
    'over_3_years',
    'inactive_transaction', 
    'inactive', 
    'active_no_transaction', 
    'on_leave', 
    'maternity_leave', 
    'team_member',
    'top'
  ));

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name IN ('fireup_date', 'training_start_date', 'training_end_date', 'is_transfer');
