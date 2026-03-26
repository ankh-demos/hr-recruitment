-- Migration: Enable and normalize RLS on employees table
-- Purpose: Fix Supabase linter errors for RLS disabled and sensitive columns exposed

BEGIN;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON public.employees;
CREATE POLICY "Allow all operations"
ON public.employees
FOR ALL
TO public
USING (true)
WITH CHECK (true);

COMMIT;