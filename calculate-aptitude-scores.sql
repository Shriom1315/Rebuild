-- ============================================
-- AUTO-CALCULATE APTITUDE SCORES
-- Run this after students complete the aptitude exam
-- ============================================

-- Function to calculate and save aptitude scores for all students
CREATE OR REPLACE FUNCTION calculate_aptitude_scores_for_round(p_round_id UUID)
RETURNS TABLE(
  student_id UUID,
  student_name TEXT,
  correct_answers INT,
  total_questions INT,
  score NUMERIC,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH student_results AS (
    SELECT 
      sa.student_id,
      s.full_name as student_name,
      COUNT(*) as total_answered,
      SUM(CASE 
        WHEN sa.selected_answer = q.correct_answer THEN 1 
        ELSE 0 
      END) as correct_count,
      SUM(CASE 
        WHEN sa.selected_answer = q.correct_answer THEN q.points 
        ELSE 0 
      END) as total_score,
      SUM(q.points) as max_possible_score
    FROM student_answers sa
    JOIN questions q ON sa.question_id = q.id
    JOIN students s ON sa.student_id = s.id
    WHERE sa.round_id = p_round_id
    GROUP BY sa.student_id, s.full_name
  )
  SELECT 
    sr.student_id,
    sr.student_name,
    sr.correct_count::INT,
    sr.total_answered::INT,
    sr.total_score,
    ROUND((sr.total_score / NULLIF(sr.max_possible_score, 0) * 100)::NUMERIC, 2) as percentage
  FROM student_results sr;
END;
$$ LANGUAGE plpgsql;

-- Function to save calculated scores to student_scores table
CREATE OR REPLACE FUNCTION save_aptitude_scores(p_round_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_student RECORD;
BEGIN
  -- Calculate scores for each student
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
    -- Insert or update student score
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
      percentage = EXCLUDED.percentage,
      remarks = EXCLUDED.remarks;
    
    v_count := v_count + 1;
  END LOOP;

  -- Update team scores for all teams in this round
  PERFORM calculate_team_scores_for_round(p_round_id);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate team scores for a round
CREATE OR REPLACE FUNCTION calculate_team_scores_for_round(p_round_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_team RECORD;
BEGIN
  FOR v_team IN
    SELECT 
      s.team_id,
      SUM(ss.score) as total_score,
      AVG(ss.score) as average_score,
      COUNT(*) as member_count
    FROM student_scores ss
    JOIN students s ON ss.student_id = s.id
    WHERE ss.round_id = p_round_id
    GROUP BY s.team_id
  LOOP
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
    
    -- Also update the team's total_score field
    UPDATE teams
    SET total_score = v_team.total_score
    WHERE id = v_team.team_id;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

-- 1. First, get the Round 1 (Aptitude) ID:
-- SELECT id, name FROM rounds WHERE round_number = 1;

-- 2. View calculated scores (without saving):
-- SELECT * FROM calculate_aptitude_scores_for_round('YOUR-ROUND-ID-HERE');

-- 3. Save scores to database:
-- SELECT save_aptitude_scores('YOUR-ROUND-ID-HERE');

-- 4. Verify scores were saved:
-- SELECT 
--   s.full_name,
--   ss.score,
--   ss.max_score,
--   ss.percentage
-- FROM student_scores ss
-- JOIN students s ON ss.student_id = s.id
-- WHERE ss.round_id = 'YOUR-ROUND-ID-HERE'
-- ORDER BY ss.score DESC;

-- 5. View team scores:
-- SELECT 
--   t.team_name,
--   ts.total_score,
--   ts.average_score
-- FROM team_scores ts
-- JOIN teams t ON ts.team_id = t.id
-- WHERE ts.round_id = 'YOUR-ROUND-ID-HERE'
-- ORDER BY ts.total_score DESC;

-- ============================================
-- QUICK RUN (Replace with your actual round ID)
-- ============================================

-- Get Round 1 ID and save scores in one go:
DO $$
DECLARE
  v_round_id UUID;
  v_count INT;
BEGIN
  -- Get Round 1 (Aptitude) ID
  SELECT id INTO v_round_id FROM rounds WHERE round_number = 1;
  
  IF v_round_id IS NULL THEN
    RAISE NOTICE 'Round 1 not found!';
  ELSE
    -- Calculate and save scores
    SELECT save_aptitude_scores(v_round_id) INTO v_count;
    RAISE NOTICE 'Saved scores for % students in Round 1', v_count;
  END IF;
END $$;

-- View results
SELECT 
  s.full_name as student,
  t.team_name as team,
  ss.score,
  ss.max_score,
  ss.percentage
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE ss.round_id = (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ss.score DESC;
