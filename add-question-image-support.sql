-- Add image support to questions table
-- Run this in Supabase SQL Editor

-- Step 1: Add image_url column to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 2: Add question_type column to categorize questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'text';

-- Question types can be: 'text', 'image', 'text_with_image'

-- Step 3: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;

-- Step 4: Example - Update a question to include an image
/*
UPDATE questions
SET 
  image_url = 'https://your-storage-url.com/question-images/diagram1.png',
  question_type = 'image'
WHERE id = 'your-question-id';
*/

-- NOTES:
-- 1. Upload images to Supabase Storage or any CDN
-- 2. Use image_url to store the full URL to the image
-- 3. question_type helps the UI know how to display the question
-- 4. Images will be displayed above the question text in the exam
