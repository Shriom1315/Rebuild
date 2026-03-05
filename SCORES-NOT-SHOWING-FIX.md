# Scores Not Showing - Complete Fix

## Problem
Admin page shows "0/0 correct • 0 points" even though students have submitted answers.

## Root Cause
The `student_scores` table is either:
1. Empty (no scores calculated yet)
2. Has old data without new columns
3. Not synced with `student_answers` table

## Solution: 2-Step Process

---

## STEP 1: Diagnose the Problem

Run this SQL in Supabase to see what's wrong:

**File:** `CHECK-WHATS-WRONG.sql`

This will show you:
- ✅ How many student answers exist
- ✅ How many are marked correct/wrong
- ✅ If questions have points assigned
- ✅ If student_scores table has data
- ✅ If new columns exist

**Look for:**
- If "Student Answers" shows 0 → Students haven't taken exam yet
- If "Student Answers" has data but "Student Scores" is empty → Need to calculate scores
- If "Column Check" missing columns → Need to add them

---

## STEP 2: Calculate and Fix Scores

Run this SQL in Supabase:

**File:** `CALCULATE-AND-FIX-SCORES.sql`

This will:
1. ✅ Add new columns (correct_count, wrong_count, total_questions)
2. ✅ Delete old scores
3. ✅ Calculate NEW scores from student_answers
4. ✅ Calculate team averages
5. ✅ Show verification results

**After running, you should see:**
```
=== STUDENT SCORES ===
demo 1 | Team A | 18 correct | 27 wrong | 45 total | 18 points | 40%
demo 2 | Team A | 22 correct | 23 wrong | 45 total | 22 points | 49%
...

=== TEAM SCORES ===
Team A | 3 members | 20.0 avg_score | Rank 1
Team B | 2 members | 15.0 avg_score | Rank 2
...

✅ SCORES CALCULATED AND SAVED!
```

---

## STEP 3: Refresh Admin Page

1. Go back to Admin Score Management
2. Press **Ctrl+Shift+R** (hard refresh)
3. Scores should now show correctly!

---

## Common Issues

### Issue 1: "No student answers found"
**Cause:** Students haven't submitted their exams yet
**Solution:** Have students complete and submit the exam first

### Issue 2: "is_correct is NULL"
**Cause:** Answers weren't validated against correct answers
**Solution:** Run this SQL to fix:
```sql
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id
  AND sa.is_correct IS NULL;
```

### Issue 3: "Questions have 0 points"
**Cause:** Questions don't have points assigned
**Solution:** Update questions to have points:
```sql
UPDATE questions 
SET points = 1 
WHERE points IS NULL OR points = 0;
```

### Issue 4: Still showing 0/0 after running SQL
**Possible causes:**
1. Wrong round selected (check round_number in SQL)
2. Answers not marked as submitted
3. Browser cache (try incognito mode)
4. Check browser console for errors (F12)

---

## Verification Queries

### Check if scores were calculated:
```sql
SELECT COUNT(*) FROM student_scores 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);
```
Should return > 0

### Check if columns exist:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'student_scores' 
  AND column_name IN ('correct_count', 'wrong_count', 'total_questions');
```
Should return 3 rows

### Check sample score:
```sql
SELECT s.full_name, ss.* 
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
LIMIT 1;
```
Should show all fields populated

---

## Quick Fix Commands

### If you just want to recalculate everything:
```bash
1. Run: CHECK-WHATS-WRONG.sql (see what's there)
2. Run: CALCULATE-AND-FIX-SCORES.sql (fix everything)
3. Refresh admin page (Ctrl+Shift+R)
```

### If students took exam but scores not showing:
```bash
The issue is: student_scores table is not populated
Solution: Run CALCULATE-AND-FIX-SCORES.sql
```

### If you see errors about missing columns:
```bash
The issue is: New columns don't exist
Solution: CALCULATE-AND-FIX-SCORES.sql adds them automatically
```

---

## What Each SQL File Does

| File | Purpose |
|------|---------|
| `CHECK-WHATS-WRONG.sql` | Diagnose what data exists |
| `CALCULATE-AND-FIX-SCORES.sql` | Calculate scores from answers |
| `FIX-SCORE-DISPLAY-NOW.sql` | Just add columns (doesn't calculate) |
| `ADD-SCORE-DETAILS.sql` | Original file (same as above) |

**Recommendation:** Use `CALCULATE-AND-FIX-SCORES.sql` - it does everything!

---

## Expected Result

After running the SQL and refreshing:

**Before:**
```
demo 1: 0/0 correct • 0 wrong • 0% • 0 points
demo 2: 0/0 correct • 0 wrong • 0% • 0 points
```

**After:**
```
demo 1: 18/45 correct • 27 wrong • 40.0% • 18.0 points
demo 2: 22/45 correct • 23 wrong • 48.9% • 22.0 points
```

---

## Still Not Working?

1. **Check browser console** (F12) for JavaScript errors
2. **Check Supabase logs** for database errors
3. **Verify round_id** matches in SQL queries
4. **Try incognito mode** to rule out cache issues
5. **Check if students actually submitted** answers (submitted = true)

---

## Summary

The fix is simple:
1. ✅ Run `CHECK-WHATS-WRONG.sql` to diagnose
2. ✅ Run `CALCULATE-AND-FIX-SCORES.sql` to fix
3. ✅ Refresh admin page

**This calculates scores from student answers and populates all the new columns!**
