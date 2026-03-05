-- ============================================
-- CALCULATE AND FIX ALL SCORES
-- This will calculate scores from student_answers
-- and populate the new columns
-- ============================================

-- Step 1: Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_scores' AND column_name = 'correct_count'
    ) THEN
        ALTER TABLE student_scores ADD COLUMN correct_count INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_scores' AND column_name = 'wrong_count'
    ) THEN
        ALTER TABLE student_scores ADD COLUMN wrong_count INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_scores' AND column_name = 'total_questions'
    ) THEN
        ALTER TABLE student_scores ADD COLUMN total_questions INT DEFAULT 0;
    END IF;
END $$;

-- Step 2: DELETE old scores (we'll recalculate from scratch)
DELETE FROM student_scores WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 3: Calculate scores from student_answers and INSERT
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
  -- Calculate score: sum of points for correct answers
  SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END) as score,
  -- Max score: sum of all question points
  SUM(q.points) as max_score,
  -- Percentage
  ROUND(
    (SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END)::NUMERIC / 
     NULLIF(SUM(q.points), 0) * 100), 
    2
  ) as percentage,
  -- Correct count
  SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::INT as correct_count,
  -- Wrong count
  SUM(CASE WHEN sa.is_correct = false THEN 1 ELSE 0 END)::INT as wrong_count,
  -- Total questions
  COUNT(*)::INT as total_questions,
  'Auto-calculated from answers' as remarks
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY sa.student_id, sa.round_id;

-- Step 4: Add member_count to team_scores
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_scores' AND column_name = 'member_count'
    ) THEN
        ALTER TABLE team_scores ADD COLUMN member_count INT DEFAULT 0;
    END IF;
END $$;

-- Step 5: DELETE old team scores
DELETE FROM team_scores WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 6: Calculate team scores (average of member scores)
INSERT INTO team_scores (team_id, round_id, total_score, average_score, member_count)
SELECT 
  s.team_id,
  ss.round_id,
  ROUND(AVG(ss.score), 2) as total_score,
  ROUND(AVG(ss.score), 2) as average_score,
  COUNT(DISTINCT s.id)::INT as member_count
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.team_id, ss.round_id;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show student scores
SELECT 
  '=== STUDENT SCORES ===' as section,
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

-- Show team scores
SELECT 
  '=== TEAM SCORES ===' as section,
  t.team_name as team,
  ts.member_count as members,
  ts.average_score as avg_score,
  RANK() OVER (ORDER BY ts.average_score DESC) as rank
FROM team_scores ts
JOIN teams t ON ts.team_id = t.id
WHERE ts.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ts.average_score DESC;

-- Count check
SELECT 
  '=== SUMMARY ===' as info,
  (SELECT COUNT(*) FROM student_scores WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)) as student_scores_count,
  (SELECT COUNT(*) FROM team_scores WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)) as team_scores_count,
  (SELECT COUNT(*) FROM student_answers WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)) as submitted_answers_count;

-- Final message
SELECT '✅ SCORES CALCULATED AND SAVED!' as status;
