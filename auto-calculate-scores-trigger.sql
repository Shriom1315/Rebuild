-- ============================================
-- AUTO-CALCULATE SCORES TRIGGER
-- Automatically calculates scores when student submits answers
-- ============================================

-- Function to auto-calculate score when answers are submitted
CREATE OR REPLACE FUNCTION auto_calculate_student_score()
RETURNS TRIGGER AS $$
DECLARE
  v_score NUMERIC;
  v_max_score NUMERIC;
  v_percentage NUMERIC;
  v_total_questions INT;
BEGIN
  -- Calculate the student's score for this round
  SELECT 
    SUM(CASE 
      WHEN sa.selected_answer = q.correct_answer THEN q.points 
      ELSE 0 
    END),
    SUM(q.points),
    COUNT(*)
  INTO v_score, v_max_score, v_total_questions
  FROM student_answers sa
  JOIN questions q ON sa.question_id = q.id
  WHERE sa.student_id = NEW.student_id
    AND sa.round_id = NEW.round_id;

  -- Calculate percentage
  v_percentage := ROUND((v_score / NULLIF(v_max_score, 0) * 100)::NUMERIC, 2);

  -- Insert or update student_scores
  INSERT INTO student_scores (
    student_id,
    round_id,
    score,
    max_score,
    percentage,
    remarks
  ) VALUES (
    NEW.student_id,
    NEW.round_id,
    v_score,
    v_max_score,
    v_percentage,
    'Auto-calculated from exam submission'
  )
  ON CONFLICT (student_id, round_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    max_score = EXCLUDED.max_score,
    percentage = EXCLUDED.percentage,
    remarks = EXCLUDED.remarks;

  -- Update team score
  PERFORM update_team_score_for_student(NEW.student_id, NEW.round_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update team score when a student's score changes
CREATE OR REPLACE FUNCTION update_team_score_for_student(p_student_id UUID, p_round_id UUID)
RETURNS VOID AS $$
DECLARE
  v_team_id UUID;
  v_total_score NUMERIC;
  v_average_score NUMERIC;
BEGIN
  -- Get the student's team
  SELECT team_id INTO v_team_id FROM students WHERE id = p_student_id;

  IF v_team_id IS NULL THEN
    RETURN;
  END IF;

  -- Calculate team totals
  SELECT 
    SUM(ss.score),
    AVG(ss.score)
  INTO v_total_score, v_average_score
  FROM student_scores ss
  JOIN students s ON ss.student_id = s.id
  WHERE s.team_id = v_team_id
    AND ss.round_id = p_round_id;

  -- Update team_scores
  INSERT INTO team_scores (
    team_id,
    round_id,
    total_score,
    average_score
  ) VALUES (
    v_team_id,
    p_round_id,
    COALESCE(v_total_score, 0),
    COALESCE(v_average_score, 0)
  )
  ON CONFLICT (team_id, round_id)
  DO UPDATE SET
    total_score = EXCLUDED.total_score,
    average_score = EXCLUDED.average_score;

  -- Update team's overall total_score
  UPDATE teams
  SET total_score = COALESCE(v_total_score, 0)
  WHERE id = v_team_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on student_answers
DROP TRIGGER IF EXISTS trigger_auto_calculate_score ON student_answers;
CREATE TRIGGER trigger_auto_calculate_score
  AFTER INSERT OR UPDATE ON student_answers
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_student_score();

-- ============================================
-- MARK ANSWERS AS CORRECT/INCORRECT
-- ============================================

-- Function to mark all answers as correct/incorrect
CREATE OR REPLACE FUNCTION mark_answers_correctness()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
BEGIN
  UPDATE student_answers sa
  SET is_correct = (sa.selected_answer = q.correct_answer)
  FROM questions q
  WHERE sa.question_id = q.id;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE
-- ============================================

-- 1. Mark all existing answers as correct/incorrect:
-- SELECT mark_answers_correctness();

-- 2. Recalculate all scores for Round 1:
-- SELECT save_aptitude_scores((SELECT id FROM rounds WHERE round_number = 1));

-- 3. The trigger will automatically calculate scores for new submissions

-- ============================================
-- RUN THIS TO FIX EXISTING DATA
-- ============================================

DO $$
DECLARE
  v_round_id UUID;
  v_marked INT;
  v_scored INT;
BEGIN
  -- Get Round 1 ID
  SELECT id INTO v_round_id FROM rounds WHERE round_number = 1;
  
  IF v_round_id IS NULL THEN
    RAISE NOTICE 'Round 1 not found!';
    RETURN;
  END IF;

  -- Mark answers as correct/incorrect
  SELECT mark_answers_correctness() INTO v_marked;
  RAISE NOTICE 'Marked % answers as correct/incorrect', v_marked;

  -- Calculate and save scores
  SELECT save_aptitude_scores(v_round_id) INTO v_scored;
  RAISE NOTICE 'Calculated scores for % students', v_scored;

  -- Show results
  RAISE NOTICE 'Done! Check student_scores and team_scores tables.';
END $$;

-- Verify the results
SELECT 
  t.team_name,
  s.full_name as student,
  ss.score,
  ss.max_score,
  ss.percentage,
  COUNT(sa.id) as answers_submitted,
  SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
LEFT JOIN student_answers sa ON sa.student_id = s.id AND sa.round_id = ss.round_id
WHERE ss.round_id = (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY t.team_name, s.full_name, ss.score, ss.max_score, ss.percentage
ORDER BY ss.score DESC;
