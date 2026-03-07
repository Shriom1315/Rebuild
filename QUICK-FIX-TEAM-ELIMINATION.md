# Quick Fix: Team Elimination Issue

## Problem
Teams are showing as "TEAM ELIMINATED" even after entering technical round scores. The aptitude round shows "Not qualified (rank 1, score 0.00)".

## Root Cause
1. When saving team scores, status was set to "completed" instead of "qualified"
2. Student dashboard treats any status other than "qualified" as eliminated
3. Missing team_round_status entries for some teams

## Solution

### Step 1: Run Database Fix Script
Execute `fix-team-qualification-status.sql` in Supabase SQL Editor:

```sql
-- Fix teams with aptitude scores
UPDATE team_round_status
SET 
    status = 'qualified',
    message = 'Qualified for next round'
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  AND team_id IN (
    SELECT DISTINCT t.id 
    FROM teams t
    JOIN students s ON s.team_id = t.id
    JOIN student_scores ss ON ss.student_id = s.id
    WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
  );

-- Fix teams with technical scores
UPDATE team_round_status
SET status = 'qualified'
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 2)
  AND score IS NOT NULL
  AND score > 0;
```

### Step 2: Refresh Application
1. Rebuild: `npm run build`
2. Restart your server
3. Clear browser cache (Ctrl+Shift+R)

### Step 3: Re-enter Technical Scores (if needed)
1. Go to Admin → Scores
2. Select Technical Round
3. Re-save team scores
4. Status will now be "qualified" automatically

## What Was Fixed

### Code Changes:
- Changed `status: 'completed'` to `status: 'qualified'` in `handleSaveTeamScore`
- Teams now properly marked as qualified when scores are entered

### Database Changes:
- Fixed existing team_round_status entries
- Created missing entries for teams
- Updated status from 'eliminated' to 'qualified' where appropriate

## Verification

### Check Team Status:
```sql
SELECT 
    t.team_name,
    r.name as round_name,
    trs.status,
    trs.score
FROM team_round_status trs
JOIN teams t ON t.id = trs.team_id
JOIN rounds r ON r.id = trs.round_id
ORDER BY r.round_number, t.team_name;
```

### Expected Results:
- Round 1 (Aptitude): status = 'qualified'
- Round 2 (Technical): status = 'qualified' (after entering scores)
- Round 3 (GD): status = 'in_progress' or 'qualified'
- Round 4 (HR): status = 'in_progress' or 'winner'

## Student Dashboard Should Now Show:
- ✅ Aptitude Test: Completed with score
- ✅ Technical Round: Accessible (not eliminated)
- ✅ GD Round: Shows based on qualification
- ✅ HR Round: Shows based on qualification

## Prevention
Going forward, when you enter team scores for technical round:
1. Scores are automatically saved with status = 'qualified'
2. Teams can proceed to next rounds
3. No manual status updates needed

## If Issue Persists

### 1. Check Database:
```sql
-- See team status
SELECT * FROM team_round_status 
WHERE team_id = 'your-team-id';
```

### 2. Manually Fix a Team:
```sql
UPDATE team_round_status
SET status = 'qualified'
WHERE team_id = 'your-team-id' 
  AND round_id = 'round-id';
```

### 3. Check Student View:
- Log in as a student
- Dashboard should show rounds as accessible
- No "TEAM ELIMINATED" message

## Summary

**Issue**: Teams marked as eliminated after scoring
**Fix**: Changed status from 'completed' to 'qualified'
**Action**: Run SQL fix script + rebuild app
**Result**: Teams properly qualified for next rounds

---

**Status**: ✅ Fixed
**Build**: main.c0c120e2.js
**Database**: Updated with fix script
