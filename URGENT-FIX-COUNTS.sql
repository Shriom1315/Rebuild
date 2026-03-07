-- URGENT FIX: Update correct_count, wrong_count, total_questions
-- Run this NOW in Supabase SQL Editor

UPDATE student_scores ss
SET 
    correct_count = (
        SELECT COUNT(*)
        FROM student_answers sa
        WHERE sa.student_id = ss.student_id 
          AND sa.round_id = ss.round_id
          AND sa.is_correct = true
    ),
    wrong_count = (
        SELECT COUNT(*)
        FROM student_answers sa
        WHERE sa.student_id = ss.student_id 
          AND sa.round_id = ss.round_id
          AND sa.is_correct = false
    ),
    total_questions = (
        SELECT COUNT(*)
        FROM student_answers sa
        WHERE sa.student_id = ss.student_id 
          AND sa.round_id = ss.round_id
    )
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Verify the fix
SELECT 
    s.full_name,
    ss.correct_count,
    ss.wrong_count,
    ss.total_questions,
    ss.score,
    ss.percentage
FROM student_scores ss
JOIN students s ON s.id = ss.student_id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY s.full_name;
