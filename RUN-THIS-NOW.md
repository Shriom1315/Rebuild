# 🚨 SCORES NOT SHOWING? RUN THIS NOW!

## Quick Fix (2 Minutes)

### Step 1: Check What's Wrong
1. Open Supabase → SQL Editor
2. Copy and run: **`CHECK-WHATS-WRONG.sql`**
3. Look at the results

### Step 2: Fix It
1. Copy and run: **`CALCULATE-AND-FIX-SCORES.sql`**
2. Wait for "✅ SCORES CALCULATED AND SAVED!"
3. Refresh admin page (Ctrl+Shift+R)

### Step 3: Done!
Scores should now show: "18/45 correct (40%), 27 wrong, 18.0 points"

---

## What's Happening?

The problem is that `student_scores` table is empty or outdated.

The solution calculates scores from `student_answers` table and populates everything.

---

## Files to Use

1. **`CHECK-WHATS-WRONG.sql`** - See what data exists (diagnostic)
2. **`CALCULATE-AND-FIX-SCORES.sql`** - Calculate and fix everything (THE FIX)

---

## If Still Not Working

### Check 1: Do students have answers?
Run this:
```sql
SELECT COUNT(*) FROM student_answers 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);
```
If returns 0 → Students haven't taken exam yet!

### Check 2: Are answers marked correct/wrong?
Run this:
```sql
SELECT is_correct, COUNT(*) FROM student_answers 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY is_correct;
```
If all NULL → Need to mark answers as correct/wrong

### Check 3: Do questions have points?
Run this:
```sql
SELECT points, COUNT(*) FROM questions 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY points;
```
If all 0 or NULL → Need to assign points to questions

---

## Quick Fixes for Common Issues

### Fix 1: Mark answers as correct/wrong
```sql
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id;
```

### Fix 2: Assign points to questions
```sql
UPDATE questions 
SET points = 1 
WHERE points IS NULL OR points = 0;
```

### Fix 3: Then recalculate scores
Run: `CALCULATE-AND-FIX-SCORES.sql`

---

## Expected Output

After running `CALCULATE-AND-FIX-SCORES.sql`, you should see:

```
=== STUDENT SCORES ===
demo 1 | Team A | 18 | 27 | 45 | 18 | 40%
demo 2 | Team A | 22 | 23 | 45 | 22 | 49%
demo 3 | Team A | 15 | 30 | 45 | 15 | 33%

=== TEAM SCORES ===
Team A | 3 | 18.33 | 1
Team B | 2 | 15.00 | 2

=== SUMMARY ===
student_scores_count: 5
team_scores_count: 2
submitted_answers_count: 225

✅ SCORES CALCULATED AND SAVED!
```

---

## Still Stuck?

Read the full guide: **`SCORES-NOT-SHOWING-FIX.md`**

Or check:
1. Browser console (F12) for errors
2. Supabase logs for database errors
3. Make sure you're looking at the right round
4. Try incognito mode (clear cache)

---

**TL;DR: Run `CALCULATE-AND-FIX-SCORES.sql` in Supabase, then refresh your page!**
