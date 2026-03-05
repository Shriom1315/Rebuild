-- QUICK CHECK: Is team A eliminated?
-- Run this simple query to see team elimination status

-- Query 1: Check team_round_status for team A
SELECT 
  t.team_name,
  r.name as round_name,
  r.round_number,
  r.is_active,
  trs.status,
  trs.message
FROM team_round_status trs
JOIN teams t ON trs.team_id = t.id
JOIN rounds r ON trs.round_id = r.id
WHERE t.team_name = 'team A'
ORDER BY r.round_number;

-- Expected Result if eliminated:
-- team_name | round_name      | round_number | is_active | status      | message
-- team A    | APTITUDE TEST   | 1            | false     | eliminated  | Team eliminated...

-- Query 2: Check current active round
SELECT 
  id,
  name,
  round_number,
  is_active,
  type
FROM rounds
WHERE is_active = true;

-- Query 3: Count eliminations
SELECT 
  t.team_name,
  COUNT(*) as elimination_count
FROM team_round_status trs
JOIN teams t ON trs.team_id = t.id
WHERE t.team_name = 'team A'
  AND trs.status = 'eliminated'
GROUP BY t.team_name;

-- If elimination_count > 0, team should be blocked from all future rounds
