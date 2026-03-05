-- ============================================
-- ULTRA SIMPLE FIX - Copy and paste this entire file
-- No functions, no triggers, just plain SQL
-- ============================================

-- Get the Round 1 ID (you'll see it in the output)
SELECT 'Round 1 ID:' as info, id FROM rounds WHERE round_number = 1;

-- ============================================
-- STEP 1: Mark answers as correct/incorrect
-- ============================================
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id;

SELECT 'Step 1 Complete: Marked answers as correct/incorrect' as status;

-- ============================================
-- STEP 2: Clear old scores (if any)
-- ============================================
DELETE FROM student_scores 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

DELETE FROM team_scores 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

SELECT 'Step 2 Complete: Cleared old scores' as status;

-- ============================================
-- STEP 3: Calculate student scores
-- ============================================
INSERT INTO student_scores (student_id, round_id, score, max_score, percentage, remarks)
SELECT 
  sa.student_id,
  sa.round_id,
  SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END) as score,
  SUM(q.points) as max_score,
  ROUND((SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END)::NUMERIC / 
         NULLIF(SUM(q.points), 0) * 100), 2) as percentage,
  'Auto-calculated' as remarks
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY sa.student_id, sa.round_id;

SELECT 'Step 3 Complete: Calculated ' || COUNT(*) || ' student scores' as status
FROM student_scores
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- ============================================
-- STEP 4: Calculate team scores
-- ============================================
INSERT INTO team_scores (team_id, round_id, total_score, average_score)
SELECT 
  s.team_id,
  ss.round_id,
  COALESCE(SUM(ss.score), 0) as total_score,
  COALESCE(AVG(ss.score), 0) as average_score
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.team_id, ss.round_id;

SELECT 'Step 4 Complete: Calculated ' || COUNT(*) || ' team scores' as status
FROM team_scores
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- ============================================
-- STEP 5: Update teams table (if column exists)
-- ============================================
DO $$
BEGIN
  UPDATE teams t
  SET total_score = ts.total_score
  FROM team_scores ts
  WHERE t.id = ts.team_id
    AND ts.round_id IN (SELECT id FROM rounds WHERE round_number = 1);
  
  RAISE NOTICE 'Step 5 Complete: Updated teams total_score';
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'Step 5 Skipped: teams.total_score column does not exist (this is OK)';
END $$;

-- ============================================
-- RESULTS: Student Scores
-- ============================================
SELECT 
  '=== STUDENT SCORES ===' as section,
  NULL::TEXT as team,
  NULL::TEXT as student,
  NULL::NUMERIC as score,
  NULL::NUMERIC as max_score,
  NULL::NUMERIC as percentage
UNION ALL
SELECT 
  '',
  t.team_name,
  s.full_name,
  ss.score,
  ss.max_score,
  ss.percentage
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY score DESC NULLS LAST;

-- ============================================
-- RESULTS: Team Totals
-- ============================================
SELECT 
  '=== TEAM TOTALS ===' as section,
  NULL::TEXT as team,
  NULL::NUMERIC as total_score,
  NULL::NUMERIC as average_score
UNION ALL
SELECT 
  '',
  t.team_name,
  ts.total_score,
  ts.average_score
FROM team_scores ts
JOIN teams t ON ts.team_id = t.id
WHERE ts.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY total_score DESC NULLS LAST;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  '✓ SUCCESS!' as status,
  'Scores calculated and saved' as message;

SELECT 
  'Students scored:' as metric,
  COUNT(*)::TEXT as count
FROM student_scores
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
UNION ALL
SELECT 
  'Teams scored:',
  COUNT(*)::TEXT
FROM team_scores
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- ============================================
-- NEXT STEPS
-- ============================================
SELECT 
  'NEXT STEP:' as action,
  'Go to /admin/scores and click "Announce Results"' as instruction;
