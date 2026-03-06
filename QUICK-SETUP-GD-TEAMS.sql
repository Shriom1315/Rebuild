-- Quick Setup: Qualify Teams for GD Round (Round 3)
-- Run this in Supabase SQL Editor to make teams visible in GD Judge panel

-- Step 1: Check current team statuses
SELECT team_code, team_name, status
FROM teams
ORDER BY team_name
LIMIT 10;

-- Step 2: Qualify teams for GD Round
-- Option A: Qualify ALL teams (for testing)
UPDATE teams 
SET status = 'qualified'
WHERE id IS NOT NULL;

-- Option B: Qualify specific teams by team_code (recommended)
/*
UPDATE teams 
SET status = 'qualified'
WHERE team_code IN ('RB-0001', 'RB-0002', 'RB-0003', 'RB-0004', 'RB-0005');
*/

-- Step 3: Get Round 3 (GD) ID and update team_round_status
DO $$
DECLARE
  gd_round_id UUID;
BEGIN
  -- Get GD round ID
  SELECT id INTO gd_round_id 
  FROM rounds 
  WHERE round_number = 3 
  LIMIT 1;
  
  -- Insert/Update team_round_status for qualified teams
  INSERT INTO team_round_status (team_id, round_id, status, qualified)
  SELECT 
    t.id,
    gd_round_id,
    'qualified',
    true
  FROM teams t
  WHERE t.status = 'qualified'
  ON CONFLICT (team_id, round_id) 
  DO UPDATE SET 
    status = 'qualified',
    qualified = true;
    
  RAISE NOTICE 'Teams qualified for GD Round';
END $$;

-- Step 4: Verify setup - Check which teams are now visible to GD Judge
SELECT 
  t.team_code,
  t.team_name,
  t.status,
  COUNT(s.id) as member_count,
  STRING_AGG(s.full_name, ', ') as members
FROM teams t
LEFT JOIN students s ON s.team_id = t.id
WHERE t.status = 'qualified'
GROUP BY t.id, t.team_code, t.team_name, t.status
ORDER BY t.team_name;

-- IMPORTANT NOTES:
-- 1. GD Judge panel shows teams where status = 'qualified'
-- 2. Teams must have members (students) to evaluate
-- 3. After running this, refresh the GD Judge page
-- 4. Click on a team in the left sidebar to see the evaluation table
