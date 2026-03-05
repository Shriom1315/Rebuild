-- Check Team Elimination Status
-- Run this to see if a team is eliminated and why they can still access rounds

-- 1. Check team_round_status for all teams
SELECT 
  t.team_name,
  t.team_code,
  r.name as round_name,
  r.round_number,
  r.is_active,
  trs.status,
  trs.message
FROM team_round_status trs
JOIN teams t ON trs.team_id = t.id
JOIN rounds r ON trs.round_id = r.id
ORDER BY t.team_name, r.round_number;

-- 2. Check if team A is eliminated
SELECT 
  t.team_name,
  COUNT(CASE WHEN trs.status = 'eliminated' THEN 1 END) as eliminated_rounds,
  COUNT(CASE WHEN trs.status = 'qualified' THEN 1 END) as qualified_rounds
FROM teams t
LEFT JOIN team_round_status trs ON t.team_id = trs.team_id
WHERE t.team_name = 'team A'
GROUP BY t.team_name;

-- 3. Check individual student eliminations for team A
SELECT 
  s.full_name,
  t.team_name,
  r.name as round_name,
  sa.is_eliminated
FROM student_answers sa
JOIN students s ON sa.student_id = s.id
JOIN teams t ON s.team_id = t.id
JOIN rounds r ON sa.round_id = r.id
WHERE t.team_name = 'team A'
  AND sa.is_eliminated = true;

-- 4. Check current active round
SELECT 
  id,
  name,
  round_number,
  type,
  is_active,
  is_completed,
  results_announced
FROM rounds
WHERE is_active = true;

-- 5. SOLUTION: If team is eliminated but still seeing rounds, run this:
-- This ensures team_round_status has the elimination record
/*
INSERT INTO team_round_status (team_id, round_id, status, message)
SELECT 
  t.id as team_id,
  r.id as round_id,
  'eliminated' as status,
  'Team eliminated from previous round' as message
FROM teams t
CROSS JOIN rounds r
WHERE t.team_name = 'team A'
  AND r.round_number >= 2  -- Eliminate from round 2 onwards
  AND NOT EXISTS (
    SELECT 1 FROM team_round_status trs2
    WHERE trs2.team_id = t.id AND trs2.round_id = r.id
  )
ON CONFLICT (team_id, round_id) 
DO UPDATE SET 
  status = 'eliminated',
  message = 'Team eliminated from previous round';
*/
