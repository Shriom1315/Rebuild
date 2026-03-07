-- Add scoring columns to team_round_status table
-- Run this in Supabase SQL Editor

-- Step 1: Add scoring columns
ALTER TABLE team_round_status 
ADD COLUMN IF NOT EXISTS score DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_score DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Step 2: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'team_round_status'
ORDER BY ordinal_position;

-- NOTES:
-- 1. score: The team's score for the round (e.g., 85.5)
-- 2. max_score: Maximum possible score (e.g., 100)
-- 3. percentage: Calculated percentage (score/max_score * 100)
-- 4. remarks: Optional notes about team performance

-- Example usage:
/*
-- Update a team's score for technical round
UPDATE team_round_status
SET 
  score = 85.5,
  max_score = 100,
  percentage = 85.5,
  remarks = 'Excellent problem-solving skills',
  status = 'completed'
WHERE team_id = 'your-team-id' AND round_id = 'your-round-id';
*/

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_round_status_score 
ON team_round_status(round_id, score DESC);

SELECT 'Team scoring columns added successfully!' as message;
