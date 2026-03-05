# Fix Wrong Scores - Shows "0/44 correct, 44 wrong"

## The Problem

Scores are showing but all answers are marked as wrong:
- "0/44 correct"
- "44 wrong"
- "0.0 points"

## Why This Happens

The `is_correct` field in `student_answers` table is not set properly. It's either:
1. All set to `false`
2. All set to `NULL`
3. Not comparing with the correct answer

## The Solution

Run SQL to:
1. Mark answers as correct/wrong by comparing with correct_answer
2. Recalculate scores with the corrected data

---

## RUN THIS NOW

### Option 1: Complete Fix (Recommended)

**File:** `COMPLETE-FIX-2-STEPS.sql`

This does everything in one go:
1. ✅ Fixes is_correct field
2. ✅ Recalculates all scores
3. ✅ Shows results

**Steps:**
1. Open Supabase → SQL Editor
2. Copy all content from `COMPLETE-FIX-2-STEPS.sql`
3. Paste and Run
4. Wait for "✅ COMPLETE!"
5. Refresh admin page (Ctrl+Shift+R)

### Option 2: Step by Step

**Step 1:** Fix is_correct field
- Run: `FIX-IS-CORRECT-FIELD.sql`
- This marks answers as correct/wrong

**Step 2:** Recalculate scores
- Run: `SIMPLE-FIX-SCORES-NOW.sql`
- This recalculates with corrected data

---

## What the SQL Does

### Part 1: Fix is_correct
```sql
UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id;
```

This compares each student's answer with the correct answer and marks it true/false.

### Part 2: Recalculate Scores
- Counts correct answers
- Counts wrong answers
- Calculates points
- Updates student_scores and team_scores

---

## Expected Result

### Before:
```
demo 1: 0/44 correct • 44 wrong • 0.0% • 0.0 points
demo 2: 0/43 correct • 43 wrong • 0.0% • 0.0 points
```

### After:
```
demo 1: 18/44 correct • 26 wrong • 40.9% • 18.0 points
demo 2: 22/43 correct • 21 wrong • 51.2% • 22.0 points
```

---

## Verification

After running the SQL, you should see output like:

```
=== STEP 1 COMPLETE ===
correct_answers: 89
wrong_answers: 136

=== STUDENT SCORES ===
demo 1 | Team A | 18 | 26 | 44 | 18.0 | 40.9
demo 2 | Team B | 22 | 21 | 43 | 22.0 | 51.2
...

=== TEAM SCORES ===
Team A | 3 | 18.33 | 1
Team B | 2 | 20.00 | 2

✅ COMPLETE! Refresh your admin page now!
```

---

## Common Issues

### Issue 1: "Still showing 0 correct"
**Cause:** Questions don't have correct_answer set
**Check:** Run this to see:
```sql
SELECT id, question_text, correct_answer 
FROM questions 
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1)
LIMIT 5;
```
If `correct_answer` is NULL, you need to set it in questions.

### Issue 2: "All answers marked wrong but they're correct"
**Cause:** Answer format mismatch (e.g., "A" vs "a", "option_a" vs "a")
**Check:** Run this:
```sql
SELECT 
  sa.selected_answer,
  q.correct_answer,
  sa.selected_answer = q.correct_answer as matches
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
LIMIT 10;
```
If `matches` is always false, check the format.

### Issue 3: "Some correct, some wrong, but scores still 0"
**Cause:** Questions have 0 points
**Fix:** Run this:
```sql
UPDATE questions SET points = 1 WHERE points IS NULL OR points = 0;
```
Then recalculate scores.

---

## Quick Diagnostic

Run this to see what's wrong:

```sql
-- Check answer format
SELECT 
  'Answer Format Check' as check_name,
  sa.selected_answer as student_selected,
  q.correct_answer as question_correct,
  sa.is_correct as marked_as,
  CASE WHEN sa.selected_answer = q.correct_answer THEN 'MATCH' ELSE 'NO MATCH' END as comparison
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
LIMIT 5;

-- Check question points
SELECT 
  'Question Points Check' as check_name,
  COUNT(*) as total_questions,
  SUM(points) as total_points,
  AVG(points) as avg_points
FROM questions
WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);
```

---

## Summary

**Problem:** Answers marked as wrong when they're correct
**Cause:** `is_correct` field not set properly
**Solution:** Run `COMPLETE-FIX-2-STEPS.sql`
**Result:** Correct scores showing!

---

## Files to Use

| File | Purpose |
|------|---------|
| `COMPLETE-FIX-2-STEPS.sql` | ✅ Complete fix (use this) |
| `FIX-IS-CORRECT-FIELD.sql` | Just fix is_correct field |
| `SIMPLE-FIX-SCORES-NOW.sql` | Just recalculate scores |

**Recommendation:** Use `COMPLETE-FIX-2-STEPS.sql` - it does everything!
