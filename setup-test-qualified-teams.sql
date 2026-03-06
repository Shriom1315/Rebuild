-- Setup Test: Qualify first 5 teams for GD Round (Round 3)
-- This will make them visible in the GD Judge panel

-- Step 1: Update team status to 'qualified'
UPDATE teams 
SET status = 'qualified'
WHERE id IN (
  SELECT id FROM teams 
  ORDER BY team_name 
  LIMIT 5
);

-- Step 2: Get the Round 3 (GD) round_id
DO $$
DECLARE
  gd_round_id UUID;
BEGIN
  SELECT id INTO gd_round_id FROM rounds WHERE round_number = 3 LIMIT 1;
  
  -- Step 3: Insert/Update team_round_status for these teams
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
END $$;

-- Verify the setup
SELECT 
  t.team_code,
  t.team_name,
  t.status,
  COUNT(s.id) as member_count
FROM teams t
LEFT JOIN students s ON s.team_id = t.id
WHERE t.status = 'qualified'
GROUP BY t.id, t.team_code, t.team_name, t.status
ORDER BY t.team_name;
