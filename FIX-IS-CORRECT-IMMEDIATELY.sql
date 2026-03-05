-- FIX IS_CORRECT FIELD IMMEDIATELY
-- Run this in Supabase SQL Editor to fix all wrong scores

-- Step 1: Update is_correct field by comparing answers
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id;

-- Step 2: Verify the fix
SELECT 
  COUNT(*) as total_answers,
  COUNT(CASE WHEN is_correct THEN 1 END) as correct_answers,
  COUNT(CASE WHEN NOT is_correct THEN 1 END) as wrong_answers
FROM student_answers;

-- Expected output: You should see some correct answers now
-- Example:
-- total_answers | correct_answers | wrong_answers
-- 176           | 72              | 104

-- Step 3: Now recalculate scores in admin panel
-- Go to http://localhost:3000/admin/scores
-- Click "CALCULATE SCORES" button
