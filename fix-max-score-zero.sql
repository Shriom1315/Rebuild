-- Fix max_score = 0 issue in student_scores
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 
    s.full_name,
    ss.score,
    ss.max_score,
    ss.correct_count,
    ss.total_questions,
    ss.percentage
FROM student_scores ss
JOIN students s ON s.id = ss.student_id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY s.full_name;

-- Step 2: Update max_score based on total_questions
-- Assuming each question is worth 1 point (adjust if different)
UPDATE student_scores
SET 
    max_score = total_questions,
    percentage = CASE 
        WHEN total_questions > 0 THEN ROUND((score::DECIMAL / total_questions) * 100, 2)
        ELSE 0 
    END
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  AND (max_score = 0 OR max_score IS NULL);

-- Step 3: If questions have different point values, recalculate properly
-- This gets the actual max score from the questions table AND populates count fields
UPDATE student_scores ss
SET 
    max_score = (
        SELECT SUM(COALESCE(q.points, 1))
        FROM student_answers sa
        JOIN questions q ON q.id = sa.question_id
        WHERE sa.student_id = ss.student_id 
          AND sa.round_id = ss.round_id
    ),
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
    ),
    percentage = CASE 
        WHEN (
            SELECT SUM(COALESCE(q.points, 1))
            FROM student_answers sa
            JOIN questions q ON q.id = sa.question_id
            WHERE sa.student_id = ss.student_id 
              AND sa.round_id = ss.round_id
        ) > 0 
        THEN ROUND(
            (ss.score::DECIMAL / (
                SELECT SUM(COALESCE(q.points, 1))
                FROM student_answers sa
                JOIN questions q ON q.id = sa.question_id
                WHERE sa.student_id = ss.student_id 
                  AND sa.round_id = ss.round_id
            )) * 100, 
            2
        )
        ELSE 0 
    END
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 4: Verify the fix
SELECT 
    s.full_name,
    ss.score,
    ss.max_score,
    ss.percentage,
    ss.correct_count,
    ss.wrong_count,
    ss.total_questions
FROM student_scores ss
JOIN students s ON s.id = ss.student_id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ss.score DESC;

-- Step 5: Check if any students still have max_score = 0
SELECT COUNT(*) as students_with_zero_max_score
FROM student_scores
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  AND (max_score = 0 OR max_score IS NULL);

SELECT 'Max scores fixed! Students should now see correct scores.' as message;
