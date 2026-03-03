# Automatic Submission on Elimination

## Overview
When a student is eliminated due to SEB violations during the aptitude exam, their answers are now automatically submitted so their partial score can be calculated.

## Features Implemented

### 1. Auto-Submit on Elimination
When a student reaches the maximum violation threshold:
- All answered questions are automatically submitted to the database
- Answers are marked with `is_eliminated: true` flag
- Submission is recorded in localStorage to prevent re-entry
- Student is marked as having submitted the exam
- Fullscreen mode is exited

### 2. Elimination Status Tracking
The system now tracks elimination status at multiple levels:

**Database Schema Changes:**
```sql
-- Added to student_answers table
ALTER TABLE student_answers 
ADD COLUMN IF NOT EXISTS is_eliminated BOOLEAN DEFAULT FALSE;
```

**What Gets Saved:**
- `student_answers`: Individual answers with elimination flag
- `team_round_status`: Team-level violation count and elimination status
- `teams`: Overall team status updated to 'eliminated'
- `localStorage`: Backup elimination and submission flags

### 3. Performance Display with Termination Status

**Student Dashboard Updates:**
- Shows "TERMINATED" badge on eliminated rounds
- Red color scheme for terminated performance entries
- Status column shows "Terminated" if student was eliminated in any round
- Round-by-round breakdown highlights terminated rounds

**Visual Indicators:**
- 🔴 Red background for terminated round entries
- ⚠️ "TERMINATED" badge with danger icon
- Red-colored scores for eliminated rounds
- Clear distinction from active/pending status

## How It Works

### Elimination Flow

1. **Violation Detected**
   ```
   Tab Switch → Violation Count++ → Check Threshold
   ```

2. **Threshold Exceeded**
   ```
   Violations >= Max Warnings → ELIMINATION
   ```

3. **Auto-Submit Process**
   ```javascript
   // Collect all answered questions
   const submissionData = Object.entries(answers).map(([qId, val]) => ({
     student_id: currentStudent.id,
     question_id: qId,
     round_id: roundInfo.id,
     selected_answer: val,
     submitted: true,
     is_eliminated: true // Mark as eliminated
   }));
   
   // Submit to database
   await supabase
     .from('student_answers')
     .upsert(submissionData);
   ```

4. **Update Status**
   ```
   - Mark hasSubmitted = true
   - Update team_round_status
   - Update team status
   - Save to localStorage
   - Exit fullscreen
   ```

### Score Calculation

Even though eliminated, the student's score is calculated based on:
- Questions answered before elimination
- Correct answers count
- Accuracy percentage
- Time spent (if tracked)

The `is_eliminated` flag allows:
- Filtering eliminated students in reports
- Showing partial scores separately
- Tracking elimination reasons
- Audit trail for violations

## Database Queries

### Check if Student Was Eliminated
```sql
SELECT 
  sa.student_id,
  sa.round_id,
  sa.is_eliminated,
  COUNT(*) as answered_questions,
  SUM(CASE WHEN sa.selected_answer = q.correct_answer THEN 1 ELSE 0 END) as correct_answers
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.student_id = 'student-uuid'
  AND sa.round_id = 'round-uuid'
GROUP BY sa.student_id, sa.round_id, sa.is_eliminated;
```

### Get Eliminated Students by Round
```sql
SELECT DISTINCT
  s.id,
  s.full_name,
  s.email,
  sa.round_id,
  r.name as round_name,
  trs.violation_count,
  trs.message as elimination_reason
FROM students s
JOIN student_answers sa ON s.id = sa.student_id
JOIN rounds r ON sa.round_id = r.id
LEFT JOIN team_round_status trs ON s.team_id = trs.team_id AND sa.round_id = trs.round_id
WHERE sa.is_eliminated = TRUE
ORDER BY r.round_number, s.full_name;
```

### Calculate Score Including Eliminated Students
```sql
SELECT 
  s.full_name,
  COUNT(sa.id) as total_answered,
  SUM(CASE WHEN sa.selected_answer = q.correct_answer THEN q.points ELSE 0 END) as score,
  ROUND(
    100.0 * SUM(CASE WHEN sa.selected_answer = q.correct_answer THEN 1 ELSE 0 END) / COUNT(sa.id),
    2
  ) as accuracy,
  BOOL_OR(sa.is_eliminated) as was_eliminated
FROM students s
JOIN student_answers sa ON s.id = sa.student_id
JOIN questions q ON sa.question_id = q.id
WHERE sa.round_id = 'round-uuid'
GROUP BY s.id, s.full_name
ORDER BY score DESC;
```

## UI Components

### Student Dashboard - Performance Table

**Status Column Values:**
- 🟢 **Active**: Student has completed rounds without elimination
- 🔴 **Terminated**: Student was eliminated in at least one round
- ⚪ **Pending**: Student hasn't participated yet

### Round-by-Round Breakdown

**Normal Round:**
```
┌─────────────────────────────────────┐
│ Round 1: Aptitude Test              │
│ MULTIPLE_CHOICE                     │
│ Score: 45/50    Accuracy: 90%       │
└─────────────────────────────────────┘
```

**Terminated Round:**
```
┌─────────────────────────────────────┐
│ Round 1: Aptitude Test  ⚠️ TERMINATED│
│ MULTIPLE_CHOICE                     │
│ Score: 25/50    Accuracy: 50%       │
│ (Red background and borders)        │
└─────────────────────────────────────┘
```

## Benefits

### For Students
- Partial credit for work completed before elimination
- Clear feedback on termination status
- Fair scoring based on answered questions

### For Admins/Judges
- Complete audit trail of violations
- Can review partial performance
- Distinguish between eliminated and active students
- Make informed decisions about appeals

### For Teams
- Team members can see individual termination status
- Understand impact on team performance
- Identify patterns in violations

## Testing Checklist

- [ ] Trigger elimination by exceeding violation threshold
- [ ] Verify answers are auto-submitted
- [ ] Check `is_eliminated` flag is set in database
- [ ] Confirm student sees elimination screen
- [ ] Verify student cannot re-enter exam
- [ ] Check Student Dashboard shows "Terminated" status
- [ ] Verify round-by-round breakdown highlights terminated rounds
- [ ] Confirm scores are calculated correctly
- [ ] Test with multiple team members
- [ ] Verify judges can see termination status

## Future Enhancements

- [ ] Add elimination reason to performance display
- [ ] Show violation count in dashboard
- [ ] Add admin report for all eliminations
- [ ] Email notification on elimination
- [ ] Appeal system for false eliminations
- [ ] Detailed violation log viewer
- [ ] Export elimination reports
