-- ============================================
-- FIX FAIR SCORING SYSTEM
-- Uses AVERAGE scores to make it fair for all team sizes
-- ============================================

-- Step 1: Mark answers as correct/incorrect
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id;

-- Step 2: Clear old scores
DELETE FROM student_scores 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

DELETE FROM team_scores 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 3: Calculate student scores (individual performance)
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

-- Step 4: Calculate FAIR team scores using AVERAGE
-- This makes it fair regardless of team size (2, 3, or 4 members)
INSERT INTO team_scores (team_id, round_id, total_score, average_score)
SELECT 
  s.team_id,
  ss.round_id,
  -- Average score (fair for all team sizes)
  ROUND(AVG(ss.score), 2) as total_score,
  ROUND(AVG(ss.score), 2) as average_score
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.team_id, ss.round_id;

-- Step 5: Update teams table with average score
DO $$
BEGIN
  UPDATE teams t
  SET total_score = ts.total_score
  FROM team_scores ts
  WHERE t.id = ts.team_id
    AND ts.round_id IN (SELECT id FROM rounds WHERE round_number = 1);
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END $$;

-- ============================================
-- RESULTS
-- ============================================

SELECT 
  '=== FAIR TEAM RANKINGS (by Average Score) ===' as section,
  NULL::TEXT as rank,
  NULL::TEXT as team,
  NULL::INT as members,
  NULL::NUMERIC as avg_score,
  NULL::NUMERIC as total_individual_sum
UNION ALL
SELECT 
  '',
  ROW_NUMBER() OVER (ORDER BY ts.average_score DESC)::TEXT,
  t.team_name,
  COUNT(s.id)::INT,
  ts.average_score,
  SUM(ss.score) as total_sum
FROM team_scores ts
JOIN teams t ON ts.team_id = t.id
LEFT JOIN students s ON s.team_id = t.id
LEFT JOIN student_scores ss ON ss.student_id = s.id AND ss.round_id = ts.round_id
WHERE ts.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY t.team_name, ts.average_score, ts.total_score
ORDER BY avg_score DESC NULLS LAST;

-- Individual scores
SELECT 
  '=== INDIVIDUAL STUDENT SCORES ===' as section,
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

-- Summary
SELECT 
  '✓ FAIR SCORING COMPLETE!' as status,
  'Teams ranked by AVERAGE score (fair for all team sizes)' as message;

SELECT 
  'Explanation:' as note,
  'A 2-member team with avg 8.0 beats a 4-member team with avg 7.5' as example;
