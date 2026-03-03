# Quick Reference - Qualification System

## 🚀 Quick Start (3 Steps)

### 1. Run Database Schema
```bash
# In Supabase SQL Editor
supabase-qualification-system.sql
```

### 2. Access Admin Interface
```bash
# Login as admin, navigate to:
/admin/qualifications
```

### 3. Set Criteria & Qualify
```
1. Select round
2. Set min score (e.g., 70)
3. Set max teams (optional)
4. Click "Save Criteria"
5. Click "Run Qualification"
```

## 📋 Common Tasks

### As Admin

#### Set Qualification Criteria
```javascript
await qualificationService.setRoundQualification(roundId, {
  minScore: 70,
  maxTeams: 10,
  type: 'score'
});
```

#### Run Automatic Qualification
```javascript
const results = await qualificationService.qualifyTeamsForNextRound(
  currentRoundId,
  nextRoundId
);
```

#### Manually Qualify a Team
```javascript
await qualificationService.setTeamEligibility(
  teamId,
  roundId,
  true,
  'Manual qualification by admin'
);
```

#### Get Eligible Teams
```javascript
const teams = await qualificationService.getEligibleTeams(roundId);
```

### As Student

#### Check Eligibility
```javascript
const isEligible = await qualificationService.checkTeamEligibility(
  teamId,
  roundId
);
```

#### Get My Performance
```javascript
const performance = await qualificationService.getIndividualPerformance(
  userId,
  roundId
);
```

#### Get Team Performance
```javascript
const teamPerf = await qualificationService.getTeamPerformance(
  teamId,
  roundId
);
```

## 🗂️ Database Tables

### round_qualifications
```sql
-- Stores qualification criteria
SELECT * FROM round_qualifications WHERE round_id = 'round-id';
```

### team_round_eligibility
```sql
-- Check team eligibility
SELECT * FROM team_round_eligibility 
WHERE team_id = 'team-id' AND round_id = 'round-id';
```

### individual_performance
```sql
-- View performance data
SELECT * FROM individual_performance WHERE user_id = 'user-id';
```

## 🔧 Useful SQL Queries

### Check Qualification Criteria
```sql
SELECT r.name, rq.min_score, rq.max_teams
FROM round_qualifications rq
JOIN rounds r ON r.id = rq.round_id;
```

### View All Eligible Teams for a Round
```sql
SELECT t.name, t.code, tre.is_eligible, tre.qualification_reason
FROM team_round_eligibility tre
JOIN teams t ON t.id = tre.team_id
WHERE tre.round_id = 'round-id'
ORDER BY tre.is_eligible DESC;
```

### Get Team Scores
```sql
SELECT t.name, ts.score, r.name as round_name
FROM team_scores ts
JOIN teams t ON t.id = ts.team_id
JOIN rounds r ON r.id = ts.round_id
ORDER BY ts.score DESC;
```

### Calculate Performance Manually
```sql
SELECT calculate_individual_performance('user-id', 'round-id');
```

### Run Qualification Manually
```sql
SELECT * FROM qualify_teams_for_next_round('round-1-id', 'round-2-id');
```

## 🎯 Routes

### Admin Routes
```
/admin/qualifications     - Manage qualifications
/admin/teams             - Manage teams
/admin/lobby             - Live monitor
/admin/questions         - Manage questions
```

### Student Routes
```
/student/dashboard       - Main dashboard (with qualification)
/student/team           - Team management
/student/exam/aptitude  - Aptitude test
/student/exam/coding    - Coding test
```

## 🐛 Troubleshooting

### Teams Not Qualifying
```sql
-- Check team scores exist
SELECT * FROM team_scores WHERE round_id = 'round-1-id';

-- Check criteria is set
SELECT * FROM round_qualifications WHERE round_id = 'round-2-id';

-- Manually run qualification
SELECT * FROM qualify_teams_for_next_round('round-1-id', 'round-2-id');
```

### Student Can't See Rounds
```sql
-- Check eligibility
SELECT * FROM team_round_eligibility 
WHERE team_id = 'team-id';

-- Check round is active
SELECT * FROM rounds WHERE is_active = true;
```

### Performance Not Showing
```sql
-- Check answers exist
SELECT * FROM user_answers WHERE user_id = 'user-id';

-- Manually calculate
SELECT calculate_individual_performance('user-id', 'round-id');

-- Check performance table
SELECT * FROM individual_performance WHERE user_id = 'user-id';
```

## 📊 Status Indicators

### Student Dashboard
- 🟢 **Qualified ✓** - Can access round
- 🔴 **Not qualified** - Cannot access round
- ⚪ **Locked** - Not yet available

### Admin View
- ✅ **Eligible** - Team qualified
- ❌ **Not Eligible** - Team disqualified
- ⏳ **Pending** - Qualification not run

## 🔐 Permissions

### Admin Can:
- ✅ Set qualification criteria
- ✅ Run qualification
- ✅ View all teams
- ✅ Manually override eligibility
- ✅ View all performance data

### Student Can:
- ✅ View own eligibility
- ✅ View own performance
- ✅ View team performance
- ✅ Access qualified rounds
- ❌ Cannot access locked rounds
- ❌ Cannot modify eligibility

## 📁 Key Files

```
src/
├── pages/
│   ├── AdminQualificationManagement.js  - Admin UI
│   └── StudentDashboardNew.js           - Student UI
├── services/
│   └── qualificationService.js          - API methods
└── App.js                               - Routes

Database:
└── supabase-qualification-system.sql    - Schema

Docs:
├── QUALIFICATION_SYSTEM.md              - Full docs
├── QUALIFICATION_SETUP_INSTRUCTIONS.md  - Setup guide
├── TESTING_QUALIFICATION_SYSTEM.md      - Testing guide
└── QUICK_REFERENCE.md                   - This file
```

## 💡 Best Practices

1. **Set criteria before round starts**
2. **Run qualification immediately after round ends**
3. **Use reasonable thresholds (60-80% of max score)**
4. **Test with sample data first**
5. **Monitor first qualification run closely**
6. **Communicate criteria to students upfront**
7. **Use manual override sparingly**

## 🎓 Typical Workflow

```
1. Admin creates Round 1 & 2
2. Admin sets Round 2 criteria (min: 70, max: 15)
3. Students complete Round 1
4. System calculates scores
5. Admin runs qualification
6. Top 15 teams with score >= 70 qualify
7. Students see eligibility status
8. Qualified students access Round 2
9. Repeat for subsequent rounds
```

## 📞 Quick Help

**Issue**: Can't access admin page
- **Fix**: Check user role is 'admin' in profiles table

**Issue**: Qualification not working
- **Fix**: Verify schema is run, check Supabase logs

**Issue**: Students see all rounds
- **Fix**: Check RLS policies, verify eligibility records

**Issue**: Performance data missing
- **Fix**: Run calculate_individual_performance function

## 🔗 Related Documentation

- Full System Docs: `QUALIFICATION_SYSTEM.md`
- Setup Guide: `QUALIFICATION_SETUP_INSTRUCTIONS.md`
- Testing Guide: `TESTING_QUALIFICATION_SYSTEM.md`
- API Reference: `API_REFERENCE.md`
- Implementation Summary: `IMPLEMENTATION_SUMMARY.md`

---

**Need more help?** Check the full documentation files above.
