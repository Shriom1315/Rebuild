-- Check current team statuses
SELECT 
  team_code,
  team_name,
  status,
  event_name
FROM teams
ORDER BY team_name;

-- Check team_round_status for Round 3 (GD)
SELECT 
  t.team_code,
  t.team_name,
  trs.round_id,
  r.name as round_name,
  trs.status,
  trs.qualified
FROM team_round_status trs
JOIN teams t ON t.id = trs.team_id
JOIN rounds r ON r.id = trs.round_id
WHERE r.round_number = 3
ORDER BY t.team_name;

-- If you need to manually qualify some teams for GD (Round 3), run this:
-- Replace 'TEAM_CODE_HERE' with actual team codes

-- Example: Qualify a team for GD Round
/*
UPDATE teams 
SET status = 'qualified'
WHERE team_code IN ('RB-0001', 'RB-0002', 'RB-0003');

-- Also update team_round_status
INSERT INTO team_round_status (team_id, round_id, status, qualified)
SELECT 
  t.id,
  r.id,
  'qualified',
  true
FROM teams t
CROSS JOIN rounds r
WHERE t.team_code IN ('RB-0001', 'RB-0002', 'RB-0003')
  AND r.round_number = 3
ON CONFLICT (team_id, round_id) 
DO UPDATE SET 
  status = 'qualified',
  qualified = true;
*/
