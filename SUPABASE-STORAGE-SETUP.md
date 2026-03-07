# Supabase Storage Setup for Question Images

## Overview
This guide will help you set up Supabase Storage to enable image uploads for questions in the Admin Question Management panel.

## Step 1: Create Storage Bucket

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

3. **Create the Bucket**
   - Bucket name: `questions` (must be exactly this name)
   - Public bucket: ✅ **Enable** (check the box)
   - Click "Create bucket"

## Step 2: Set Bucket Policies (Public Access)

Since you enabled "Public bucket" during creation, the bucket should already be publicly accessible. To verify:

1. Click on the `questions` bucket
2. Go to "Policies" tab
3. You should see a policy allowing public access

If not, create a policy:
- Click "New Policy"
- Select "For full customization"
- Policy name: `Public Access`
- Allowed operations: SELECT
- Target roles: `public`
- Policy definition:
```sql
true
```

## Step 3: Verify Setup

1. Go to your Admin Question Management page
2. Click "Create Manual" to add a question
3. Try uploading an image
4. If successful, the image should appear in the preview

## Step 4: View Uploaded Images

To see all uploaded images:
1. Go to Supabase Dashboard → Storage → `questions` bucket
2. Open the `question-images` folder
3. All uploaded images will be stored here

## Troubleshooting

### Error: "Bucket not found"
- Make sure the bucket name is exactly `questions` (lowercase, no spaces)
- Refresh your application and try again

### Error: "Permission denied"
- Make sure the bucket is set to Public
- Check that the storage policies allow public SELECT access

### Images not displaying in exam
- Check browser console for errors
- Verify the image URL is correct in the database
- Make sure the image file was uploaded successfully

## Image Guidelines for Admins

When uploading question images:
- **Supported formats**: PNG, JPG, JPEG, SVG
- **Maximum file size**: 2MB
- **Recommended dimensions**: 800x600 pixels or smaller
- **Image type**: Diagrams, charts, graphs, or visual problems
- **Optimization**: Compress images before uploading for faster loading

## Database Schema

The following columns were added to the `questions` table:
- `image_url` (TEXT): Stores the full URL to the uploaded image
- `question_type` (TEXT): Either 'text' or 'image'

These columns were added by running the SQL script: `add-question-image-support.sql`

## How It Works

1. Admin selects an image file in the manual question form
2. Image is validated (type and size)
3. Preview is shown before submission
4. On form submit, image is uploaded to Supabase Storage
5. Public URL is generated and saved to the database
6. Students see the image above the question text during the exam

## Security Notes

- Images are stored in a public bucket (anyone with the URL can view them)
- This is intentional for exam questions
- File size is limited to 2MB to prevent abuse
- Only image file types are accepted
- Each image gets a unique filename to prevent conflicts

## Next Steps

After setting up the storage bucket:
1. Test uploading a question with an image
2. Verify the image displays correctly in the exam
3. Train other admins on how to add images to questions
4. Consider creating a library of reusable question images
