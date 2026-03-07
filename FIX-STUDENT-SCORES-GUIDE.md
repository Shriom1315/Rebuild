# Fix Student Scores - Complete Guide

## Problem
Students are seeing 0 scores even after completing the aptitude test. Scores need to be calculated from their answers.

## Solution

### Step 1: Calculate Scores from Answers
Run `calculate-aptitude-scores-fix.sql` in Supabase SQL Editor to automatically calculate all student scores.

### Step 2: Use Admin Panel to Calculate Scores
1. Log in as Admin
2. Go to "Scores" in sidebar
3. Select "Aptitude Test" round
4. Click "CALCULATE SCORES" button (purple gradient button)
5. Confirm the action
6. Scores will be calculated automatically

### Step 3: Manual Score Editing (if needed)
Admins can now manually edit individual student scores:
1. Go to Admin → Scores
2. Select any round
3. Find the student in their team
4. Click the edit icon (pencil)
5. Enter score and max score
6. Click "Save"

## What Was Fixed

### Code Changes:
**File**: `src/pages/AdminScoreManagement.js`

**Fixed**:
- Added `max_score` calculation in `handleCalculateScores`
- Changed percentage calculation from `correct/total` to `score/max_score`
- Now properly calculates weighted scores based on question points

**Before**:
```javascript
percentage = (correct_count / total_questions) * 100
// This was wrong - didn't account for question points
```

**After**:
```javascript
max_score = sum of all question points
score = sum of points for correct answers
percentage = (score / max_score) * 100
// Correct - accounts for weighted questions
```

## How Score Calculation Works

### Automatic Calculation:
1. Fetches all student answers for the round
2. For each answer, gets the question points
3. Sums up points for correct answers = score
4. Sums up all question points = max_score
5. Calculates percentage = (score / max_score) × 100
6. Counts correct/wrong/total questions
7. Saves to `student_scores` table

### Example:
```
Student answered 10 questions:
- 7 correct (1 point each) = 7 points
- 3 wrong (1 point each) = 0 points
- Max possible = 10 points

Score: 7
Max Score: 10
Percentage: 70%
Correct: 7
Wrong: 3
Total: 10
```

## Admin Features

### Calculate Scores Button:
- **Location**: Admin → Scores → Actions panel
- **Function**: Automatically calculates scores from student_answers
- **When to use**: After students complete a round
- **Effect**: Deletes old scores and recalculates fresh

### Manual Score Editing:
- **Location**: Admin → Scores → Individual student row
- **Function**: Manually enter/edit student scores
- **When to use**: 
  - To correct calculation errors
  - To add bonus points
  - To adjust scores manually
- **Fields**:
  - Score: Points earned
  - Max Score: Maximum possible points
  - Percentage: Calculated automatically

### Edit Process:
1. Click edit icon next to student
2. Two input fields appear: Score / Max Score
3. Enter values
4. Click "Save" to confirm
5. Click "Cancel" to discard changes

## Database Tables

### student_scores:
```sql
student_id       UUID      -- Student identifier
round_id         UUID      -- Round identifier
score            DECIMAL   -- Points earned
max_score        DECIMAL   -- Maximum possible
percentage       DECIMAL   -- Calculated %
correct_count    INT       -- Number correct
wrong_count      INT       -- Number wrong
total_questions  INT       -- Total answered
```

### student_answers:
```sql
student_id       UUID      -- Student identifier
question_id      UUID      -- Question identifier
round_id         UUID      -- Round identifier
selected_answer  TEXT      -- Student's answer (a/b/c/d)
is_correct       BOOLEAN   -- Whether answer is correct
submitted        BOOLEAN   -- Whether submitted
```

## SQL Script: calculate-aptitude-scores-fix.sql

This script:
1. Checks current answers and scores
2. Deletes existing scores for Round 1
3. Calculates correct scores from answers
4. Inserts new scores with proper calculations
5. Marks teams as qualified
6. Verifies the results

**Run this if**:
- Students show 0 scores
- Scores seem incorrect
- Need to recalculate everything

## Verification Steps

### Check Student Scores:
```sql
SELECT 
    s.full_name,
    ss.correct_count,
    ss.wrong_count,
    ss.total_questions,
    ss.score,
    ss.max_score,
    ss.percentage
FROM student_scores ss
JOIN students s ON s.id = ss.student_id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ss.score DESC;
```

### Check Student Answers:
```sql
SELECT 
    s.full_name,
    COUNT(*) as total_answers,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers
FROM student_answers sa
JOIN students s ON s.id = sa.student_id
WHERE sa.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.id, s.full_name;
```

## Student Dashboard

After fixing scores, students will see:
- ✅ Correct score displayed
- ✅ Percentage shown
- ✅ Correct/Wrong/Total counts
- ✅ Round marked as completed
- ✅ Progress bar updated

## Common Issues

### Issue: Students still see 0
**Solution**: 
1. Run calculate scores in admin panel
2. Or run SQL script
3. Refresh student browser

### Issue: Scores don't match answers
**Solution**:
1. Check if `is_correct` field is set properly
2. Verify question points are correct
3. Recalculate using admin button

### Issue: Can't edit scores
**Solution**:
1. Make sure you're logged in as admin
2. Select the correct round
3. Click the edit icon (not the score itself)

## Build Status
✅ Compiled successfully
✅ No diagnostics errors
✅ Production ready

## Files Modified
1. `src/pages/AdminScoreManagement.js` - Fixed score calculation

## Files Created
1. `calculate-aptitude-scores-fix.sql` - SQL script to fix scores
2. `FIX-STUDENT-SCORES-GUIDE.md` - This guide

## Summary

**Problem**: Students seeing 0 scores
**Root Cause**: Percentage calculated incorrectly, missing max_score
**Solution**: Fixed calculation logic + added SQL script
**Admin Feature**: Can manually edit individual scores
**Result**: Scores calculated correctly, students see proper results

---

**Status**: ✅ Fixed
**Build**: main.f43a12b7.js
**Ready for**: Production deployment
