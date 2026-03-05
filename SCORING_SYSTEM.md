# Scoring System - Complete Guide

## Overview

The scoring system manages individual student scores, calculates team totals, and handles qualification/elimination logic for each round.

## Database Tables

### 1. `student_scores`
Stores individual student scores for each round.

```sql
- id: UUID (primary key)
- student_id: UUID (references students)
- round_id: UUID (references rounds)
- score: NUMERIC (actual score achieved)
- max_score: NUMERIC (maximum possible score)
- percentage: NUMERIC (calculated percentage)
- remarks: TEXT (optional judge comments)
- evaluated_by: UUID (judge who evaluated)
- created_at: TIMESTAMPTZ
- UNIQUE(student_id, round_id)
```

### 2. `team_scores`
Aggregated team scores per round.

```sql
- id: UUID (primary key)
- team_id: UUID (references teams)
- round_id: UUID (references rounds)
- total_score: NUMERIC (sum of all team member scores)
- average_score: NUMERIC (average of team member scores)
- qualified: BOOLEAN
- created_at: TIMESTAMPTZ
- UNIQUE(team_id, round_id)
```

### 3. `team_round_status`
Tracks qualification/elimination status per round.

```sql
- id: UUID (primary key)
- team_id: UUID (references teams)
- round_id: UUID (references rounds)
- status: TEXT ('pending', 'in_progress', 'qualified', 'eliminated')
- announced: BOOLEAN (whether results are visible to students)
- message: TEXT (explanation message)
- violation_count: INT (SEB violations)
- updated_at: TIMESTAMPTZ
- UNIQUE(team_id, round_id)
```

## Admin Score Management Page

### Location
`/admin/scores` - New dedicated page for score management

### Features

#### 1. Round Selection
- Select which round to manage scores for
- Shows all rounds (Aptitude, Technical, GD, HR)

#### 2. Individual Score Entry
- View all teams and their members
- Edit individual student scores
- Set score out of max score (e.g., 85/100)
- Automatically calculates percentage
- Real-time team total calculation

#### 3. Qualification Logic
- **Top N Teams**: Specify how many teams qualify (e.g., top 10)
- **Minimum Score**: Set minimum score threshold
- **Qualify Teams Button**: Automatically:
  - Ranks teams by total score
  - Qualifies top N teams with score >= minimum
  - Eliminates remaining teams
  - Updates `team_round_status` table
  - Updates `teams.status` field

#### 4. Results Announcement
- **Announce Results Button**: Makes scores visible to students
- Sets `rounds.results_announced = true`
- Sets `team_round_status.announced = true`
- Students can then see their scores on dashboard

## Score Flow

### 1. Score Entry (Admin/Judge)
```
Admin enters score → student_scores table updated → team_scores recalculated
```

### 2. Qualification Process
```
Admin sets criteria → Clicks "Qualify Teams" → 
  → Teams ranked by total_score
  → Top N with score >= min_score marked as "qualified"
  → Others marked as "eliminated"
  → team_round_status updated
```

### 3. Results Announcement
```
Admin clicks "Announce Results" →
  → rounds.results_announced = true
  → team_round_status.announced = true
  → Students see scores on dashboard
  → Qualified/eliminated status visible
```

## Student Dashboard Integration

### Score Display
- Students see their individual scores per round
- Only visible after admin announces results
- Shows score, max score, and percentage
- Team total score displayed

### Qualification Status
- Green badge: "Qualified for Next Round"
- Red badge: "Eliminated"
- Status message from admin

### Real-time Updates
- WebSocket subscriptions on:
  - `student_scores` table
  - `team_round_status` table
  - `rounds` table
- Instant updates when admin announces results

## Judge Evaluation Integration

### GD Judge & HR Judge Pages
- Judges can enter scores during evaluation
- Scores saved to `student_scores` table
- Includes remarks field for feedback
- Shows past performance of students

## Live Lobby Monitor

### Score Visibility
- Shows team total scores
- Real-time updates as scores are entered
- Color-coded status badges
- Violation count display

## Database Functions

### `calculate_team_round_score(team_id, round_id)`
Automatically calculates and updates team scores:
- Sums all student scores for the team
- Calculates average score
- Updates `team_scores` table
- Called automatically after score entry

## Qualification Rules

### Simple Logic
1. Admin sets:
   - Number of teams to qualify (e.g., 10)
   - Minimum score threshold (e.g., 50)

2. System:
   - Ranks all teams by `total_score` (descending)
   - Filters teams with `total_score >= min_score`
   - Takes top N teams
   - Marks them as "qualified"
   - Marks rest as "eliminated"

3. Eliminated teams:
   - Cannot access future rounds
   - See elimination message
   - Status persists across all future rounds

## UI Consistency

All admin pages follow the same design:
- Dark theme with brand colors
- Shader animation background
- Consistent sidebar navigation
- Material symbols icons
- Rounded corners (2rem, 2.5rem)
- Uppercase tracking for labels
- Monospace fonts for codes/scores

## Navigation

### Admin Sidebar Links
- Teams (`/admin/teams`)
- **Scores** (`/admin/scores`) ← NEW
- Questions (`/admin/questions`)
- Live Lobby (`/admin/lobby`)

## Usage Workflow

### For Aptitude/Technical Rounds (Auto-scored)
1. Students complete exam
2. System auto-calculates scores
3. Admin reviews scores at `/admin/scores`
4. Admin sets qualification criteria
5. Admin clicks "Qualify Teams"
6. Admin clicks "Announce Results"
7. Students see scores and status

### For GD/HR Rounds (Judge-scored)
1. Judges evaluate and enter scores
2. Scores saved to `student_scores`
3. Admin reviews at `/admin/scores`
4. Admin can edit if needed
5. Admin qualifies teams
6. Admin announces results

## Key Benefits

1. **Centralized Management**: All scores in one place
2. **Flexible Editing**: Admin can adjust any score
3. **Automated Calculation**: Team totals auto-update
4. **Simple Qualification**: One-click qualification process
5. **Transparent Results**: Students see exactly what they scored
6. **Real-time Updates**: Instant visibility when announced
7. **Audit Trail**: All scores timestamped and tracked

## Security

- Only admins can access `/admin/scores`
- RLS policies protect score data
- Students can only see their own scores
- Scores only visible after announcement
- All changes logged with timestamps

## Future Enhancements

Potential additions:
- Score history/audit log
- Bulk score import (CSV)
- Score distribution charts
- Performance analytics
- Export scores to Excel
- Email notifications on results announcement
