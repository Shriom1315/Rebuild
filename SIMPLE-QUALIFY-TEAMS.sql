-- SIMPLE VERSION: Qualify Teams for GD Round
-- Run each section separately in Supabase SQL Editor

-- ============================================
-- SECTION 1: Check what teams you have
-- ============================================
SELECT team_code, team_name, status
FROM teams
ORDER BY team_name;

-- ============================================
-- SECTION 2: Qualify ALL teams for GD Round
-- ============================================
UPDATE teams 
SET status = 'qualified';

-- ============================================
-- SECTION 3: Verify teams are qualified
-- ============================================
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

-- ============================================
-- DONE! Now refresh your GD Judge page
-- You should see teams in the left sidebar
-- ============================================
