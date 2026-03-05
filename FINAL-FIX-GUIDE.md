# FINAL FIX - Scores Not Showing

## The Error You Got

```
ERROR: 42703: column sa.submitted does not exist
```

This means the `student_answers` table doesn't have a `submitted` column.

## The Solution

Use the corrected SQL file that doesn't check for `submitted` column.

---

## RUN THIS NOW

### Step 1: Open Supabase
1. Go to https://supabase.com
2. Open your project
3. Click "SQL Editor"
4. Click "New Query"

### Step 2: Copy and Run This SQL
**File:** `SIMPLE-FIX-SCORES-NOW.sql`

1. Copy ALL the content
2. Paste into SQL Editor
3. Click "Run" (or Ctrl+Enter)

### Step 3: Check Results
You should see a table with:
```
student | team | correct | wrong | total | points | percent
demo 1  | A    | 18      | 27    | 45    | 18     | 40.0
demo 2  | A    | 22      | 23    | 45    | 22     | 48.9
...

✅ DONE! Refresh your admin page now!
```

### Step 4: Refresh Admin Page
1. Go to Admin Score Management
2. Press Ctrl+Shift+R (hard refresh)
3. ✅ Scores should now show!

---

## What This SQL Does

1. Adds new columns (correct_count, wrong_count, total_questions)
2. Deletes old scores
3. Calculates NEW scores from student_answers
4. Calculates team averages
5. Shows you the results

---

## If You Still Get Errors

### Error: "column is_correct does not exist"
**Fix:** Run this first to add the column:
```sql
ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;

UPDATE student_answers sa
SET is_correct = (sa.selected_answer = q.correct_answer)
FROM questions q
WHERE sa.question_id = q.id;
```

### Error: "column points does not exist"
**Fix:** Run this first:
```sql
ALTER TABLE questions ADD COLUMN IF NOT EXISTS points INT DEFAULT 1;
UPDATE questions SET points = 1 WHERE points IS NULL OR points = 0;
```

### Error: "division by zero"
**Fix:** Questions don't have points. Run the fix above.

---

## Files to Use (In Order)

1. **`SIMPLE-FIX-SCORES-NOW.sql`** ← USE THIS ONE (fixed version)
2. ~~`CALCULATE-AND-FIX-SCORES.sql`~~ (had the submitted column error)

---

## Expected Result

After running and refreshing:

**Admin page will show:**
```
demo 1
18/45 correct
27 wrong • 40.0%
18.0 points

demo 2  
22/45 correct
23 wrong • 48.9%
22.0 points
```

Instead of:
```
demo 1
0/0 correct
0 wrong • 0%
0 points
```

---

## Summary

1. ✅ Run `SIMPLE-FIX-SCORES-NOW.sql` in Supabase
2. ✅ Wait for success message
3. ✅ Refresh admin page (Ctrl+Shift+R)
4. ✅ Scores will now show correctly!

**This is the corrected version that will work!**
