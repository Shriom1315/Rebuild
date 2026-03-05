# Fix Score Display - 3 Simple Steps

## 🔴 Current Problem
Admin page shows: **"0/0 correct • 0 points"**

## ✅ After Fix
Admin page will show: **"18/45 correct (40%) • 27 wrong • 18.0 points"**

---

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Select your project
3. Click **"SQL Editor"** in left menu
4. Click **"New Query"**

---

## Step 2: Copy and Run SQL

1. Open file: `FIX-SCORE-DISPLAY-NOW.sql`
2. Copy ALL the content (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor (Ctrl+V)
4. Click **"Run"** button (or press Ctrl+Enter)

---

## Step 3: Refresh Your Page

1. Go back to Admin Score Management page
2. Press **Ctrl+F5** (hard refresh)
3. ✅ Scores now show correctly!

---

## What You'll See

### Before:
```
demo 1
0/0 correct
0 wrong • 0%
0 points
```

### After:
```
demo 1
18/45 correct
27 wrong • 40.0%
18.0 points
```

---

## Verification

After running SQL, you should see this output:
```
✓ correct_count exists
✓ wrong_count exists  
✓ total_questions exists
✅ COLUMNS ADDED AND SCORES UPDATED!
Refresh your admin page to see the scores
```

---

## Troubleshooting

### "Column already exists" error
✅ That's fine! It means columns were added before. Just refresh your page.

### Still showing 0/0
1. Check if SQL ran successfully (no red errors)
2. Verify students have submitted answers
3. Check `student_answers` table has data
4. Try hard refresh (Ctrl+Shift+R)

### Scores still not calculating
Run this to manually calculate:
```sql
-- Recalculate all scores
UPDATE student_scores ss
SET 
  correct_count = (SELECT COUNT(*) FROM student_answers sa WHERE sa.student_id = ss.student_id AND sa.round_id = ss.round_id AND sa.is_correct = true),
  wrong_count = (SELECT COUNT(*) FROM student_answers sa WHERE sa.student_id = ss.student_id AND sa.round_id = ss.round_id AND sa.is_correct = false),
  total_questions = (SELECT COUNT(*) FROM student_answers sa WHERE sa.student_id = ss.student_id AND sa.round_id = ss.round_id);
```

---

## That's It!

Just 3 steps:
1. ✅ Open Supabase SQL Editor
2. ✅ Run `FIX-SCORE-DISPLAY-NOW.sql`
3. ✅ Refresh admin page

**Your scores will now display correctly!** 🎉
