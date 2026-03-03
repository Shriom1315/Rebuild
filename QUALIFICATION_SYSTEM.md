# Qualification System Documentation

## Overview

The RecruitSim Qualification System allows admins to set criteria for each round and automatically qualify teams based on their performance in previous rounds. Only qualified teams can see and access subsequent rounds.

## Features

### 1. **Round-Based Qualification**
- Admins set minimum score requirements for each round
- Optional maximum team limits
- Automatic qualification based on previous round performance
- Manual override capabilities

### 2. **Student Visibility**
- Students only see rounds they're qualified for
- Clear status indicators (Qualified, Not Qualified, Locked)
- Real-time eligibility updates

### 3. **Performance Tracking**
- Individual performance metrics per round
- Team performance aggregation
- Detailed analytics (accuracy, correct answers, time taken)

### 4. **Admin Control**
- Set qualification criteria per round
- Run automatic qualification
- Manual team eligibility override
- View qualification statistics

## Database Schema

### New Tables

#### `round_qualifications`
Stores qualification criteria for each round.

```sql
- id: UUID (Primary Key)
- round_id: UUID (Foreign Key to rounds)
- min_score: INTEGER (Minimum score required)
- max_teams: INTEGER (Optional max teams limit)
- qualification_type: TEXT (score, percentage, rank)
- criteria: JSONB (Additional criteria)
```

#### `team_round_eligibility`
Tracks which teams are eligible for which rounds.

```sql
- id: UUID (Primary Key)
- team_id: UUID (Foreign Key to teams)
- round_id: UUID (Foreign Key to rounds)
- is_eligible: BOOLEAN
- qualified_at: TIMESTAMP
- qualification_reason: TEXT
```

#### `individual_performance`
Tracks individual student performance per round.

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to profiles)
- round_id: UUID (Foreign Key to rounds)
- team_id: UUID (Foreign Key to teams)
- score: INTEGER
- metrics: JSONB (accuracy, time_taken, etc.)
```

## Setup Instructions

### Step 1: Run the Qualification System Schema

In Supabase SQL Editor, run:
```bash
supabase-qualification-system.sql
```

This creates:
- New tables for qualification management
- Row Level Security policies
- Helper functions for automatic qualification
- Performance calculation functions

### Step 2: Import Services

The qualification service is already created at:
```
src/services/qualificationService.js
```

### Step 3: Update Routes

Add the admin qualification management route to `App.js`:

```javascript
import AdminQualificationManagement from './pages/AdminQualificationManagement';

// In routes:
<Route 
  path="/admin/qualifications" 
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminQualificationManagement />
    </ProtectedRoute>
  } 
/>
```

### Step 4: Replace Student Dashboard

Replace the old StudentDashboard with the new one:

```bash
# Backup old file
mv src/pages/StudentDashboard.js src/pages/StudentDashboard.old.js

# Use new file
mv src/pages/StudentDashboardNew.js src/pages/StudentDashboard.js
```

## Usage Guide

### For Admins

#### 1. Set Qualification Criteria

```javascript
// Navigate to /admin/qualifications
// Select a round
// Set minimum score (e.g., 70)
// Optionally set max teams (e.g., 10)
// Click "Save Criteria"
```

#### 2. Run Qualification

After a round ends:
1. Go to Qualification Management
2. Select the NEXT round
3. Click "Run Qualification"
4. System automatically qualifies teams based on previous round scores

#### 3. Manual Override

To manually qualify/disqualify a team:
```javascript
await qualificationService.setTeamEligibility(
  teamId,
  roundId,
  true, // or false to disqualify
  'Manual override by admin'
);
```

### For Students

#### 1. View Available Rounds

Students see:
- ✅ **Qualified rounds** - Green badge, can access
- ❌ **Not qualified** - Red badge, locked
- 🔒 **Locked** - Gray badge, not yet available

#### 2. Access Rounds

Only qualified rounds show "Enter Round" button.

#### 3. View Performance

Three tabs available:
- **Rounds**: Overview of all rounds and eligibility
- **My Performance**: Individual scores and metrics
- **Team Performance**: All team members' performance

## API Reference

### Qualification Service Methods

#### `setRoundQualification(roundId, criteria)`
Set qualification criteria for a round.

```javascript
await qualificationService.setRoundQualification(roundId, {
  minScore: 70,
  maxTeams: 10,
  type: 'score'
});
```

#### `qualifyTeamsForNextRound(currentRoundId, nextRoundId)`
Automatically qualify teams based on previous round.

```javascript
const results = await qualificationService.qualifyTeamsForNextRound(
  'round-1-id',
  'round-2-id'
);
// Returns: [{ team_id, qualified, reason }, ...]
```

#### `checkTeamEligibility(teamId, roundId)`
Check if a team is eligible for a round.

```javascript
const isEligible = await qualificationService.checkTeamEligibility(
  teamId,
  roundId
);
// Returns: true or false
```

#### `getIndividualPerformance(userId, roundId?)`
Get individual performance data.

```javascript
const performance = await qualificationService.getIndividualPerformance(
  userId,
  roundId // optional
);
```

#### `getTeamPerformance(teamId, roundId?)`
Get team performance data.

```javascript
const teamPerf = await qualificationService.getTeamPerformance(
  teamId,
  roundId // optional
);
```

## Workflow Example

### Complete Round Flow

1. **Admin creates Round 1**
   - No qualification needed (first round)
   - All teams can participate

2. **Students complete Round 1**
   - System calculates individual scores
   - Team scores are aggregated

3. **Admin sets Round 2 criteria**
   ```javascript
   // Minimum score: 70
   // Max teams: 15
   ```

4. **Admin runs qualification**
   - System checks all teams' Round 1 scores
   - Teams with score >= 70 are qualified
   - Only top 15 teams qualify (if max_teams set)

5. **Students see results**
   - Qualified students see Round 2 as accessible
   - Non-qualified students see "Not qualified" message

6. **Repeat for subsequent rounds**

## Database Functions

### `qualify_teams_for_next_round()`

Automatically qualifies teams based on criteria.

**Logic:**
1. Get qualification criteria for next round
2. Get all team scores from current round
3. Sort teams by score (descending)
4. Check each team against min_score
5. Apply max_teams limit if set
6. Insert eligibility records

### `calculate_individual_performance()`

Calculates and stores individual performance.

**Calculates:**
- Total score from correct answers
- Number of correct answers
- Total questions attempted
- Accuracy percentage
- Additional metrics from JSONB

### `check_team_qualification()`

Quick check if team is eligible for a round.

**Returns:** Boolean

## Security

### Row Level Security Policies

- **Qualifications**: Viewable by all, manageable by admins only
- **Eligibility**: Viewable by all, manageable by admins only
- **Performance**: 
  - Users can view own performance
  - Team members can view team performance
  - Admins/judges can view all

## Best Practices

### 1. Set Criteria Before Round Ends
Set qualification criteria for the next round before the current round ends.

### 2. Run Qualification Immediately
Run qualification as soon as a round ends to give students immediate feedback.

### 3. Use Reasonable Thresholds
Set minimum scores that are challenging but achievable (typically 60-80% of max score).

### 4. Consider Max Teams
Use max_teams to create competitive pressure and manage round sizes.

### 5. Provide Clear Feedback
The system automatically provides qualification reasons - review these for clarity.

## Troubleshooting

### Teams Not Qualifying

**Check:**
1. Has the previous round ended?
2. Have team scores been calculated?
3. Are qualification criteria set correctly?
4. Is min_score too high?

### Students Can't See Rounds

**Check:**
1. Is the round marked as active?
2. Has qualification been run?
3. Check team_round_eligibility table
4. Verify RLS policies are correct

### Performance Not Showing

**Check:**
1. Have students submitted answers?
2. Has `calculate_individual_performance()` been called?
3. Check individual_performance table
4. Verify user is in a team

## Future Enhancements

Potential additions:
- Percentage-based qualification (top X%)
- Rank-based qualification (top N teams)
- Multiple criteria (score AND attendance)
- Weighted scoring across rounds
- Appeal system for disqualified teams
- Automatic notifications on qualification status

## Support

For issues or questions:
1. Check this documentation
2. Review `API_REFERENCE.md`
3. Check Supabase logs for errors
4. Verify database schema is correct
