-- ============================================================
-- Migration: Make employee fields optional for iConnect move flow
-- Date: 2026-03-17
-- Description: Drops NOT NULL constraints from employee columns
--   (except primary key), so partial applications can be moved
--   into employees without insert failures.
-- ============================================================

BEGIN;

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
ALTER TABLE employees ALTER COLUMN training_start_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN training_end_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN fireup_date DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN is_transfer DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN has_first_transaction DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN exclude_from_kpi DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN updated_at DROP NOT NULL;

COMMIT;
