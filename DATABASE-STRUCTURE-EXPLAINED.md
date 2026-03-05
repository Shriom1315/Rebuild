# Database Structure Explained

## Visual Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                            │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │    profiles       │
                    │ ─────────────────│
                    │ • id (PK)        │
                    │ • email          │
                    │ • full_name      │
                    │ • role           │
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TEAM MANAGEMENT                           │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │      teams        │
                    │ ─────────────────│
                    │ • id (PK)        │
                    │ • team_name      │
                    │ • team_code      │
                    │ • status         │
                    └─────────┬─────────┘
                              │
                              │ (one-to-many)
                              │
                    ┌─────────▼─────────┐
                    │    students       │
                    │ ─────────────────│
                    │ • id (PK)        │
                    │ • team_id (FK)   │
                    │ • full_name      │
                    │ • roll_number    │
                    │ • email          │
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXAM SYSTEM                               │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │     rounds        │
                    │ ─────────────────│
                    │ • id (PK)        │
                    │ • name           │
                    │ • round_number   │
                    │ • type           │
                    │ • is_active      │
                    └─────────┬─────────┘
                              │
                              │ (one-to-many)
                              │
                    ┌─────────▼─────────┐
                    │   questions       │
                    │ ─────────────────│
                    │ • id (PK)        │
                    │ • round_id (FK)  │
                    │ • question_text  │
                    │ • options        │
                    │ • correct_answer │
                    │ • points         │
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXAM SUBMISSIONS                          │
└─────────────────────────────────────────────────────────────┘

    students + rounds + questions
              │
              │ (student takes exam)
              │
    ┌─────────▼─────────────┐
    │  student_answers      │
    │ ─────────────────────│
    │ • id (PK)            │
    │ • student_id (FK)    │
    │ • round_id (FK)      │
    │ • question_id (FK)   │
    │ • selected_answer    │
    │ • is_correct         │
    │ • is_eliminated      │
    └─────────┬─────────────┘
              │
              │ (admin calculates)
              │
    ┌─────────▼─────────────┐
    │  student_scores       │
    │ ─────────────────────│
    │ • id (PK)            │
    │ • student_id (FK)    │
    │ • round_id (FK)      │
    │ • score              │
    │ • correct_count      │
    │ • wrong_count        │
    │ • percentage         │
    │ • total_questions    │
    └──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    QUALIFICATION SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

    teams + rounds
         │
         │ (admin qualifies/eliminates)
         │
    ┌────▼──────────────────┐
    │ team_round_status     │
    │ ─────────────────────│
    │ • team_id (FK)       │
    │ • round_id (FK)      │
    │ • status             │
    │ • message            │
    │ • (PK: team+round)   │
    └──────────────────────┘
```

---

## Data Flow Examples

### Example 1: Student Takes Aptitude Exam

```
1. Student logs in
   → profiles table (authentication)
   
2. Student sees their team
   → students table (get team_id)
   → teams table (get team info)
   
3. Student starts exam
   → rounds table (get active round)
   → questions table (get questions for round)
   
4. Student answers questions
   → student_answers table (save each answer)
   
5. Admin calculates scores
   → Read: student_answers
   → Calculate: correct/wrong/percentage
   → Write: student_scores
   
6. Student sees results
   → student_scores table (display scores)
```

### Example 2: Admin Disqualifies Team

```
1. Admin clicks disqualify button
   → teams table (get team_id)
   
2. System creates elimination records
   → rounds table (get all rounds)
   → team_round_status table (insert elimination for each round)
   
3. System updates team status
   → teams table (set status = 'eliminated')
   
4. Student logs in
   → team_round_status table (check if eliminated)
   → Shows "TEAM ELIMINATED" banner
   → Blocks access to rounds
```

### Example 3: Score Calculation

```
1. Admin clicks "Calculate Scores"
   → student_answers table (get all answers for round)
   
2. For each student:
   → Count correct answers (where is_correct = true)
   → Count wrong answers (where is_correct = false)
   → Calculate percentage
   → Calculate total score
   
3. Save results
   → student_scores table (insert/update scores)
   
4. Student dashboard
   → student_scores table (fetch and display)
```

---

## Table Relationships

### Primary Relationships

```
profiles (1) ──────────── (many) students
teams (1) ─────────────── (many) students
rounds (1) ────────────── (many) questions
rounds (1) ────────────── (many) student_answers
students (1) ──────────── (many) student_answers
questions (1) ─────────── (many) student_answers
students (1) ──────────── (many) student_scores
rounds (1) ────────────── (many) student_scores
teams (many) ─────────── (many) rounds → team_round_status
```

### Foreign Key Constraints

```sql
students.team_id → teams.id
questions.round_id → rounds.id
student_answers.student_id → students.id
student_answers.round_id → rounds.id
student_answers.question_id → questions.id
student_scores.student_id → students.id
student_scores.round_id → rounds.id
team_round_status.team_id → teams.id
team_round_status.round_id → rounds.id
```

---

## Where Data is Stored

### User Information
- **Authentication:** `profiles` table
- **Student details:** `students` table
- **Team membership:** `students.team_id` → `teams.id`

### Exam Data
- **Round info:** `rounds` table
- **Questions:** `questions` table
- **Student answers:** `student_answers` table
- **Calculated scores:** `student_scores` table

### Team Status
- **Team info:** `teams` table
- **Qualification status:** `team_round_status` table
- **Elimination status:** `team_round_status` table

### NOT Stored In
- ❌ `team_scores` (unused - calculate from student_scores)
- ❌ `individual_performance` (unused - use student_scores)
- ❌ `team_members` (unused - use students table)

---

## Common Queries

### Get team with all members
```sql
SELECT 
  t.*,
  json_agg(s.*) as members
FROM teams t
LEFT JOIN students s ON s.team_id = t.id
WHERE t.id = 'team-id'
GROUP BY t.id;
```

### Get student scores for a round
```sql
SELECT 
  s.full_name,
  ss.score,
  ss.correct_count,
  ss.wrong_count,
  ss.percentage
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
WHERE ss.round_id = 'round-id'
ORDER BY ss.score DESC;
```

### Check if team is eliminated
```sql
SELECT 
  COUNT(*) as elimination_count
FROM team_round_status
WHERE team_id = 'team-id'
  AND status = 'eliminated';
```

### Get all answers for a student in a round
```sql
SELECT 
  q.question_text,
  sa.selected_answer,
  q.correct_answer,
  sa.is_correct
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.student_id = 'student-id'
  AND sa.round_id = 'round-id';
```

---

## Summary

### 8 Core Tables (All You Need)

1. **profiles** - Who can log in
2. **teams** - Team information
3. **students** - Student information + team membership
4. **rounds** - Competition rounds
5. **questions** - Exam questions
6. **student_answers** - Exam submissions
7. **student_scores** - Calculated scores
8. **team_round_status** - Team qualification/elimination

### Data Flow

```
User Login → profiles
    ↓
Team Info → teams + students
    ↓
Exam → rounds + questions
    ↓
Answers → student_answers
    ↓
Scores → student_scores
    ↓
Status → team_round_status
```

**Everything else is either unused or redundant!**
