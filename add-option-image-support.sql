-- Add image support to question options
-- Run this in Supabase SQL Editor

-- Step 1: Add image_url columns for each option
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS option_a_image TEXT,
ADD COLUMN IF NOT EXISTS option_b_image TEXT,
ADD COLUMN IF NOT EXISTS option_c_image TEXT,
ADD COLUMN IF NOT EXISTS option_d_image TEXT;

-- Step 2: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
  AND column_name LIKE '%image%'
ORDER BY ordinal_position;

-- NOTES:
-- 1. Each option can now have an optional image
-- 2. If option has an image, it will display instead of or alongside text
-- 3. This is useful for visual pattern questions, diagram-based MCQs, etc.
-- 4. Images will be uploaded to the same Supabase Storage bucket: 'questions'

-- Example usage:
/*
UPDATE questions
SET 
  option_a_image = 'https://your-storage-url.com/question-images/option-a-1.png',
  option_b_image = 'https://your-storage-url.com/question-images/option-b-1.png'
WHERE id = 'your-question-id';
*/
