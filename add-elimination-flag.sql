-- Add is_eliminated flag to student_answers table
-- This allows tracking which students were eliminated during the exam

ALTER TABLE student_answers 
ADD COLUMN IF NOT EXISTS is_eliminated BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN student_answers.is_eliminated IS 'Indicates if the student was eliminated due to SEB violations during this exam';

-- Create an index for faster queries filtering by elimination status
CREATE INDEX IF NOT EXISTS idx_student_answers_eliminated 
ON student_answers(is_eliminated) 
WHERE is_eliminated = TRUE;
