# Score Calculation Guide

## Problem
You have student answers in `student_answers` table but no scores showing up in the system.

## Solution

### Quick Fix (Run Now)
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `FIX-SCORES-NOW.sql`
3. Click "Run"
4. Scores will be calculated and saved automatically

### What It Does
1. ✅ Marks each answer as correct/incorrect
2. ✅ Calculates individual student scores
3. ✅ Saves scores to `student_scores` table
4. ✅ Calculates team totals
5. ✅ Saves team scores to `team_scores` table
6. ✅ Updates `teams.total_score` field

### After Running
1. Go to `/admin/scores` in your app
2. You'll see all student scores
3. Click "Announce Results" to make them visible to students
4. Students will see scores on their dashboard

## How Scoring Works

### For Aptitude/Technical Rounds
```
Student Answer → Compare with Correct Answer → Award Points → Sum Total
```

Example:
- Question 1: Correct (1 point) ✓
- Question 2: Wrong (0 points) ✗
- Question 3: Correct (1 point) ✓
- Total: 2/3 points = 66.67%

### Database Flow
```
student_answers (raw answers)
    ↓
student_scores (individual scores)
    ↓
team_scores (team totals)
    ↓
teams.total_score (overall team score)
```

## Tables Explained

### `student_answers`
- Stores each student's answer to each question
- Fields: `student_id`, `question_id`, `selected_answer`, `is_correct`

### `student_scores`
- Stores calculated scores per student per round
- Fields: `student_id`, `round_id`, `score`, `max_score`, `percentage`

### `team_scores`
- Stores aggregated team scores per round
- Fields: `team_id`, `round_id`, `total_score`, `average_score`

### `teams`
- Has `total_score` field for overall team performance

## Automatic Calculation (Future)

The `auto-calculate-scores-trigger.sql` file sets up automatic calculation:
- Triggers when student submits answers
- Automatically calculates and saves scores
- No manual intervention needed

To enable:
1. Run `auto-calculate-scores-trigger.sql` in Supabase
2. Future submissions will auto-calculate

## Manual Calculation (Anytime)

If you need to recalculate scores:

```sql
-- For Round 1 (Aptitude)
SELECT save_aptitude_scores((SELECT id FROM rounds WHERE round_number = 1));

-- For any specific round
SELECT save_aptitude_scores('YOUR-ROUND-ID-HERE');
```

## Verification Queries

### Check if scores exist
```sql
SELECT COUNT(*) FROM student_scores 
WHERE round_id = (SELECT id FROM rounds WHERE round_number = 1);
```

### View all scores
```sql
SELECT 
  t.team_name,
  s.full_name,
  ss.score,
  ss.max_score,
  ss.percentage
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE ss.round_id = (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ss.score DESC;
```

### View team totals
```sql
SELECT 
  t.team_name,
  ts.total_score,
  ts.average_score
FROM team_scores ts
JOIN teams t ON ts.team_id = t.id
WHERE ts.round_id = (SELECT id FROM rounds WHERE round_number = 1)
ORDER BY ts.total_score DESC;
```

## Troubleshooting

### No scores showing up?
1. Check if `student_answers` has data:
   ```sql
   SELECT COUNT(*) FROM student_answers;
   ```

2. Check if `questions` has correct answers:
   ```sql
   SELECT id, question_text, correct_answer FROM questions LIMIT 5;
   ```

3. Run the fix script: `FIX-SCORES-NOW.sql`

### Scores are wrong?
1. Verify correct answers in `questions` table
2. Re-run calculation:
   ```sql
   SELECT save_aptitude_scores((SELECT id FROM rounds WHERE round_number = 1));
   ```

### Team totals not updating?
```sql
SELECT calculate_team_scores_for_round((SELECT id FROM rounds WHERE round_number = 1));
```

## Admin Interface

### Score Management Page (`/admin/scores`)
- View all student scores
- Edit individual scores
- Set qualification criteria
- Announce results to students

### Features
- ✅ Edit any student's score
- ✅ Auto-calculate team totals
- ✅ Qualify top N teams
- ✅ Set minimum score threshold
- ✅ Announce results (make visible to students)

## Student View

### Before Results Announced
- Students see "Results pending"
- No scores visible

### After Results Announced
- Individual scores displayed
- Team total shown
- Qualification status (Qualified/Eliminated)
- Real-time updates via WebSocket

## Files Reference

1. **FIX-SCORES-NOW.sql** - Quick fix for existing data
2. **calculate-aptitude-scores.sql** - Detailed scoring functions
3. **auto-calculate-scores-trigger.sql** - Automatic calculation setup
4. **SCORING_SYSTEM.md** - Complete system documentation

## Quick Commands

```sql
-- Fix everything now
\i FIX-SCORES-NOW.sql

-- View scores
SELECT * FROM student_scores;

-- View team totals
SELECT * FROM team_scores;

-- Recalculate Round 1
SELECT save_aptitude_scores((SELECT id FROM rounds WHERE round_number = 1));
```

## Support

If scores still don't show:
1. Check browser console for errors
2. Verify Supabase RLS policies allow reading `student_scores`
3. Ensure `rounds.results_announced = true` for students to see scores
4. Check that student is logged in with correct team
