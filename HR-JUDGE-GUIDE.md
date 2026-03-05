# HR Judge - CSV Upload & Winner Selection Guide

## Overview
The HR Judge panel supports CSV bulk upload of individual student scores and automatic selection of competition WINNERS based on team average scores. This is the FINAL round where winners are announced!

## Workflow

### Step 1: Upload Individual Student Scores via CSV

#### CSV Format
- **Delimiter**: Comma-separated (CSV)
- **Columns**: 2 columns only
  1. Student Email or Roll Number
  2. Score (0-40)

#### Example CSV Format
```csv
student_email,score
john@example.com,35
jane@example.com,38
ROLL001,32
bob@example.com,36
```

#### How to Upload
1. Log in to HR Judge Portal
2. Click "Upload CSV Scores" button in the sidebar
3. Select your CSV file with individual student scores
4. Review the preview (first 10 rows)
5. Click "Upload & Import Scores"
6. Wait for confirmation message

#### Important Notes
- Score range: 0-40 (max score for HR round)
- Header row is automatically detected and skipped
- Students not found in database will be skipped
- Existing scores for HR round will be replaced
- You can identify students by email OR roll number

---

### Step 2: Select Winners 🏆

After uploading all student scores, you need to select the competition WINNERS!

#### How to Select Winners
1. Click "Select Winners" button in the sidebar (trophy icon)
2. Set parameters:
   - **Top N Teams**: Number of winning teams (e.g., 5)
   - **Minimum Average Score**: Minimum team average required (e.g., 30)
3. Click "🏆 Select Winners"
4. System will:
   - Calculate average score for each team
   - Rank teams by average score
   - Select top N teams that meet minimum score as WINNERS
   - Update team status to "winner"
   - Create final rankings

#### Selection Logic
- **Team Average Score** = Sum of all member scores / Number of members
- Teams are ranked by average score (highest first)
- Top N teams with average score >= minimum score are WINNERS
- All other teams are not selected

#### Example
If you set:
- Top N Teams: 5
- Minimum Average Score: 30

Result:
- Teams ranked 1-5 with average >= 30: **WINNERS** 🏆
- Teams ranked 1-5 with average < 30: Not selected
- Teams ranked 6+: Not selected

---

### Step 3: Announce Winners! 🎉

After selection, you'll see:
- Success message with number of winning teams
- Top 3 teams with their scores
- Updated team list showing winners

**This is the FINAL round - competition complete!**

---

## CSV File Preparation

### Using Excel
1. Create a new spreadsheet
2. Column A: Student email or roll number
3. Column B: Score (0-40)
4. Save as "CSV (Comma delimited) (*.csv)"

### Using Google Sheets
1. Create a new sheet
2. Column A: Student email or roll number
3. Column B: Score (0-40)
4. File → Download → Comma-separated values (.csv)

### Using Text Editor
Create a plain text file with comma-separated values:
```
student_email,score
student1@example.com,35
student2@example.com,38
```

---

## Sample CSV File
A sample file `sample-hr-scores.csv` is included in the project root for reference.

---

## Scoring Guidelines

### HR Round Scoring (Total: 40 points)
Individual criteria (each out of 10):
- Attitude & Mindset: 0-10
- Problem Solving: 0-10
- Cultural Fit: 0-10
- Technical Clarity: 0-10

Total Score = Sum of all criteria (0-40)

### Winner Selection
- Teams are evaluated based on AVERAGE member score
- This ensures fairness regardless of team size (2-4 members)
- Example:
  - Team A (4 members): 35, 38, 32, 36 → Average: 35.25
  - Team B (3 members): 37, 39, 35 → Average: 37.00
  - Team B ranks higher despite having fewer members

---

## Differences from GD Round

| Aspect | GD Round | HR Round |
|--------|----------|----------|
| Purpose | Qualify for next round | Select WINNERS |
| Status | "qualified" or "eliminated" | "winner" or not selected |
| Next Step | Proceed to HR round | Competition complete! |
| Button | "Calculate Qualified Teams" | "Select Winners" 🏆 |
| Icon | Calculate | Trophy |
| Color | Green | Gold/Yellow |

---

## Troubleshooting

### Issue: "No matching students found"
**Solution**: 
- Verify email addresses match exactly with database
- Check roll numbers are correct
- Ensure CSV is comma-separated

### Issue: "HR Round not found in database"
**Solution**: 
- Ensure Round 4 (HR) exists in the rounds table
- Contact system administrator

### Issue: Some students skipped during upload
**Solution**:
- Check the console for warnings about which students weren't found
- Verify those students exist in the database
- Check for typos in email/roll number

### Issue: Select Winners button doesn't work
**Solution**:
- Ensure you've uploaded scores first
- Check that at least some teams have scores
- Verify you're logged in as HR judge

---

## Best Practices

1. **Upload All Scores First**: Complete all student evaluations before selecting winners
2. **Verify Data**: Review the CSV preview before uploading
3. **Set Appropriate Thresholds**: 
   - Top N should match your prize/recognition capacity
   - Minimum score should reflect quality standards
4. **Double-Check Before Selection**: Winner selection is final!
5. **Announce Results**: After selection, announce winners to all participants

---

## Database Changes

### Tables Updated
1. **student_scores**: Individual student scores for HR round
2. **team_round_status**: Team winner status for HR round
3. **teams**: Team status (winner or not)

### Fields Set
- `student_scores.score`: Individual score (0-40)
- `student_scores.max_score`: 40
- `student_scores.percentage`: (score/40) * 100
- `team_round_status.status`: 'winner' or 'eliminated'
- `team_round_status.message`: Winner message with rank and score
- `teams.status`: 'winner' (for winning teams)

---

## Winner Announcement

After selecting winners, you can:
1. Export winner list from database
2. Announce on leaderboard
3. Send congratulations emails
4. Prepare certificates/prizes
5. Celebrate! 🎉

---

## Quick Workflow Summary

```
1. Upload CSV Scores
   ↓
2. Click "Select Winners"
   ↓
3. Set Top N and Min Score
   ↓
4. Click "🏆 Select Winners"
   ↓
5. View Results
   ↓
6. Announce Winners! 🎉
```

---

## Security Notes
- Only logged-in HR judges can upload scores
- Only logged-in HR judges can select winners
- All operations are logged with judge ID
- Previous scores are replaced (not duplicated)
- Winner selection is permanent

---

## Support
For issues or questions, contact the system administrator or refer to the main documentation.

---

## 🏆 Congratulations!
You've completed the final round evaluation. Time to celebrate the winners! 🎉
