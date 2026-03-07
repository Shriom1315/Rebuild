# Aptitude Exam - Randomization & Image Support

## Features Implemented

### 1. Question Randomization
Each student gets questions in a **different random order** to prevent cheating.

**How it works:**
- Questions are shuffled using the student's ID as a seed
- Same student always gets the same order (consistent across page refreshes)
- Different students get different orders
- Uses a seeded random algorithm for fair distribution

**Benefits:**
- Prevents students from sharing answers by question number
- Each student has unique exam experience
- Fair for all students (everyone gets same questions, just different order)

### 2. Image Support for Questions
Questions can now include images (diagrams, charts, graphs, etc.)

**Supported question types:**
- Text only (traditional questions)
- Image with text (diagram + question)
- Image only (visual reasoning questions)

**How images are displayed:**
- Image appears above the question text
- Centered and responsive
- Max height: 300px to fit on screen
- Rounded corners with border for professional look
- Graceful error handling if image fails to load

## Database Changes

### New Columns in `questions` table:
1. **image_url** (TEXT) - URL to the question image
2. **question_type** (TEXT) - Type of question: 'text', 'image', 'text_with_image'

### Setup Instructions:

**Step 1: Run the SQL script**
```sql
-- In Supabase SQL Editor
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'text';
```

**Step 2: Upload images**
- Use Supabase Storage or any CDN (Cloudinary, AWS S3, etc.)
- Get the public URL for each image
- Recommended image formats: PNG, JPG, SVG
- Recommended size: Max 1MB, optimized for web

**Step 3: Add images to questions**
```sql
UPDATE questions
SET 
  image_url = 'https://your-cdn.com/images/diagram1.png',
  question_type = 'image'
WHERE id = 'question-id-here';
```

## Example Questions with Images

### Quantitative Question with Diagram
```sql
INSERT INTO questions (
  round_id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer,
  points,
  question_order,
  image_url,
  question_type
) VALUES (
  'round-1-id',
  'What is the area of the shaded region in the diagram?',
  '25 sq units',
  '30 sq units',
  '35 sq units',
  '40 sq units',
  'c',
  1,
  15,
  'https://your-cdn.com/geometry-diagram.png',
  'image'
);
```

### Logical Reasoning with Pattern
```sql
INSERT INTO questions (
  round_id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer,
  points,
  question_order,
  image_url,
  question_type
) VALUES (
  'round-1-id',
  'Which figure completes the pattern?',
  'Figure A',
  'Figure B',
  'Figure C',
  'Figure D',
  'b',
  1,
  20,
  'https://your-cdn.com/pattern-sequence.png',
  'image'
);
```

## Image Hosting Options

### Option 1: Supabase Storage (Recommended)
1. Go to Supabase Dashboard → Storage
2. Create a bucket called "question-images"
3. Make it public
4. Upload images
5. Copy public URL

### Option 2: Cloudinary (Free tier available)
1. Sign up at cloudinary.com
2. Upload images
3. Get public URLs
4. Use in questions

### Option 3: ImgBB (Simple & Free)
1. Go to imgbb.com
2. Upload image
3. Copy direct link
4. Use in questions

## Best Practices

### Image Guidelines:
- **Resolution**: 800x600px or similar (not too large)
- **File size**: Under 500KB (optimize for fast loading)
- **Format**: PNG for diagrams, JPG for photos
- **Clarity**: High contrast, clear text if any
- **Accessibility**: Ensure diagrams are clear and readable

### Question Design:
- Keep question text concise when using images
- Ensure image adds value (not decorative)
- Test on mobile devices
- Provide alt text context in question_text

## Testing

### Test Randomization:
1. Create 2 test student accounts
2. Log in as Student 1, note question order
3. Log in as Student 2, verify different order
4. Log out and back in as Student 1, verify same order

### Test Images:
1. Add image_url to a question
2. Start exam as student
3. Verify image displays correctly
4. Test on mobile device
5. Test with invalid URL (should hide gracefully)

## Troubleshooting

### Images not showing:
- Check image URL is publicly accessible
- Verify CORS settings if using external CDN
- Check browser console for errors
- Ensure image_url column exists in database

### Same question order for all students:
- Clear browser cache
- Verify randomization code is deployed
- Check that student IDs are unique

### Questions in wrong order after refresh:
- This is expected! Same student = same order
- Randomization is seeded by student ID for consistency

## Future Enhancements

Possible additions:
- Multiple images per question
- Image zoom functionality
- Audio support for listening questions
- Video support for comprehension questions
- LaTeX support for mathematical equations
