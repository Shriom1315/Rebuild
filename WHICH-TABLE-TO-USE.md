# Quick Reference: Which Table to Use?

## Common Questions

### "Where do I store student information?"
✅ **Use:** `students` table
- Columns: id, team_id, full_name, roll_number, email
- Links to team via `team_id`

❌ **Don't use:** `team_members` (unused/redundant)

---

### "Where do I store exam scores?"
✅ **Use:** `student_scores` table
- Columns: student_id, round_id, score, correct_count, wrong_count, percentage
- One record per student per round

❌ **Don't use:** 
- `team_scores` (unused - calculate from student_scores)
- `individual_performance` (old table, replaced by student_scores)

---

### "Where do I store exam answers?"
✅ **Use:** `student_answers` table
- Columns: student_id, round_id, question_id, selected_answer, is_correct
- One record per question per student

❌ **Don't use:** `user_answers` (old table)

---

### "Where do I check if a team is eliminated?"
✅ **Use:** `team_round_status` table
- Columns: team_id, round_id, status, message
- Check if `status = 'eliminated'`

❌ **Don't use:** `team_round_eligibility` (unused)

---

### "Where do I get team information?"
✅ **Use:** `teams` table
- Columns: id, team_name, team_code, status
- Get members via JOIN with `students` table

---

### "Where do I get round information?"
✅ **Use:** `rounds` table
- Columns: id, name, round_number, type, is_active, results_announced
- Get questions via JOIN with `questions` table

---

### "Where do I store questions?"
✅ **Use:** `questions` table
- Columns: id, round_id, question_text, options, correct_answer, points
- Links to round via `round_id`

---

### "Where do I check user authentication?"
✅ **Use:** `profiles` table
- Columns: id, email, full_name, role
- Managed by Supabase Auth

---

## Quick Decision Tree

```
Need to store/get data?
    │
    ├─ User info? → profiles
    │
    ├─ Team info? → teams
    │
    ├─ Student info? → students
    │
    ├─ Round info? → rounds
    │
    ├─ Questions? → questions
    │
    ├─ Exam answers? → student_answers
    │
    ├─ Scores? → student_scores
    │
    └─ Team status? → team_round_status
```

---

## Tables to IGNORE

These tables exist but are NOT used by the application:

❌ `team_scores` - Redundant (calculate from student_scores)
❌ `individual_performance` - Old/replaced
❌ `team_members` - Redundant (use students table)
❌ `team_round_eligibility` - Redundant (use team_round_status)
❌ `user_answers` - Old/replaced

---

## Example Queries

### Get team with members
```sql
SELECT t.*, s.full_name, s.roll_number
FROM teams t
LEFT JOIN students s ON s.team_id = t.id
WHERE t.id = 'your-team-id';
```

### Get student scores
```sql
SELECT * FROM student_scores
WHERE student_id = 'your-student-id'
  AND round_id = 'your-round-id';
```

### Check team elimination
```sql
SELECT * FROM team_round_status
WHERE team_id = 'your-team-id'
  AND status = 'eliminated';
```

### Get exam questions
```sql
SELECT * FROM questions
WHERE round_id = 'your-round-id'
ORDER BY id;
```

### Get student answers
```sql
SELECT * FROM student_answers
WHERE student_id = 'your-student-id'
  AND round_id = 'your-round-id';
```

---

## Summary

**8 tables you need to know:**
1. profiles
2. teams
3. students
4. rounds
5. questions
6. student_answers
7. student_scores
8. team_round_status

**Everything else = ignore or delete!**
