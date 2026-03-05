# Quick CSV Upload Reference

## For Admins: How to Import HackerRank Scores

### Step 1: Export from HackerRank
Export your test results as CSV with at least these columns:
- Student email or roll number
- Score (0-100)

### Step 2: Format CSV (if needed)
Make sure your CSV looks like this:
```csv
email,score
student1@example.com,85
student2@example.com,92
```

OR with roll numbers:
```csv
roll_number,score
ROLL001,85
ROLL002,92
```

### Step 3: Upload to System
1. Login as admin
2. Go to **Admin Score Management**
3. Select the **Technical Round** from round selector
4. Click **"IMPORT CSV SCORES"** (orange button)
5. Click **"Choose File"** and select your CSV
6. Review the preview (first 10 rows shown)
7. Click **"Upload & Import Scores"**
8. Wait for success message

### Step 4: Verify & Announce
1. Scroll down to see imported scores in team cards
2. Manually edit any scores if needed (click edit icon)
3. Click **"Announce Results"** when ready
4. Students will see scores on their dashboard

## CSV Template
Download: `public/hackerrank_scores_template.csv`

## Common Issues

### "Student not found"
- Check email/roll_number matches database exactly
- Check for extra spaces or typos
- Students not found are skipped (count shown)

### "No matching students found"
- CSV format might be wrong
- Check column order (identifier first, score second)
- Make sure students exist in database

### "Invalid file format"
- Make sure file is .csv (not .xlsx or .txt)
- Use comma as separator (not semicolon or tab)

## Manual Entry Backup
If CSV upload fails, you can enter scores manually:
1. Expand team card
2. Click edit icon next to student name
3. Enter score and max score
4. Click Save

## Need Help?
- Check `CSV-UPLOAD-GUIDE.md` for detailed documentation
- Check `TECHNICAL-ROUND-COMPLETE.md` for implementation details
- Check browser console for error messages
