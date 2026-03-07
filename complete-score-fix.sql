-- Complete fix for all student scores
-- Run this in Supabase SQL Editor

-- Step 1: Fix is_correct field if it's NULL
-- Compare selected_answer with correct_answer
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id
  AND sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  AND sa.is_correct IS NULL;

-- Step 2: Delete existing scores for Round 1
DELETE FROM student_scores
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 3: Recalculate and insert ALL scores
INSERT INTO student_scores (
    student_id,
    round_id,
    score,
    max_score,
    percentage,
    correct_count,
    wrong_count,
    total_questions
)
SELECT 
    sa.student_id,
    sa.round_id,
    -- Score: sum of points for correct answers
    SUM(CASE WHEN sa.is_correct THEN COALESCE(q.points, 1) ELSE 0 END) as score,
    -- Max score: sum of all question points
    SUM(COALESCE(q.points, 1)) as max_score,
    -- Percentage
    ROUND(
        (SUM(CASE WHEN sa.is_correct THEN COALESCE(q.points, 1) ELSE 0 END)::DECIMAL / 
         NULLIF(SUM(COALESCE(q.points, 1)), 0)) * 100, 
        2
    ) as percentage,
    -- Correct count
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_count,
    -- Wrong count
    SUM(CASE WHEN sa.is_correct = false THEN 1 ELSE 0 END) as wrong_count,
    -- Total questions
    COUNT(*) as total_questions
FROM student_answers sa
JOIN questions q ON q.id = sa.question_id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY sa.student_id, sa.round_id
HAVING COUNT(*) > 0;

-- Step 4: Verify the results
SELECT 
    s.full_name,
    t.team_name,
    ss.correct_count,
    ss.wrong_count,
    ss.total_questions,
    ss.score,
    ss.max_score,
    ss.percentage
FROM student_scores ss
JOIN students s ON s.id = ss.student_id
JOIN teams t ON t.id = s.team_id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY t.team_name, s.full_name;

-- Step 5: Check for students with answers but no scores
SELECT 
    s.full_name,
    t.team_name,
    COUNT(sa.id) as answer_count,
    'MISSING SCORE RECORD' as issue
FROM students s
JOIN teams t ON t.id = s.team_id
JOIN student_answers sa ON sa.student_id = s.id
LEFT JOIN student_scores ss ON ss.student_id = s.id 
    AND ss.round_id = sa.round_id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  AND ss.id IS NULL
GROUP BY s.id, s.full_name, t.team_name;

SELECT 'Score calculation complete! Check results above.' as message;
