# 🔧 Troubleshooting Guide

## Error: "record 'new' has no field 'updated_at'"

**Cause:** The `teams` table doesn't have an `updated_at` column.

**Solution:** Use `ULTRA-SIMPLE-FIX.sql` instead of `FIX-SCORES-NOW.sql`

---

## Error: Function doesn't exist

**Cause:** Trying to call a function that hasn't been created yet.

**Solution:** Use `ULTRA-SIMPLE-FIX.sql` - it doesn't use any functions.

---

## No scores showing in admin panel

**Checklist:**
1. ✅ Run `ULTRA-SIMPLE-FIX.sql` in Supabase
2. ✅ Check if `student_scores` table has data:
   ```sql
   SELECT COUNT(*) FROM student_scores;
   ```
3. ✅ Go to `/admin/scores` in your app
4. ✅ Select the correct round
5. ✅ Click "Refresh Data" button

---

## Students can't see scores

**Checklist:**
1. ✅ Scores must be calculated first (run `ULTRA-SIMPLE-FIX.sql`)
2. ✅ Admin must announce results:
   - Go to `/admin/scores`
   - Click "Announce Results" button
3. ✅ Check if `rounds.results_announced = true`:
   ```sql
   SELECT results_announced FROM rounds WHERE round_number = 1;
   ```

---

## Team totals are wrong

**Solution:**
```sql
-- Recalculate team scores
DELETE FROM team_scores WHERE round_id IN (SELECT id FROM rounds WHERE round_number = 1);

INSERT INTO team_scores (team_id, round_id, total_score, average_score)
SELECT 
  s.team_id,
  ss.round_id,
  SUM(ss.score) as total_score,
  AVG(ss.score) as average_score
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id IN (SELECT id FROM rounds WHERE round_number = 1)
GROUP BY s.team_id, ss.round_id;
```

---

## Individual score is wrong

**Solution:**
1. Go to `/admin/scores`
2. Find the student
3. Click the edit icon (pencil)
4. Enter correct score
5. Click "Save"

---

## Scores not updating in real-time

**Checklist:**
1. ✅ Check browser console for errors (F12)
2. ✅ Verify WebSocket connection is active
3. ✅ Refresh the page (Ctrl+R or Cmd+R)
4. ✅ Clear browser cache

---

## "Round 1 not found" error

**Solution:**
```sql
-- Check if rounds exist
SELECT * FROM rounds;

-- If no rounds, insert them
INSERT INTO rounds (round_number, name, type, description, duration_minutes) VALUES
  (1, 'Aptitude Test', 'aptitude', 'Multiple choice aptitude test', 30),
  (2, 'Technical Round', 'technical', 'Technical coding challenges', 45),
  (3, 'Group Discussion', 'gd', 'Group discussion evaluation', 20),
  (4, 'HR Interview', 'hr', 'Final HR interview', 15)
ON CONFLICT (round_number) DO NOTHING;
```

---

## No student answers in database

**Cause:** Students haven't taken the exam yet, or answers weren't saved.

**Check:**
```sql
SELECT COUNT(*) FROM student_answers;
```

**If 0:** Students need to take the exam first.

---

## Questions have no correct answers

**Check:**
```sql
SELECT id, question_text, correct_answer FROM questions LIMIT 5;
```

**If `correct_answer` is NULL:** You need to set correct answers:
```sql
UPDATE questions 
SET correct_answer = 'a'  -- or 'b', 'c', 'd'
WHERE id = 'question-id-here';
```

---

## Permission denied errors

**Cause:** RLS (Row Level Security) policies blocking access.

**Solution:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('student_scores', 'team_scores');

-- If needed, create policies for anon access
CREATE POLICY "anon_student_scores_select" 
ON student_scores FOR SELECT TO anon USING (true);

CREATE POLICY "anon_team_scores_select" 
ON team_scores FOR SELECT TO anon USING (true);
```

---

## Admin panel shows "Loading..." forever

**Checklist:**
1. ✅ Check browser console (F12) for errors
2. ✅ Verify Supabase connection in `.env`:
   ```
   REACT_APP_SUPABASE_URL=your-url
   REACT_APP_SUPABASE_ANON_KEY=your-key
   ```
3. ✅ Check if admin is logged in
4. ✅ Verify admin role in database:
   ```sql
   SELECT email, role FROM profiles WHERE role = 'admin';
   ```

---

## Qualification not working

**Checklist:**
1. ✅ Scores must be calculated first
2. ✅ Team scores must exist in `team_scores` table
3. ✅ Set "Top N Teams" and "Min Score" values
4. ✅ Click "Qualify Teams" button
5. ✅ Check `team_round_status` table:
   ```sql
   SELECT * FROM team_round_status;
   ```

---

## Quick Diagnostic Query

Run this to see the current state:

```sql
-- Check everything at once
SELECT 
  'Rounds' as table_name,
  COUNT(*)::TEXT as count
FROM rounds
UNION ALL
SELECT 'Questions', COUNT(*)::TEXT FROM questions
UNION ALL
SELECT 'Student Answers', COUNT(*)::TEXT FROM student_answers
UNION ALL
SELECT 'Student Scores', COUNT(*)::TEXT FROM student_scores
UNION ALL
SELECT 'Team Scores', COUNT(*)::TEXT FROM team_scores;
```

---

## Still Having Issues?

1. **Run the diagnostic:**
   ```sql
   -- Copy from check-score-status.sql
   ```

2. **Use the simplest fix:**
   ```sql
   -- Copy from ULTRA-SIMPLE-FIX.sql
   ```

3. **Check the logs:**
   - Browser console (F12)
   - Supabase logs
   - Network tab for API errors

4. **Verify data:**
   ```sql
   -- Check if data exists
   SELECT 
     (SELECT COUNT(*) FROM student_answers) as answers,
     (SELECT COUNT(*) FROM student_scores) as scores,
     (SELECT COUNT(*) FROM team_scores) as team_scores;
   ```

---

## Common Mistakes

❌ **Running wrong SQL file** → Use `ULTRA-SIMPLE-FIX.sql`

❌ **Not announcing results** → Click "Announce Results" in admin panel

❌ **Wrong round selected** → Make sure Round 1 (Aptitude) is selected

❌ **No questions in database** → Add questions first

❌ **Students not in teams** → Assign students to teams

❌ **Admin not logged in** → Login at `/login` first

---

## Success Checklist

- [ ] Ran `ULTRA-SIMPLE-FIX.sql` successfully
- [ ] `student_scores` table has data
- [ ] `team_scores` table has data
- [ ] Admin can see scores at `/admin/scores`
- [ ] Clicked "Announce Results"
- [ ] Students can see scores on dashboard
- [ ] Team totals are correct
- [ ] Qualification works

---

**If all else fails:** Delete all scores and start fresh with `ULTRA-SIMPLE-FIX.sql`
