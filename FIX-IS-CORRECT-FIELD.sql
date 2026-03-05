-- ============================================
-- FIX is_correct Field in student_answers
-- This marks answers as correct/wrong
-- ============================================

-- Step 1: Check current state
SELECT 
  '=== BEFORE FIX ===' as status,
  COUNT(*) as total_answers,
  COUNT(CASE WHEN is_correct = true THEN 1 END) as marked_correct,
  COUNT(CASE WHEN is_correct = false THEN 1 END) as marked_wrong,
  COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as not_marked
FROM student_answers
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 2: Update is_correct field by comparing with correct answer
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id
  AND sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 3: Check after fix
SELECT 
  '=== AFTER FIX ===' as status,
  COUNT(*) as total_answers,
  COUNT(CASE WHEN is_correct = true THEN 1 END) as marked_correct,
  COUNT(CASE WHEN is_correct = false THEN 1 END) as marked_wrong,
  COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as not_marked
FROM student_answers
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 4: Show sample to verify
SELECT 
  '=== SAMPLE VERIFICATION ===' as check_name,
  s.full_name as student,
  q.question_text as question,
  sa.selected_answer as student_answer,
  q.correct_answer as correct_answer,
  sa.is_correct as marked_correct,
  CASE 
    WHEN sa.selected_answer = q.correct_answer THEN '✓ CORRECT'
    ELSE '✗ WRONG'
  END as actual_result
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
JOIN students s ON sa.student_id = s.id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
LIMIT 10;

-- Success message
SELECT '✅ is_correct field updated! Now recalculate scores.' as next_step;
