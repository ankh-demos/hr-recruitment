-- Migration: Add team_member to employees status enum check

BEGIN;

UPDATE employees
SET status = 'active_transaction'
WHERE status = 'active';

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
    'team_member',
    'left_team'
  )
);

COMMIT;