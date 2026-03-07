# Quick Fix: Students Seeing 0 Scores

## Problem
Students are seeing "0/0 correct" even though scores exist in the database. The issue is that `max_score` column is 0.

## Root Cause
The scores were calculated with old code that didn't set `max_score` properly. The database shows:
- `score`: Has values (30, 12, 35, etc.) ✅
- `max_score`: All showing 0 ❌
- Result: Students see "0/0 correct"

## Solution (Choose One)

### Option 1: Use Admin Panel (Easiest)
1. Log in as Admin
2. Go to **Scores** in sidebar
3. Select **Aptitude Test** round
4. Click **"CALCULATE SCORES"** button (purple gradient)
5. Confirm the action
6. ✅ Scores will be recalculated with correct max_score

### Option 2: Run SQL Fix Script
Run `fix-max-score-zero.sql` in Supabase SQL Editor:

```sql
-- Quick fix for max_score = 0
UPDATE student_scores ss
SET 
    max_score = (
        SELECT SUM(COALESCE(q.points, 1))
        FROM student_answers sa
        JOIN questions q ON q.id = sa.question_id
        WHERE sa.student_id = ss.student_id 
          AND sa.round_id = ss.round_id
    ),
    percentage = CASE 
        WHEN (
            SELECT SUM(COALESCE(q.points, 1))
            FROM student_answers sa
            JOIN questions q ON q.id = sa.question_id
            WHERE sa.student_id = ss.student_id 
              AND sa.round_id = ss.round_id
        ) > 0 
        THEN ROUND(
            (ss.score::DECIMAL / (
                SELECT SUM(COALESCE(q.points, 1))
                FROM student_answers sa
                JOIN questions q ON q.id = sa.question_id
                WHERE sa.student_id = ss.student_id 
                  AND sa.round_id = ss.round_id
            )) * 100, 
            2
        )
        ELSE 0 
    END
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1);
```

## Verification

### Check in Database:
```sql
SELECT 
    s.full_name,
    ss.score,
    ss.max_score,
    ss.percentage
FROM student_scores ss
JOIN students s ON s.id = ss.student_id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1);
```

**Expected Result**:
- `score`: Should have values (30, 12, 35, etc.)
- `max_score`: Should NOT be 0 (should match total question points)
- `percentage`: Should be calculated (score/max_score * 100)

### Check in Student Dashboard:
1. Log in as a student
2. View dashboard
3. Should see: "X/Y correct" (not "0/0 correct")
4. Should see proper score and percentage

## Why This Happened

### Old Code (Before Fix):
```javascript
// Missing max_score calculation
studentScoresMap[answer.student_id] = {
    score: 0,
    // max_score was missing!
};
```

### New Code (After Fix):
```javascript
// Properly calculates max_score
studentScoresMap[answer.student_id] = {
    score: 0,
    max_score: 0  // ✅ Added
};
// Then sums up all question points
max_score += points;
```

## What Students See

### Before Fix:
```
0/0 correct
0 wrong • 0%
0 points
```

### After Fix:
```
18/45 correct
27 wrong • 40.0%
30 points
```

## Admin Panel Display

### Before Fix:
- Shows "0/0 correct"
- Can't see actual scores
- Percentage shows 0%

### After Fix:
- Shows "18/45 correct"
- Displays actual score (30 points)
- Shows correct percentage (40%)

## Important Notes

1. **Code is Already Fixed**: The application code now correctly calculates max_score
2. **Database Needs Update**: Existing scores in database still have max_score = 0
3. **Two Ways to Fix**: Either recalculate via admin panel OR run SQL script
4. **One-Time Fix**: Once fixed, future score calculations will work correctly

## Testing Steps

1. ✅ Fix the scores (Option 1 or 2 above)
2. ✅ Refresh student browser (Ctrl+Shift+R)
3. ✅ Check student dashboard shows correct scores
4. ✅ Verify in admin panel scores look correct
5. ✅ Check leaderboard shows proper rankings

## Common Questions

**Q: Why didn't the scores calculate correctly the first time?**
A: The code was missing the max_score calculation. It's now fixed.

**Q: Will this happen again?**
A: No, the code is fixed. Future calculations will work correctly.

**Q: Do I need to run this fix for every round?**
A: Only for rounds that were calculated with the old code. New rounds will be fine.

**Q: What if students still see 0 after fixing?**
A: Have them hard refresh (Ctrl+Shift+R) or clear browser cache.

## Summary

**Issue**: max_score = 0 in database
**Impact**: Students see "0/0 correct"
**Fix**: Recalculate scores OR run SQL update
**Time**: 2 minutes
**Status**: ✅ Code fixed, database needs one-time update

---

**Quick Action**: Go to Admin → Scores → Aptitude Test → Click "CALCULATE SCORES"
