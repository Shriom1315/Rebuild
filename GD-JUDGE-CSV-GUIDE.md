# GD Judge CSV Score Upload & Team Qualification Guide

## Overview
The GD Judge panel now supports CSV bulk upload of individual student scores and automatic calculation of qualified teams for the next round based on team average scores.

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
1. Log in to GD Judge Portal
2. Click "Upload CSV Scores" button in the sidebar
3. Select your CSV file with individual student scores
4. Review the preview (first 10 rows)
5. Click "Upload & Import Scores"
6. Wait for confirmation message

#### Important Notes
- Score range: 0-40 (max score for GD round)
- Header row is automatically detected and skipped
- Students not found in database will be skipped
- Existing scores for GD round will be replaced
- You can identify students by email OR roll number

### Step 2: Calculate Qualified Teams

After uploading all student scores, you need to calculate which teams qualify for the next round.

#### How to Calculate
1. Click "Calculate Qualified Teams" button in the sidebar
2. Set parameters:
   - **Top N Teams**: Number of teams to qualify (e.g., 10)
   - **Minimum Average Score**: Minimum team average required (e.g., 30)
3. Click "Calculate & Qualify"
4. System will:
   - Calculate average score for each team
   - Rank teams by average score
   - Qualify top N teams that meet minimum score
   - Update team status (qualified/eliminated)
   - Create team_round_status records

#### Calculation Logic
- **Team Average Score** = Sum of all member scores / Number of members
- Teams are ranked by average score (highest first)
- Top N teams with average score >= minimum score are qualified
- All other teams are eliminated

#### Example
If you set:
- Top N Teams: 10
- Minimum Average Score: 30

Result:
- Teams ranked 1-10 with average >= 30: QUALIFIED
- Teams ranked 1-10 with average < 30: ELIMINATED
- Teams ranked 11+: ELIMINATED

### Step 3: Verify Results
After calculation, you'll see:
- Success message with number of qualified teams
- Top 3 teams with their scores
- Updated team list showing qualified teams

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

## Sample CSV File
A sample file `sample-gd-scores.csv` is included in the project root for reference.

## Scoring Guidelines

### GD Round Scoring (Total: 40 points)
Individual criteria (each out of 10):
- Communication: 0-10
- Confidence: 0-10
- Subject Knowledge: 0-10
- Teamwork/Collaboration: 0-10

Total Score = Sum of all criteria (0-40)

### Team Qualification
- Teams are evaluated based on AVERAGE member score
- This ensures fairness regardless of team size (2-4 members)
- Example:
  - Team A (4 members): 35, 38, 32, 36 → Average: 35.25
  - Team B (3 members): 37, 39, 35 → Average: 37.00
  - Team B ranks higher despite having fewer members

## Troubleshooting

### Issue: "No matching students found"
**Solution**: 
- Verify email addresses match exactly with database
- Check roll numbers are correct
- Ensure CSV is comma-separated

### Issue: "GD Round not found in database"
**Solution**: 
- Ensure Round 3 (GD) exists in the rounds table
- Contact system administrator

### Issue: Some students skipped during upload
**Solution**:
- Check the console for warnings about which students weren't found
- Verify those students exist in the database
- Check for typos in email/roll number

### Issue: Calculate button doesn't work
**Solution**:
- Ensure you've uploaded scores first
- Check that at least some teams have scores
- Verify you're logged in as a judge

## Best Practices

1. **Upload All Scores First**: Complete all student evaluations before calculating qualified teams
2. **Verify Data**: Review the CSV preview before uploading
3. **Set Appropriate Thresholds**: 
   - Top N should match your event capacity
   - Minimum score should reflect quality standards
4. **Backup Before Calculate**: The calculate operation updates team statuses
5. **Communicate Results**: After qualification, announce results to teams

## Database Changes

### Tables Updated
1. **student_scores**: Individual student scores for GD round
2. **team_round_status**: Team qualification status for GD round
3. **teams**: Team status (qualified/eliminated)

### Fields Set
- `student_scores.score`: Individual score (0-40)
- `student_scores.max_score`: 40
- `student_scores.percentage`: (score/40) * 100
- `team_round_status.status`: 'qualified' or 'eliminated'
- `team_round_status.message`: Qualification message with rank and score
- `teams.status`: 'qualified' or 'eliminated'

## Security Notes
- Only logged-in GD judges can upload scores
- Only logged-in GD judges can calculate qualifications
- All operations are logged with judge ID
- Previous scores are replaced (not duplicated)

## Support
For issues or questions, contact the system administrator or refer to the main documentation.
