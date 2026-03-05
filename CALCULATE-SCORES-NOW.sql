-- CALCULATE SCORES NOW
-- Run this in Supabase SQL Editor to calculate all missing scores

-- Step 1: Calculate scores for all students who submitted answers
INSERT INTO student_scores (
  student_id,
  round_id,
  score,
  correct_count,
  wrong_count,
  total_questions,
  percentage
)
SELECT 
  sa.student_id,
  sa.round_id,
  SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END) as score,
  COUNT(CASE WHEN sa.is_correct THEN 1 END) as correct_count,
  COUNT(CASE WHEN NOT sa.is_correct THEN 1 END) as wrong_count,
  COUNT(*) as total_questions,
  ROUND(
    (COUNT(CASE WHEN sa.is_correct THEN 1 END)::numeric / COUNT(*)::numeric) * 100,
    1
  ) as percentage
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE NOT EXISTS (
  -- Only calculate if score doesn't exist yet
  SELECT 1 FROM student_scores ss 
  WHERE ss.student_id = sa.student_id 
    AND ss.round_id = sa.round_id
)
GROUP BY sa.student_id, sa.round_id;

-- Step 2: Verify scores were created
SELECT 
  s.full_name,
  t.team_name,
  r.name as round_name,
  ss.correct_count,
  ss.wrong_count,
  ss.total_questions,
  ss.percentage,
  ss.score
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
JOIN rounds r ON ss.round_id = r.id
ORDER BY t.team_name, s.full_name;

-- Expected output:
-- You should see all students with their calculated scores
-- Example:
-- demo 1 | team A | APTITUDE TEST | 18 | 27 | 45 | 40.0 | 18.0
-- demo 2 | team A | APTITUDE TEST | 22 | 23 | 45 | 48.9 | 22.0
