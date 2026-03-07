-- Fix team_round_status constraint issue
-- Run this in Supabase SQL Editor

-- Step 1: Check existing constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'team_round_status'::regclass;

-- Step 2: Drop the problematic check constraint if it exists
ALTER TABLE team_round_status 
DROP CONSTRAINT IF EXISTS team_round_status_status_check;

-- Step 3: Add a new, more flexible check constraint
ALTER TABLE team_round_status 
ADD CONSTRAINT team_round_status_status_check 
CHECK (status IN ('not_started', 'in_progress', 'qualified', 'eliminated', 'completed', 'winner'));

-- Step 4: Verify the constraint was updated
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'team_round_status'::regclass
  AND conname = 'team_round_status_status_check';

SELECT 'Constraint fixed successfully! You can now use status = ''completed''' as message;
