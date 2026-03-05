-- ============================================
-- DIAGNOSTIC: Check What's Wrong
-- Run this to see what data exists
-- ============================================

-- Check 1: Do we have student answers?
SELECT 
  '=== CHECK 1: Student Answers ===' as check_name,
  COUNT(*) as total_answers,
  COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers,
  COUNT(CASE WHEN is_correct = false THEN 1 END) as wrong_answers
FROM student_answers
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Check 2: Sample student answers
SELECT 
  '=== CHECK 2: Sample Answers ===' as check_name,
  s.full_name,
  COUNT(*) as answers_count,
  COUNT(CASE WHEN sa.is_correct THEN 1 END) as correct,
  COUNT(CASE WHEN sa.is_correct = false THEN 1 END) as wrong
FROM student_answers sa
JOIN students s ON sa.student_id = s.id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.full_name
LIMIT 5;

-- Check 3: Do we have questions with points?
SELECT 
  '=== CHECK 3: Questions ===' as check_name,
  COUNT(*) as total_questions,
  SUM(points) as total_points,
  MIN(points) as min_points,
  MAX(points) as max_points
FROM questions
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Check 4: Current student_scores table
SELECT 
  '=== CHECK 4: Current Student Scores ===' as check_name,
  COUNT(*) as scores_count,
  SUM(score) as total_score,
  AVG(score) as avg_score
FROM student_scores
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Check 5: Do new columns exist?
SELECT 
  '=== CHECK 5: Column Check ===' as check_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'student_scores'
  AND column_name IN ('correct_count', 'wrong_count', 'total_questions', 'score', 'percentage')
ORDER BY column_name;

-- Check 6: Sample of current scores
SELECT 
  '=== CHECK 6: Sample Current Scores ===' as check_name,
  s.full_name,
  ss.score,
  ss.max_score,
  ss.percentage,
  ss.correct_count,
  ss.wrong_count,
  ss.total_questions
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
LIMIT 5;

-- Check 7: Are answers marked as correct/wrong?
SELECT 
  '=== CHECK 7: Answer Correctness ===' as check_name,
  sa.selected_answer,
  q.correct_answer,
  sa.is_correct,
  CASE 
    WHEN sa.selected_answer = q.correct_answer THEN 'Should be TRUE'
    ELSE 'Should be FALSE'
  END as expected_is_correct
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
LIMIT 10;

-- Check 8: Team scores
SELECT 
  '=== CHECK 8: Team Scores ===' as check_name,
  t.team_name,
  ts.total_score,
  ts.average_score,
  ts.member_count
FROM team_scores ts
JOIN teams t ON ts.team_id = t.id
WHERE ts.round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- SUMMARY
SELECT 
  '=== SUMMARY ===' as info,
  'If student_answers has data but student_scores is empty or has 0 values,' as diagnosis,
  'then you need to run CALCULATE-AND-FIX-SCORES.sql' as solution;
