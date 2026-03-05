-- ============================================
-- SIMPLE SCORE FIX - NO FUNCTIONS NEEDED
-- Just direct SQL queries
-- ============================================

-- Step 1: Mark all answers as correct/incorrect
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id;

-- Step 2: Insert student scores (delete old ones first to avoid conflicts)
DELETE FROM student_scores 
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);

-- Step 3: Calculate and insert student scores
INSERT INTO student_scores (student_id, round_id, score, max_score, percentage, remarks)
SELECT 
  sa.student_id,
  sa.round_id,
  SUM(CASE WHEN sa.selected_answer = q.correct_answer THEN q.points ELSE 0 END) as score,
  SUM(q.points) as max_score,
  ROUND((SUM(CASE WHEN sa.selected_answer = q.correct_answer THEN q.points ELSE 0 END)::NUMERIC / 
         NULLIF(SUM(q.points), 0) * 100), 2) as percentage,
  'Auto-calculated from exam' as remarks
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id = (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY sa.student_id, sa.round_id;

-- Step 4: Delete old team scores
DELETE FROM team_scores 
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);

-- Step 5: Calculate and insert team scores
INSERT INTO team_scores (team_id, round_id, total_score, average_score)
SELECT 
  s.team_id,
  ss.round_id,
  SUM(ss.score) as total_score,
  AVG(ss.score) as average_score
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id = (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.team_id, ss.round_id;

-- Step 6: Update teams total_score (if column exists)
UPDATE teams t
SET total_score = ts.total_score
FROM team_scores ts
WHERE t.id = ts.team_id
  AND ts.round_id = (SELECT id FROM rounds WHERE round_number = 1);

-- ============================================
-- VIEW RESULTS
-- ============================================

-- Student scores
SELECT 
  t.team_name,
  s.full_name as student,
  ss.score,
  ss.max_score,
  ss.percentage
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE ss.round_id = (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ss.score DESC;

-- Team totals
SELECT 
  t.team_name,
  ts.total_score,
  ts.average_score,
  COUNT(s.id) as members
FROM team_scores ts
JOIN teams t ON ts.team_id = t.id
LEFT JOIN students s ON s.team_id = t.id
WHERE ts.round_id = (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY t.team_name, ts.total_score, ts.average_score
ORDER BY ts.total_score DESC;

-- Summary
SELECT 
  'Total students scored' as metric,
  COUNT(*)::TEXT as value
FROM student_scores
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1)
UNION ALL
SELECT 
  'Total teams scored',
  COUNT(*)::TEXT
FROM team_scores
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1)
UNION ALL
SELECT 
  'Highest score',
  MAX(score)::TEXT
FROM student_scores
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1)
UNION ALL
SELECT 
  'Average score',
  ROUND(AVG(score), 2)::TEXT
FROM student_scores
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);
