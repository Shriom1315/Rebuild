-- Diagnose why some students show 0/0 correct
-- Run this in Supabase SQL Editor

-- Step 1: Check which students have answers
SELECT 
    s.full_name,
    s.roll_number,
    t.team_name,
    COUNT(sa.id) as total_answers,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers,
    SUM(CASE WHEN sa.is_correct = false THEN 1 ELSE 0 END) as wrong_answers,
    SUM(CASE WHEN sa.is_correct IS NULL THEN 1 ELSE 0 END) as null_answers
FROM students s
LEFT JOIN teams t ON t.id = s.team_id
LEFT JOIN student_answers sa ON sa.student_id = s.id 
    AND sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.id, s.full_name, s.roll_number, t.team_name
ORDER BY t.team_name, s.full_name;

-- Step 2: Check student_scores table
SELECT 
    s.full_name,
    t.team_name,
    ss.correct_count,
    ss.wrong_count,
    ss.total_questions,
    ss.score,
    ss.max_score,
    ss.percentage
FROM students s
LEFT JOIN teams t ON t.id = s.team_id
LEFT JOIN student_scores ss ON ss.student_id = s.id 
    AND ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY t.team_name, s.full_name;

-- Step 3: Find students with answers but no scores
SELECT 
    s.full_name,
    s.roll_number,
    t.team_name,
    COUNT(sa.id) as has_answers,
    CASE WHEN ss.id IS NULL THEN 'NO SCORE RECORD' ELSE 'HAS SCORE RECORD' END as score_status
FROM students s
JOIN teams t ON t.id = s.team_id
LEFT JOIN student_answers sa ON sa.student_id = s.id 
    AND sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
LEFT JOIN student_scores ss ON ss.student_id = s.id 
    AND ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.id, s.full_name, s.roll_number, t.team_name, ss.id
HAVING COUNT(sa.id) > 0
ORDER BY t.team_name, s.full_name;

-- Step 4: Check if is_correct field is set properly
SELECT 
    s.full_name,
    sa.question_id,
    sa.selected_answer,
    q.correct_answer,
    sa.is_correct,
    CASE 
        WHEN sa.is_correct IS NULL THEN 'NULL - NEEDS FIX'
        WHEN sa.is_correct = true THEN 'CORRECT'
        ELSE 'WRONG'
    END as status
FROM student_answers sa
JOIN students s ON s.id = sa.student_id
JOIN questions q ON q.id = sa.question_id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  AND s.full_name IN ('Maithili Malage', 'Tanvi kamlagle', 'sanskriti lalage', 'Trupti chavan')
ORDER BY s.full_name, sa.question_id
LIMIT 50;
