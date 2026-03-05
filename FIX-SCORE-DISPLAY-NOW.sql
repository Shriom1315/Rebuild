-- ============================================
-- FIX SCORE DISPLAY - Add Missing Columns
-- Run this in Supabase SQL Editor NOW
-- ============================================

-- Step 1: Check if columns exist
DO $$ 
BEGIN
    -- Add correct_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_scores' AND column_name = 'correct_count'
    ) THEN
        ALTER TABLE student_scores ADD COLUMN correct_count INT DEFAULT 0;
        RAISE NOTICE 'Added correct_count column';
    ELSE
        RAISE NOTICE 'correct_count column already exists';
    END IF;

    -- Add wrong_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_scores' AND column_name = 'wrong_count'
    ) THEN
        ALTER TABLE student_scores ADD COLUMN wrong_count INT DEFAULT 0;
        RAISE NOTICE 'Added wrong_count column';
    ELSE
        RAISE NOTICE 'wrong_count column already exists';
    END IF;

    -- Add total_questions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_scores' AND column_name = 'total_questions'
    ) THEN
        ALTER TABLE student_scores ADD COLUMN total_questions INT DEFAULT 0;
        RAISE NOTICE 'Added total_questions column';
    ELSE
        RAISE NOTICE 'total_questions column already exists';
    END IF;
END $$;

-- Step 2: Update existing scores with correct/wrong counts
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
WHERE ss.id IN (
  SELECT id FROM student_scores WHERE correct_count IS NULL OR correct_count = 0
);

-- Step 3: Add member_count to team_scores if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_scores' AND column_name = 'member_count'
    ) THEN
        ALTER TABLE team_scores ADD COLUMN member_count INT DEFAULT 0;
        RAISE NOTICE 'Added member_count column to team_scores';
    ELSE
        RAISE NOTICE 'member_count column already exists in team_scores';
    END IF;
END $$;

-- Step 4: Update team_scores with member counts
UPDATE team_scores ts
SET member_count = (
  SELECT COUNT(DISTINCT s.id)
  FROM students s
  JOIN student_scores ss ON ss.student_id = s.id
  WHERE s.team_id = ts.team_id 
    AND ss.round_id = ts.round_id
)
WHERE ts.member_count IS NULL OR ts.member_count = 0;

-- ============================================
-- VERIFICATION - Check the results
-- ============================================

SELECT 
  '=== STUDENT SCORES WITH DETAILS ===' as section,
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
ORDER BY score DESC NULLS LAST
LIMIT 10;

-- Check if columns were added successfully
SELECT 
  '=== COLUMN CHECK ===' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_scores' AND column_name = 'correct_count'
    ) THEN '✓ correct_count exists'
    ELSE '✗ correct_count missing'
  END as correct_count_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_scores' AND column_name = 'wrong_count'
    ) THEN '✓ wrong_count exists'
    ELSE '✗ wrong_count missing'
  END as wrong_count_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_scores' AND column_name = 'total_questions'
    ) THEN '✓ total_questions exists'
    ELSE '✗ total_questions missing'
  END as total_questions_status;

-- Summary
SELECT 
  '✅ COLUMNS ADDED AND SCORES UPDATED!' as status,
  'Refresh your admin page to see the scores' as next_step;
