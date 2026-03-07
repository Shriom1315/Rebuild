# Admin Guide: Adding Images to Questions

## Quick Start Guide for Admins

### Step 1: Access Question Management
1. Log in to Admin Panel
2. Navigate to "Questions" in the sidebar
3. Select the round you want to add questions to
4. Click "CREATE MANUAL" button

### Step 2: Upload Image (Optional)
1. In the question form, you'll see "Question Image (Optional)" section
2. Click on the upload area or drag an image file
3. Supported formats: PNG, JPG, JPEG, SVG
4. Maximum size: 2MB

### Step 3: Preview and Edit
- After selecting an image, a preview will appear
- To remove the image, click the X button in the top-right corner
- You can replace the image by clicking "Remove" and uploading a new one

### Step 4: Fill Question Details
1. Enter the question text (required)
2. Fill in all four options (A, B, C, D)
3. Select the correct answer
4. Set the points value
5. Click "COMMIT_PROTOCOL" to save

### Step 5: Verify
- The question will appear in the questions list
- Students will see the image above the question text during the exam

## What Students See

When a student takes the exam:
1. Image appears at the top (centered)
2. Question text appears below the image
3. Four options appear in a 2x2 grid below the question
4. Image is responsive and fits the screen

## Image Guidelines

### ✅ Good Images:
- Clear diagrams and charts
- High contrast for readability
- Appropriate size (800x600 or smaller)
- Compressed for fast loading
- Relevant to the question

### ❌ Avoid:
- Blurry or low-quality images
- Images with tiny text
- Very large file sizes (>2MB)
- Copyrighted content without permission
- Images with sensitive information

## Example Use Cases

### Quantitative Aptitude:
- Geometric shapes and diagrams
- Number patterns and sequences
- Data interpretation charts
- Venn diagrams
- Graphs and plots

### Logical Reasoning:
- Visual patterns
- Spatial reasoning diagrams
- Flowcharts
- Puzzle images
- Sequence completion

### Data Interpretation:
- Bar charts
- Pie charts
- Line graphs
- Tables
- Infographics

## Tips for Best Results

1. **Optimize Before Upload**
   - Use tools like TinyPNG or Squoosh
   - Resize to 800x600 pixels or smaller
   - Keep file size under 1MB

2. **Test Readability**
   - View on mobile device
   - Check text is readable
   - Ensure colors have good contrast

3. **Organize Your Images**
   - Name files descriptively before upload
   - Keep a backup of original images
   - Document which questions use which images

4. **Quality Check**
   - Preview the question after creation
   - Test in student exam view
   - Verify image loads quickly

## Troubleshooting

### Image Won't Upload
- Check file size (must be under 2MB)
- Verify file type (PNG, JPG, JPEG, SVG only)
- Try a different browser
- Check internet connection

### Image Not Showing in Exam
- Verify the question was saved successfully
- Check if Supabase Storage is configured
- Refresh the exam page
- Check browser console for errors

### Image Too Large/Small
- Resize the image before uploading
- Use image editing software
- Compress the file
- Try a different image format

## Best Practices

1. **Consistency**: Use similar image styles for all questions
2. **Clarity**: Ensure images are clear and easy to understand
3. **Relevance**: Only add images when they add value
4. **Testing**: Always test questions with images before the exam
5. **Backup**: Keep original image files for future use

## Quick Reference

| Action | How To |
|--------|--------|
| Add Image | Click upload area in question form |
| Remove Image | Click X button on preview |
| Replace Image | Remove current, then upload new |
| Preview Question | Save and view in questions list |
| Test in Exam | Use student account to take exam |

## Need Help?

If you encounter issues:
1. Check `SUPABASE-STORAGE-SETUP.md` for setup instructions
2. Verify the storage bucket is configured correctly
3. Contact technical support with error details
4. Check browser console for error messages

---

**Remember**: Images enhance questions but aren't required. Use them when they add value to the question!
