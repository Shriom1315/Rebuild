# Quick Judge CSV Upload Guide

## For GD Judge

### Step 1: Format Your CSV
Create a CSV with 3 teams combined:
```csv
team_name,student_email,score
Team Alpha,student1@example.com,35
Team Alpha,student2@example.com,38
Team Beta,ROLL001,36
Team Beta,ROLL002,34
Team Gamma,student3@example.com,33
```

### Step 2: Upload
1. Login as GD judge
2. Click **"Upload CSV Scores"** in sidebar
3. Choose your CSV file
4. Review preview (first 10 rows)
5. Click **"Upload & Import Scores"**
6. Wait for success message

### Notes:
- CSV can contain 3 teams combined
- Each row: team_name, student_email/roll, score (0-40)
- Header row optional (auto-detected)
- Students not found will be skipped
- Team scores = average of member scores

---

## For HR Judge

### Step 1: Format Your CSV
Create a CSV with individual students:
```csv
student_email,score
student1@example.com,35
ROLL001,38
student2@example.com,32
```

### Step 2: Upload
1. Login as HR judge
2. Click **"Upload CSV Scores"** in sidebar
3. Choose your CSV file
4. Review preview (first 10 rows)
5. Click **"Upload & Import Scores"**
6. Wait for success message

### Notes:
- CSV format: student_email/roll, score (0-40)
- Header row optional (auto-detected)
- Students not found will be skipped
- HR judge can see overall performance from all rounds

---

## CSV Templates

### Download Templates:
- GD: `public/gd_scores_template.csv`
- HR: `public/hr_scores_template.csv`

---

## Common Issues

### "Student not found"
- Check email/roll_number matches database exactly
- Check for extra spaces or typos
- Students not found are skipped (count shown)

### "No matching students found"
- CSV format might be wrong
- Check column order
- Make sure students exist in database

### "Invalid file format"
- Make sure file is .csv (not .xlsx or .txt)
- Use comma as separator

---

## Manual Entry Backup

If CSV upload fails, you can score manually:
1. Select team from sidebar
2. Score each student using the criteria sliders
3. Add remarks if needed
4. Click "Save Evaluation" for each student

---

## After Upload

1. Verify scores imported correctly
2. Notify admin that scores are ready
3. Admin will announce results
4. Students will see rankings on leaderboard

---

## Need Help?

- Check `GD-HR-LEADERBOARD-COMPLETE.md` for detailed documentation
- Check browser console for error messages
- Use manual entry as backup
