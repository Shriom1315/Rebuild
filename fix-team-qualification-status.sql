-- Fix team qualification status issues
-- Run this in Supabase SQL Editor

-- Step 1: Check current team statuses
SELECT 
    t.team_name,
    t.team_code,
    r.name as round_name,
    trs.status,
    trs.score,
    trs.message
FROM team_round_status trs
JOIN teams t ON t.id = trs.team_id
JOIN rounds r ON r.id = trs.round_id
ORDER BY r.round_number, t.team_name;

-- Step 2: Fix teams that completed aptitude but show as not qualified
-- Mark teams with aptitude scores as qualified for Round 1
UPDATE team_round_status
SET 
    status = 'qualified',
    message = 'Qualified for next round'
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  AND (status = 'eliminated' OR status = 'not_started' OR status IS NULL)
  AND team_id IN (
    SELECT DISTINCT t.id 
    FROM teams t
    JOIN students s ON s.team_id = t.id
    JOIN student_scores ss ON ss.student_id = s.id
    WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  );

-- Step 3: Fix teams that have technical round scores
-- Mark teams with technical scores as qualified
UPDATE team_round_status
SET status = 'qualified'
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 2)
  AND score IS NOT NULL
  AND score > 0
  AND status != 'qualified';

-- Step 4: Create team_round_status entries for teams that don't have them
-- For Round 1 (Aptitude) - mark as qualified if they have scores
INSERT INTO team_round_status (team_id, round_id, status, message)
SELECT DISTINCT 
    t.id as team_id,
    r.id as round_id,
    'qualified' as status,
    'Qualified based on aptitude scores' as message
FROM teams t
CROSS JOIN rounds r
WHERE r.round_number = 1
  AND NOT EXISTS (
    SELECT 1 FROM team_round_status trs 
    WHERE trs.team_id = t.id AND trs.round_id = r.id
  )
  AND EXISTS (
    SELECT 1 FROM students s
    JOIN student_scores ss ON ss.student_id = s.id
    WHERE s.team_id = t.id AND ss.round_id = r.id
  )
ON CONFLICT (team_id, round_id) DO NOTHING;

-- Step 5: For Round 2 (Technical) - create entries for teams that should participate
INSERT INTO team_round_status (team_id, round_id, status, message)
SELECT DISTINCT 
    t.id as team_id,
    r.id as round_id,
    'in_progress' as status,
    'Ready for technical round' as message
FROM teams t
CROSS JOIN rounds r
WHERE r.round_number = 2
  AND NOT EXISTS (
    SELECT 1 FROM team_round_status trs 
    WHERE trs.team_id = t.id AND trs.round_id = r.id
  )
  AND EXISTS (
    -- Team qualified from Round 1
    SELECT 1 FROM team_round_status trs1
    JOIN rounds r1 ON r1.id = trs1.round_id
    WHERE trs1.team_id = t.id 
      AND r1.round_number = 1 
      AND trs1.status = 'qualified'
  )
ON CONFLICT (team_id, round_id) DO NOTHING;

-- Step 6: Verify the fixes
SELECT 
    t.team_name,
    r.name as round_name,
    trs.status,
    trs.score,
    trs.percentage,
    trs.message
FROM team_round_status trs
JOIN teams t ON t.id = trs.team_id
JOIN rounds r ON r.id = trs.round_id
ORDER BY r.round_number, t.team_name;

SELECT 'Team qualification status fixed!' as message;
