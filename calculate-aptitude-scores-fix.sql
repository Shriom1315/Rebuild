-- Calculate and fix aptitude scores for all students
-- Run this in Supabase SQL Editor

-- Step 1: Check current student answers and scores
SELECT 
    s.full_name,
    s.roll_number,
    COUNT(sa.id) as total_answers,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers,
    ss.score,
    ss.percentage
FROM students s
LEFT JOIN student_answers sa ON sa.student_id = s.id
LEFT JOIN student_scores ss ON ss.student_id = s.id AND ss.round_id = sa.round_id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.id, s.full_name, s.roll_number, ss.score, ss.percentage
ORDER BY s.full_name;

-- Step 2: Delete existing scores for Round 1 (Aptitude)
DELETE FROM student_scores
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

-- Step 3: Calculate and insert correct scores
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
    -- Calculate score (sum of points for correct answers)
    SUM(CASE WHEN sa.is_correct THEN COALESCE(q.points, 1) ELSE 0 END) as score,
    -- Max score (sum of all question points)
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
  AND sa.submitted = true
GROUP BY sa.student_id, sa.round_id
HAVING COUNT(*) > 0;

-- Step 4: Verify the calculated scores
SELECT 
    s.full_name,
    s.roll_number,
    ss.correct_count,
    ss.wrong_count,
    ss.total_questions,
    ss.score,
    ss.max_score,
    ss.percentage
FROM student_scores ss
JOIN students s ON s.id = ss.student_id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ss.score DESC;

-- Step 5: Update team round status to qualified
UPDATE team_round_status
SET 
    status = 'qualified',
    message = 'Qualified based on aptitude scores'
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  AND team_id IN (
    SELECT DISTINCT t.id 
    FROM teams t
    JOIN students s ON s.team_id = t.id
    JOIN student_scores ss ON ss.student_id = s.id
    WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  );

SELECT 'Aptitude scores calculated successfully!' as message;
