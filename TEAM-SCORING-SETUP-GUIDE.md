# Team Scoring Setup Guide

## Overview
This guide will help you set up the team-based scoring feature for the Technical Round (Round 2). The admin can now enter scores directly for each team instead of individual students.

## Database Setup (Required)

Run these SQL scripts in Supabase SQL Editor in this order:

### Step 1: Add Scoring Columns
Run `add-team-scoring-columns.sql`:

```sql
ALTER TABLE team_round_status 
ADD COLUMN IF NOT EXISTS score DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_score DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS remarks TEXT;
```

### Step 2: Fix Status Constraint
Run `fix-team-round-status-constraint.sql`:

```sql
-- Drop old constraint
ALTER TABLE team_round_status 
DROP CONSTRAINT IF EXISTS team_round_status_status_check;

-- Add new constraint with 'completed' status
ALTER TABLE team_round_status 
ADD CONSTRAINT team_round_status_status_check 
CHECK (status IN ('not_started', 'in_progress', 'qualified', 'eliminated', 'completed', 'winner'));
```

### Step 3: Verify Setup
```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'team_round_status'
  AND column_name IN ('score', 'max_score', 'percentage', 'remarks');

-- Check constraint is correct
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint
WHERE conrelid = 'team_round_status'::regclass
  AND conname = 'team_round_status_status_check';
```

## How It Works

### For Technical Round (Round 2):
- Admin sees **Team Scoring** interface
- Each team has a single score entry
- Score is entered per team (not per student)
- All team members share the same score

### For Other Rounds (Round 1, 3, 4):
- Admin sees **Individual Scoring** interface
- Each student has their own score
- Team average is calculated automatically

## Using the Feature

### 1. Navigate to Score Management
- Log in as Admin
- Go to "Scores" in the sidebar
- Select "Technical Round" from the round selector

### 2. Enter Team Scores
For each team, you'll see:
- Team name and code
- List of team members
- Score input fields (Score / Max Score)
- Remarks field (optional)

### 3. Save Scores
1. Click the "+" or "edit" button next to a team
2. Enter the score (e.g., 85)
3. Enter max score (default: 100)
4. Optionally add remarks
5. Click "SAVE"

### 4. View Results
- Score is displayed prominently
- Percentage is calculated automatically
- Remarks are shown below the score

## Example Workflow

### Scenario: Technical Round Assessment

**Team A** completed a coding challenge:
1. Admin clicks edit button for Team A
2. Enters score: 85
3. Max score: 100
4. Remarks: "Excellent problem-solving, clean code"
5. Clicks SAVE

**Result**:
- Score: 85.0
- Percentage: 85.0%
- Status: completed
- All 4 team members get this score

## Features

### Team Scoring Interface:
✅ Large, clear score input fields
✅ Score and max score side by side
✅ Percentage calculated automatically
✅ Optional remarks field
✅ Shows all team members
✅ Edit/Add button for each team
✅ Save/Cancel buttons

### Benefits:
✅ Faster scoring (one entry per team vs 4 entries)
✅ Consistent scores for team projects
✅ Reflects team-based assessment nature
✅ Cleaner interface for technical rounds
✅ Remarks for feedback

## Database Schema

### team_round_status table (new columns):
```sql
score         DECIMAL(10,2)  -- Team's score (e.g., 85.5)
max_score     DECIMAL(10,2)  -- Maximum possible (e.g., 100)
percentage    DECIMAL(5,2)   -- Calculated % (85.5)
remarks       TEXT           -- Optional feedback
status        VARCHAR        -- Now includes 'completed'
```

## Status Values

The `status` column now supports:
- `not_started` - Team hasn't started the round
- `in_progress` - Team is currently in the round
- `qualified` - Team qualified for next round
- `eliminated` - Team was eliminated
- `completed` - Team completed the round (new)
- `winner` - Team won the competition

## Troubleshooting

### Error: "max_score column not found"
**Solution**: Run `add-team-scoring-columns.sql`

### Error: "violates check constraint"
**Solution**: Run `fix-team-round-status-constraint.sql`

### Scores not saving
**Check**:
1. Database migration completed
2. Constraint updated
3. Browser console for errors
4. Supabase connection

### Wrong interface showing
**Check**:
- Round number: Round 2 shows team scoring
- Other rounds show individual scoring
- Refresh the page after selecting round

## API Endpoints Used

### Save Team Score:
```javascript
supabase
  .from('team_round_status')
  .upsert({
    team_id: teamId,
    round_id: roundId,
    score: 85.5,
    max_score: 100,
    percentage: 85.5,
    remarks: 'Great work!',
    status: 'completed'
  })
```

### Load Team Scores:
```javascript
supabase
  .from('team_round_status')
  .select('team_id, score, max_score, remarks')
  .eq('round_id', roundId)
```

## Best Practices

### Scoring:
1. **Be Consistent**: Use same max_score for all teams
2. **Add Remarks**: Provide feedback for teams
3. **Save Regularly**: Don't lose work
4. **Review Before Announcing**: Double-check scores

### Max Score:
- Use 100 for percentage-based scoring
- Use actual max points if different
- Keep consistent across all teams

### Remarks:
- Highlight strengths
- Note areas for improvement
- Keep professional and constructive
- Optional but recommended

## Integration with Other Features

### Qualification:
- Team scores used for qualification
- Top N teams advance
- Minimum score threshold applies

### Leaderboard:
- Team scores displayed
- Sorted by score/percentage
- Only shown after announcement

### Results Announcement:
- Admin can announce results
- Teams see their scores
- Remarks visible to teams

## Future Enhancements

Potential improvements:
- Bulk score import via CSV
- Score history/audit log
- Score comparison charts
- Export scores to Excel
- Email notifications to teams

## Summary

The team scoring feature makes it easy to score technical rounds where teams work together. Instead of entering 4 individual scores, you enter one team score. This is faster, more accurate, and better reflects the team-based nature of technical assessments.

**Key Points**:
- Run database migrations first
- Round 2 = Team scoring
- Other rounds = Individual scoring
- Score, max score, and remarks per team
- Percentage calculated automatically

---

**Setup Time**: 5 minutes
**Difficulty**: Easy
**Status**: Production ready
