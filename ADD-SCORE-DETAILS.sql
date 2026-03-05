-- ============================================
-- ADD DETAILED SCORE COLUMNS
-- Shows correct/wrong answers clearly
-- ============================================

-- Step 1: Add columns to student_scores table
ALTER TABLE student_scores 
ADD COLUMN IF NOT EXISTS correct_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS wrong_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 0;

-- Step 2: Update existing student_scores with correct/wrong counts
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
  );

-- Step 3: Recalculate scores with detailed breakdown
DELETE FROM student_scores 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

INSERT INTO student_scores (
  student_id, 
  round_id, 
  score, 
  max_score, 
  percentage, 
  correct_count,
  wrong_count,
  total_questions,
  remarks
)
SELECT 
  sa.student_id,
  sa.round_id,
  SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END) as score,
  SUM(q.points) as max_score,
  ROUND((SUM(CASE WHEN sa.is_correct THEN q.points ELSE 0 END)::NUMERIC / 
         NULLIF(SUM(q.points), 0) * 100), 2) as percentage,
  SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::INT as correct_count,
  SUM(CASE WHEN sa.is_correct = false THEN 1 ELSE 0 END)::INT as wrong_count,
  COUNT(*)::INT as total_questions,
  'Auto-calculated with details' as remarks
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY sa.student_id, sa.round_id;

-- Step 4: Update team_scores with member count
ALTER TABLE team_scores
ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 0;

DELETE FROM team_scores 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

INSERT INTO team_scores (team_id, round_id, total_score, average_score, member_count)
SELECT 
  s.team_id,
  ss.round_id,
  ROUND(AVG(ss.score), 2) as total_score,
  ROUND(AVG(ss.score), 2) as average_score,
  COUNT(DISTINCT s.id)::INT as member_count
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.team_id, ss.round_id;

-- ============================================
-- RESULTS WITH DETAILED BREAKDOWN
-- ============================================

SELECT 
  '=== DETAILED STUDENT PERFORMANCE ===' as section,
  NULL::TEXT as student,
  NULL::TEXT as team,
  NULL::INT as correct,
  NULL::INT as wrong,
  NULL::INT as total,
  NULL::NUMERIC as score,
  NULL::NUMERIC as percentage
UNION ALL
SELECT 
  '',
  s.full_name,
  t.team_name,
  ss.correct_count,
  ss.wrong_count,
  ss.total_questions,
  ss.score,
  ss.percentage
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY score DESC NULLS LAST;

-- Team rankings with member count
SELECT 
  '=== TEAM RANKINGS (Fair Average) ===' as section,
  NULL::TEXT as rank,
  NULL::TEXT as team,
  NULL::INT as members,
  NULL::NUMERIC as avg_score,
  NULL::NUMERIC as avg_correct
UNION ALL
SELECT 
  '',
  ROW_NUMBER() OVER (ORDER BY ts.average_score DESC)::TEXT,
  t.team_name,
  ts.member_count,
  ts.average_score,
  ROUND(AVG(ss.correct_count), 1) as avg_correct
FROM team_scores ts
JOIN teams t ON ts.team_id = t.id
LEFT JOIN students s ON s.team_id = t.id
LEFT JOIN student_scores ss ON ss.student_id = s.id AND ss.round_id = ts.round_id
WHERE ts.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY t.team_name, ts.average_score, ts.member_count
ORDER BY avg_score DESC NULLS LAST;

-- Summary
SELECT 
  '✓ DETAILED SCORES COMPLETE!' as status,
  'Now showing correct/wrong breakdown for each student' as message;

-- Example output format
SELECT 
  'Example Display:' as note,
  'Student: 18/45 correct (40%), 27 wrong' as format;
