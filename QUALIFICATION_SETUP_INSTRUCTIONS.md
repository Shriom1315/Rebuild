# Qualification System - Setup Instructions

## ✅ What Has Been Implemented

The qualification system is now fully integrated into your RecruitSim application. Here's what's ready:

### 1. Database Schema
- `round_qualifications` - Stores qualification criteria per round
- `team_round_eligibility` - Tracks which teams can access which rounds
- `individual_performance` - Tracks individual student performance metrics

### 2. Backend Services
- `qualificationService.js` - Complete API for managing qualifications
- Database functions for automatic qualification
- Performance calculation functions

### 3. Admin Interface
- New page: `/admin/qualifications`
- Set minimum scores and max teams per round
- Run automatic qualification
- Manual override capabilities
- View eligible teams

### 4. Student Dashboard
- New dashboard with qualification-aware round display
- Three tabs: Rounds, My Performance, Team Performance
- Only shows accessible rounds to students
- Real-time eligibility status

## 🚀 Setup Steps

### Step 1: Run the Database Schema

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of `supabase-qualification-system.sql`
4. Paste and run it in the SQL Editor

This will create:
- All necessary tables
- Row Level Security policies
- Helper functions for qualification

### Step 2: Verify the Routes

The routes are already configured in `src/App.js`:

```javascript
// Admin route for qualification management
<Route path="/admin/qualifications" element={...} />

// Student dashboard now uses StudentDashboardNew.js
<Route path="/student/dashboard" element={...} />
```

### Step 3: Test the System

#### As Admin:

1. Login as admin
2. Navigate to `/admin/qualifications`
3. Select a round (e.g., Round 2)
4. Set qualification criteria:
   - Minimum Score: 70
   - Max Teams: 10 (optional)
5. Click "Save Criteria"
6. After Round 1 ends, click "Run Qualification"
7. View the list of qualified teams

#### As Student:

1. Login as a student
2. Go to `/student/dashboard`
3. You'll see three tabs:
   - **Rounds**: Shows all rounds with eligibility status
   - **My Performance**: Your individual scores
   - **Team Performance**: All team members' scores
4. Only qualified rounds show "Enter Round" button
5. Locked rounds show "Not qualified" or "Locked" status

## 📋 How It Works

### Qualification Flow

1. **Admin sets criteria** for Round 2:
   ```
   Minimum Score: 70 points
   Max Teams: 15 teams
   ```

2. **Students complete Round 1**:
   - System calculates individual scores
   - Scores are stored in `individual_performance`
   - Team scores are aggregated in `team_scores`

3. **Admin runs qualification**:
   - System checks all teams' Round 1 scores
   - Teams with score >= 70 are marked as eligible
   - Only top 15 teams qualify (if max_teams is set)
   - Results stored in `team_round_eligibility`

4. **Students see results**:
   - Qualified students see Round 2 with green "Qualified ✓" badge
   - Can click "Enter Round" to access Round 2
   - Non-qualified students see red "Not qualified" badge
   - Round 2 is locked for them

### Automatic vs Manual Qualification

**Automatic (Recommended)**:
```javascript
// Admin clicks "Run Qualification" button
// System automatically qualifies based on criteria
```

**Manual Override**:
```javascript
// Admin can manually qualify/disqualify specific teams
await qualificationService.setTeamEligibility(
  teamId,
  roundId,
  true, // or false
  'Manual override by admin'
);
```

## 🎯 Key Features

### For Students

✅ **Round Visibility**
- Only see rounds they're qualified for
- Clear status indicators (Qualified, Not Qualified, Locked)
- Can't access locked rounds

✅ **Performance Tracking**
- View individual scores per round
- See team members' performance
- Track accuracy and correct answers

✅ **Real-time Updates**
- Dashboard updates when qualification status changes
- No page refresh needed

### For Admins

✅ **Flexible Criteria**
- Set minimum score requirements
- Optional maximum team limits
- Different criteria per round

✅ **Automatic Qualification**
- One-click qualification based on previous round
- Handles scoring and ranking automatically
- Provides detailed qualification reasons

✅ **Manual Control**
- Override automatic decisions
- Manually qualify/disqualify teams
- View qualification statistics

## 🔧 API Reference

### Key Service Methods

```javascript
// Set qualification criteria
await qualificationService.setRoundQualification(roundId, {
  minScore: 70,
  maxTeams: 10,
  type: 'score'
});

// Run automatic qualification
const results = await qualificationService.qualifyTeamsForNextRound(
  currentRoundId,
  nextRoundId
);

// Check team eligibility
const isEligible = await qualificationService.checkTeamEligibility(
  teamId,
  roundId
);

// Get individual performance
const performance = await qualificationService.getIndividualPerformance(
  userId,
  roundId
);

// Get team performance
const teamPerf = await qualificationService.getTeamPerformance(
  teamId,
  roundId
);
```

## 📊 Database Tables

### round_qualifications
```sql
- id: UUID
- round_id: UUID (FK to rounds)
- min_score: INTEGER
- max_teams: INTEGER (optional)
- qualification_type: TEXT
- criteria: JSONB
```

### team_round_eligibility
```sql
- id: UUID
- team_id: UUID (FK to teams)
- round_id: UUID (FK to rounds)
- is_eligible: BOOLEAN
- qualified_at: TIMESTAMP
- qualification_reason: TEXT
```

### individual_performance
```sql
- id: UUID
- user_id: UUID (FK to profiles)
- round_id: UUID (FK to rounds)
- team_id: UUID (FK to teams)
- score: INTEGER
- metrics: JSONB (accuracy, correct_answers, etc.)
```

## 🎨 UI Components

### Student Dashboard Tabs

1. **Overview (Rounds)**
   - Shows all rounds with eligibility status
   - Current active round highlighted
   - "Enter Round" button for accessible rounds
   - Lock icon for inaccessible rounds

2. **Individual Performance**
   - Personal scores per round
   - Accuracy percentage
   - Correct answers count
   - Total questions attempted

3. **Team Performance**
   - All team members' scores
   - Grouped by round
   - Individual metrics for each member

### Admin Qualification Page

1. **Round Selection**
   - List of all rounds
   - Click to select and manage

2. **Criteria Form**
   - Minimum score input
   - Maximum teams input (optional)
   - Save button

3. **Qualification Actions**
   - "Run Qualification" button
   - Automatic qualification based on criteria

4. **Eligible Teams List**
   - Shows all qualified teams
   - Team name, code, and score
   - Manual toggle button for override

## 🔒 Security

All tables have Row Level Security (RLS) enabled:

- **Qualifications**: Viewable by all, manageable by admins only
- **Eligibility**: Viewable by all, manageable by admins only
- **Performance**: 
  - Users can view own performance
  - Team members can view team performance
  - Admins/judges can view all

## 🐛 Troubleshooting

### Teams Not Qualifying

**Check:**
1. Has the previous round ended?
2. Have team scores been calculated?
3. Are qualification criteria set correctly?
4. Is min_score too high?

**Solution:**
```sql
-- Check team scores
SELECT * FROM team_scores WHERE round_id = 'round-1-id';

-- Check qualification criteria
SELECT * FROM round_qualifications WHERE round_id = 'round-2-id';
```

### Students Can't See Rounds

**Check:**
1. Is the round marked as active?
2. Has qualification been run?
3. Check team_round_eligibility table

**Solution:**
```sql
-- Check eligibility
SELECT * FROM team_round_eligibility 
WHERE team_id = 'team-id' AND round_id = 'round-id';
```

### Performance Not Showing

**Check:**
1. Have students submitted answers?
2. Has performance calculation been triggered?

**Solution:**
```sql
-- Manually calculate performance
SELECT calculate_individual_performance('user-id', 'round-id');
```

## 📝 Best Practices

1. **Set Criteria Early**
   - Set qualification criteria before the round starts
   - Communicate criteria to students

2. **Run Qualification Immediately**
   - Run qualification as soon as a round ends
   - Give students immediate feedback

3. **Use Reasonable Thresholds**
   - Set minimum scores that are challenging but achievable
   - Typically 60-80% of max score

4. **Monitor Eligibility**
   - Check qualification results after running
   - Use manual override if needed

5. **Test Before Production**
   - Test the qualification flow with sample data
   - Verify all students can see their status

## 🎉 Next Steps

1. Run the database schema in Supabase
2. Test admin qualification management
3. Test student dashboard with different eligibility statuses
4. Set up qualification criteria for your first round
5. Monitor the system during actual rounds

## 📚 Additional Documentation

- `QUALIFICATION_SYSTEM.md` - Detailed system documentation
- `API_REFERENCE.md` - Complete API reference
- `SUPABASE_SETUP.md` - Database setup guide

## 💡 Tips

- Start with simple criteria (just minimum score)
- Add max_teams limit for competitive rounds
- Use manual override sparingly
- Monitor performance metrics to adjust criteria
- Communicate qualification status to students clearly

---

**Need Help?** Check the troubleshooting section or review the detailed documentation files.
