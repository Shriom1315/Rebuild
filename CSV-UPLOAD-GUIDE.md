# CSV Score Upload Guide

## Overview
The admin can now import student scores from external assessments (like HackerRank) using CSV file upload.

## Features Implemented

### 1. CSV Upload Button
- Located in Admin Score Management page
- Orange "IMPORT CSV SCORES" button in Actions section
- Shows/hides upload panel when clicked

### 2. CSV Format
The system accepts CSV files with the following format:

```csv
email_or_roll_number, score
student@example.com, 85
ROLL001, 92
student2@example.com, 78
```

**Important:**
- First column: Student email OR roll number
- Second column: Score (0-100)
- Header row is optional (automatically detected and skipped)
- Commas separate the values

### 3. Upload Process

1. **Select Round**: Choose the round you want to import scores for
2. **Click "Import CSV Scores"**: Opens the upload panel
3. **Choose File**: Select your CSV file from HackerRank export
4. **Preview**: System shows first 10 rows for verification
5. **Upload**: Click "Upload & Import Scores" to process

### 4. Smart Matching
- System searches for students by email OR roll number
- Students not found in database are skipped (with count shown)
- Existing scores for the round are replaced with new data

### 5. Progress Feedback
- Shows real-time progress: "Reading CSV...", "Processing rows...", "Mapping students..."
- Success message shows how many scores were imported
- Error messages if something goes wrong

## CSV Template
A template file is available at: `public/hackerrank_scores_template.csv`

## Technical Round Workflow

### For Technical Rounds (HackerRank):
1. Students take test on HackerRank platform
2. Admin exports scores as CSV from HackerRank
3. Admin uploads CSV to system via "Import CSV Scores"
4. System maps students and saves scores to database
5. Admin can manually edit any scores if needed
6. Admin announces results when ready

### Why Technical Round Page Was Removed:
- Technical assessments happen on external platforms (HackerRank)
- Students don't need to access a technical round page in the system
- Prevents confusion - students see "EXTERNAL ASSESSMENT" badge instead
- Scores are imported by admin, not submitted by students

## Student Dashboard Changes

### What Students See:
- **Aptitude Round**: "START SEQUENCE" button (takes exam in system)
- **Technical Round**: "EXTERNAL ASSESSMENT" badge (no button, external platform)
- **Other Rounds**: Appropriate buttons/badges based on round type

### Eliminated Students:
- Individual students eliminated for SEB violations see blocked cards
- Team eliminated students see team elimination banner
- Both are prevented from accessing future rounds

## Manual Score Entry
If CSV upload fails or you need to enter scores manually:
1. Expand team cards in the scores section
2. Click edit icon next to student name
3. Enter score and max score
4. Click Save

## Database Tables Used
- `student_scores`: Stores individual student scores
- `students`: Used to match email/roll_number from CSV
- `rounds`: Round information
- `team_round_status`: Team qualification/elimination status

## Error Handling
- Invalid CSV format: Shows error message
- Students not found: Skipped with count shown
- Duplicate entries: Last entry wins
- Empty file: Shows error message

## Best Practices
1. Always preview CSV before uploading
2. Verify student count matches expected number
3. Check for "not found" count after upload
4. Manually verify a few scores after import
5. Use "Calculate Scores" button for aptitude rounds only
6. Use "Import CSV Scores" for technical/external rounds

## Files Modified
- `src/pages/AdminScoreManagement.js`: Added CSV upload feature
- `src/pages/StudentDashboard.js`: Shows "EXTERNAL ASSESSMENT" for technical rounds
- `src/App.js`: Removed technical round route (commented out)

## Next Steps
1. Test CSV upload with sample data
2. Export real scores from HackerRank
3. Upload and verify scores appear correctly
4. Announce results to students
5. Students will see scores on their dashboard
