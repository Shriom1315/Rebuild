-- ============================================
-- FIX SCORES NOW - ONE CLICK SOLUTION
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================

-- Step 1: Create the scoring functions (if they don't exist)
CREATE OR REPLACE FUNCTION save_aptitude_scores(p_round_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_student RECORD;
BEGIN
  FOR v_student IN 
    SELECT 
      sa.student_id,
      COUNT(*) as total_questions,
      SUM(CASE 
        WHEN sa.selected_answer = q.correct_answer THEN q.points 
        ELSE 0 
      END) as score,
      SUM(q.points) as max_score
    FROM student_answers sa
    JOIN questions q ON sa.question_id = q.id
    WHERE sa.round_id = p_round_id
    GROUP BY sa.student_id
  LOOP
    INSERT INTO student_scores (
      student_id,
      round_id,
      score,
      max_score,
      percentage,
      remarks
    ) VALUES (
      v_student.student_id,
      p_round_id,
      v_student.score,
      v_student.max_score,
      ROUND((v_student.score / NULLIF(v_student.max_score, 0) * 100)::NUMERIC, 2),
      'Auto-calculated from aptitude exam'
    )
    ON CONFLICT (student_id, round_id)
    DO UPDATE SET
      score = EXCLUDED.score,
      max_score = EXCLUDED.max_score,
      percentage = EXCLUDED.percentage;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Calculate team scores
CREATE OR REPLACE FUNCTION calculate_team_scores_for_round(p_round_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_team RECORD;
BEGIN
  FOR v_team IN
    SELECT 
      s.team_id,
      COALESCE(SUM(ss.score), 0) as total_score,
      COALESCE(AVG(ss.score), 0) as average_score
    FROM student_scores ss
    JOIN students s ON ss.student_id = s.id
    WHERE ss.round_id = p_round_id
    GROUP BY s.team_id
  LOOP
    -- Insert or update team_scores
    INSERT INTO team_scores (
      team_id,
      round_id,
      total_score,
      average_score
    ) VALUES (
      v_team.team_id,
      p_round_id,
      v_team.total_score,
      v_team.average_score
    )
    ON CONFLICT (team_id, round_id)
    DO UPDATE SET
      total_score = EXCLUDED.total_score,
      average_score = EXCLUDED.average_score;
    
    -- Update teams table total_score (only if column exists)
    BEGIN
      UPDATE teams
      SET total_score = v_team.total_score
      WHERE id = v_team.team_id;
    EXCEPTION
      WHEN undefined_column THEN
        -- Column doesn't exist, skip this update
        NULL;
    END;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Mark answers as correct/incorrect
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id;

-- Step 4: Calculate scores for Round 1 (Aptitude)
DO $$
DECLARE
  v_round_id UUID;
  v_student_count INT;
  v_team_count INT;
BEGIN
  -- Get Round 1 ID
  SELECT id INTO v_round_id FROM rounds WHERE round_number = 1;
  
  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'Round 1 not found! Please check your rounds table.';
  END IF;

  RAISE NOTICE 'Found Round 1 with ID: %', v_round_id;

  -- Calculate student scores
  SELECT save_aptitude_scores(v_round_id) INTO v_student_count;
  RAISE NOTICE 'Calculated scores for % students', v_student_count;

  -- Calculate team scores
  SELECT calculate_team_scores_for_round(v_round_id) INTO v_team_count;
  RAISE NOTICE 'Calculated scores for % teams', v_team_count;

  RAISE NOTICE '✓ SUCCESS! Scores have been calculated and saved.';
END $$;

-- Step 5: Display the results
SELECT 
  '=== STUDENT SCORES ===' as section,
  NULL::TEXT as team,
  NULL::TEXT as student,
  NULL::NUMERIC as score,
  NULL::NUMERIC as max_score,
  NULL::NUMERIC as percentage
UNION ALL
SELECT 
  '',
  t.team_name,
  s.full_name,
  ss.score,
  ss.max_score,
  ss.percentage
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE ss.round_id = (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY score DESC NULLS LAST;

-- Step 6: Display team totals
SELECT 
  '=== TEAM TOTALS ===' as section,
  NULL::TEXT as team,
  NULL::NUMERIC as total_score,
  NULL::NUMERIC as average_score,
  NULL::INT as members
UNION ALL
SELECT 
  '',
  t.team_name,
  ts.total_score,
  ts.average_score,
  COUNT(s.id)::INT
FROM team_scores ts
JOIN teams t ON ts.team_id = t.id
LEFT JOIN students s ON s.team_id = t.id
WHERE ts.round_id = (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY t.team_name, ts.total_score, ts.average_score
ORDER BY total_score DESC NULLS LAST;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if scores were created
SELECT 
  'student_scores' as table_name,
  COUNT(*) as record_count
FROM student_scores
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1)
UNION ALL
SELECT 
  'team_scores',
  COUNT(*)
FROM team_scores
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);

-- ============================================
-- DONE!
-- ============================================
-- After running this:
-- 1. Go to /admin/scores to view and manage scores
-- 2. Click "Announce Results" to make scores visible to students
-- 3. Students will see their scores on their dashboard
-- ============================================
