-- ============================================
-- DIAGNOSTIC: Check Score Calculation Status
-- Run this to see what's missing
-- ============================================

-- 1. Check if Round 1 exists
SELECT 
  '1. ROUND CHECK' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Round 1 exists'
    ELSE '✗ Round 1 NOT FOUND - Create it first!'
  END as status,
  id as round_id
FROM rounds 
WHERE round_number = 1
GROUP BY id;

-- 2. Check if questions exist for Round 1
SELECT 
  '2. QUESTIONS CHECK' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ ' || COUNT(*) || ' questions found'
    ELSE '✗ NO QUESTIONS - Add questions first!'
  END as status,
  NULL::UUID as round_id
FROM questions 
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);

-- 3. Check if student answers exist
SELECT 
  '3. ANSWERS CHECK' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ ' || COUNT(*) || ' answers submitted'
    ELSE '✗ NO ANSWERS - Students haven\'t taken exam yet!'
  END as status,
  NULL::UUID as round_id
FROM student_answers 
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);

-- 4. Check if scores have been calculated
SELECT 
  '4. SCORES CHECK' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ ' || COUNT(*) || ' student scores calculated'
    ELSE '✗ NO SCORES - Run FIX-SCORES-NOW.sql!'
  END as status,
  NULL::UUID as round_id
FROM student_scores 
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);

-- 5. Check if team scores exist
SELECT 
  '5. TEAM SCORES CHECK' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ ' || COUNT(*) || ' team scores calculated'
    ELSE '✗ NO TEAM SCORES - Run FIX-SCORES-NOW.sql!'
  END as status,
  NULL::UUID as round_id
FROM team_scores 
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);

-- 6. Check if results are announced
SELECT 
  '6. ANNOUNCEMENT CHECK' as check_name,
  CASE 
    WHEN results_announced THEN '✓ Results announced - Students can see scores'
    ELSE '⚠ Results NOT announced - Students can\'t see scores yet'
  END as status,
  id as round_id
FROM rounds 
WHERE round_number = 1;

-- ============================================
-- DETAILED BREAKDOWN
-- ============================================

-- Show sample answers with correctness
SELECT 
  '=== SAMPLE ANSWERS ===' as section,
  NULL::TEXT as student,
  NULL::TEXT as question,
  NULL::TEXT as selected,
  NULL::TEXT as correct,
  NULL::BOOLEAN as is_correct
UNION ALL
SELECT 
  '',
  s.full_name,
  LEFT(q.question_text, 50) || '...',
  sa.selected_answer,
  q.correct_answer,
  sa.is_correct
FROM student_answers sa
JOIN students s ON sa.student_id = s.id
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id = (SELECT id FROM rounds WHERE round_number = 1)
LIMIT 10;

-- Show score calculation preview
SELECT 
  '=== SCORE PREVIEW ===' as section,
  NULL::TEXT as student,
  NULL::BIGINT as correct_answers,
  NULL::BIGINT as total_questions,
  NULL::NUMERIC as calculated_score
UNION ALL
SELECT 
  '',
  s.full_name,
  SUM(CASE WHEN sa.selected_answer = q.correct_answer THEN 1 ELSE 0 END),
  COUNT(*),
  SUM(CASE WHEN sa.selected_answer = q.correct_answer THEN q.points ELSE 0 END)
FROM student_answers sa
JOIN students s ON sa.student_id = s.id
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id = (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.full_name
ORDER BY calculated_score DESC NULLS LAST
LIMIT 10;

-- ============================================
-- WHAT TO DO NEXT
-- ============================================

SELECT 
  '=== ACTION REQUIRED ===' as message,
  CASE 
    WHEN (SELECT COUNT(*) FROM student_scores WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1)) = 0
    THEN 'RUN: FIX-SCORES-NOW.sql to calculate scores'
    WHEN (SELECT results_announced FROM rounds WHERE round_number = 1) = FALSE
    THEN 'GO TO: /admin/scores and click "Announce Results"'
    ELSE 'ALL DONE! Scores are calculated and announced.'
  END as action;
