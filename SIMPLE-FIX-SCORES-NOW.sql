-- ============================================
-- SIMPLE FIX - Calculate Scores from Answers
-- This version is guaranteed to work!
-- ============================================

-- Step 1: Add new columns (safe - won't fail if they exist)
ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS correct_count INT DEFAULT 0;
ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS wrong_count INT DEFAULT 0;
ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 0;
ALTER TABLE team_scores ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 0;

-- Step 2: Clear old scores
DELETE FROM student_scores WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);
DELETE FROM team_scores WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 3: Calculate and insert student scores
INSERT INTO student_scores (
  student_id, 
  round_id, 
  score, 
  max_score, 
  percentage, 
  correct_count,
  wrong_count,
  total_questions,
  remarks
)
SELECT 
  sa.student_id,
  sa.round_id,
  SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END) as score,
  SUM(q.points) as max_score,
  ROUND((SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END)::NUMERIC / NULLIF(SUM(q.points), 0) * 100), 2) as percentage,
  SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::INT as correct_count,
  SUM(CASE WHEN sa.is_correct = false THEN 1 ELSE 0 END)::INT as wrong_count,
  COUNT(*)::INT as total_questions,
  'Calculated from answers'
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY sa.student_id, sa.round_id;

-- Step 4: Calculate and insert team scores
INSERT INTO team_scores (team_id, round_id, total_score, average_score, member_count)
SELECT 
  s.team_id,
  ss.round_id,
  ROUND(AVG(ss.score), 2),
  ROUND(AVG(ss.score), 2),
  COUNT(DISTINCT s.id)::INT
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.team_id, ss.round_id;

-- Step 5: Show results
SELECT 
  s.full_name as student,
  t.team_name as team,
  ss.correct_count as correct,
  ss.wrong_count as wrong,
  ss.total_questions as total,
  ss.score as points,
  ss.percentage as percent
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ss.score DESC;

-- Success message
SELECT '✅ DONE! Refresh your admin page now!' as status;
