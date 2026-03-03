# Testing the Qualification System

## Quick Test Guide

This guide will help you test the qualification system end-to-end.

## Prerequisites

1. ✅ Supabase project set up
2. ✅ `supabase-schema.sql` executed
3. ✅ `supabase-qualification-system.sql` executed
4. ✅ Admin account created
5. ✅ At least 2 teams created
6. ✅ At least 2 rounds created

## Test Scenario

We'll simulate a complete qualification flow:
1. Admin sets criteria for Round 2
2. Students complete Round 1
3. Admin runs qualification
4. Students see their eligibility status

## Step-by-Step Testing

### Phase 1: Setup (As Admin)

#### 1.1 Create Test Rounds

Login as admin and create two rounds in the database:

```sql
-- Round 1: Aptitude Test
INSERT INTO rounds (name, type, description, round_number, max_score, duration_minutes, is_active)
VALUES ('Aptitude Test', 'aptitude', 'Basic aptitude assessment', 1, 100, 60, true);

-- Round 2: Technical Test
INSERT INTO rounds (name, type, description, round_number, max_score, duration_minutes, is_active)
VALUES ('Technical Test', 'technical', 'Coding assessment', 2, 100, 90, false);
```

#### 1.2 Create Test Teams

```sql
-- Team 1
INSERT INTO teams (code, name, status)
VALUES ('TEAM001', 'Alpha Squad', 'active');

-- Team 2
INSERT INTO teams (code, name, status)
VALUES ('TEAM002', 'Beta Squad', 'active');

-- Team 3
INSERT INTO teams (code, name, status)
VALUES ('TEAM003', 'Gamma Squad', 'active');
```

#### 1.3 Add Team Scores for Round 1

```sql
-- Get round 1 ID
SELECT id FROM rounds WHERE round_number = 1;

-- Add scores (replace round_id and team_id with actual IDs)
INSERT INTO team_scores (team_id, round_id, score)
VALUES 
  ('team-1-id', 'round-1-id', 85),  -- Alpha Squad: 85 (should qualify)
  ('team-2-id', 'round-1-id', 65),  -- Beta Squad: 65 (should not qualify)
  ('team-3-id', 'round-1-id', 90);  -- Gamma Squad: 90 (should qualify)
```

### Phase 2: Set Qualification Criteria (As Admin)

#### 2.1 Navigate to Qualification Management

1. Login as admin
2. Go to `/admin/qualifications`
3. You should see the qualification management page

#### 2.2 Set Criteria for Round 2

1. Click on "Technical Test" (Round 2) in the round list
2. Set the following criteria:
   - **Minimum Score**: 70
   - **Maximum Teams**: Leave empty (no limit)
3. Click "Save Criteria"
4. You should see a success message

### Phase 3: Run Qualification (As Admin)

#### 3.1 Execute Qualification

1. Still on the qualification management page
2. With Round 2 selected
3. Click "Run Qualification"
4. Wait for the process to complete
5. You should see an alert:
   ```
   Qualification complete!
   Qualified: 2
   Disqualified: 1
   ```

#### 3.2 Verify Eligible Teams

1. Scroll down to "Eligible Teams" section
2. You should see:
   - ✅ Alpha Squad (Score: 85)
   - ✅ Gamma Squad (Score: 90)
3. Beta Squad should NOT appear (score 65 < minimum 70)

### Phase 4: Test Student View

#### 4.1 Login as Student from Alpha Squad

1. Logout from admin
2. Login as a student from Alpha Squad
3. Navigate to `/student/dashboard`

#### 4.2 Verify Round Visibility

You should see:

**Round 1: Aptitude Test**
- Status: "Qualified ✓" (green badge)
- Can see the round card
- Shows completed status

**Round 2: Technical Test**
- Status: "Qualified ✓" (green badge)
- Can see the round card
- Shows "Enter Round" button (if active)

#### 4.3 Check Performance Tab

1. Click on "My Performance" tab
2. You should see:
   - Round 1 score: 85/100
   - Accuracy percentage (if available)
   - Correct answers count

3. Click on "Team Performance" tab
4. You should see all Alpha Squad members' scores

#### 4.4 Login as Student from Beta Squad

1. Logout
2. Login as a student from Beta Squad
3. Navigate to `/student/dashboard`

You should see:

**Round 1: Aptitude Test**
- Status: "Qualified ✓" (green badge)
- Can see the round card

**Round 2: Technical Test**
- Status: "Not qualified" (red badge)
- Can see the round card but it's locked
- Shows lock icon
- NO "Enter Round" button

### Phase 5: Test Manual Override (As Admin)

#### 5.1 Manually Qualify Beta Squad

1. Login as admin
2. Go to `/admin/qualifications`
3. Select Round 2
4. In the eligible teams list, you should see Alpha and Gamma
5. To manually add Beta Squad, use the service:

```javascript
// In browser console or through admin interface
await qualificationService.setTeamEligibility(
  'beta-squad-team-id',
  'round-2-id',
  true,
  'Manual qualification by admin for testing'
);
```

#### 5.2 Verify Manual Override

1. Refresh the page
2. Beta Squad should now appear in eligible teams
3. Login as Beta Squad student
4. Round 2 should now show "Qualified ✓"

### Phase 6: Test with Max Teams Limit

#### 6.1 Update Criteria with Max Teams

1. As admin, go to `/admin/qualifications`
2. Select Round 2
3. Update criteria:
   - **Minimum Score**: 70
   - **Maximum Teams**: 2
4. Click "Save Criteria"

#### 6.2 Re-run Qualification

1. Click "Run Qualification"
2. System should qualify only top 2 teams:
   - Gamma Squad (90 points)
   - Alpha Squad (85 points)
3. Beta Squad should be disqualified (even if score >= 70)

### Phase 7: Test Performance Calculation

#### 7.1 Add Individual Answers

```sql
-- Add questions for Round 1
INSERT INTO questions (round_id, question_text, question_type, points, correct_answer)
VALUES 
  ('round-1-id', 'What is 2+2?', 'mcq', 10, '4'),
  ('round-1-id', 'What is 3+3?', 'mcq', 10, '6');

-- Add user answers (replace user_id with actual student ID)
INSERT INTO user_answers (user_id, question_id, round_id, answer, is_correct)
VALUES 
  ('student-1-id', 'question-1-id', 'round-1-id', '4', true),
  ('student-1-id', 'question-2-id', 'round-1-id', '6', true);
```

#### 7.2 Calculate Performance

```sql
-- Calculate individual performance
SELECT calculate_individual_performance('student-1-id', 'round-1-id');
```

#### 7.3 Verify Performance Data

1. Login as the student
2. Go to "My Performance" tab
3. You should see:
   - Score: 20/100
   - Accuracy: 100%
   - Correct Answers: 2/2

## Expected Results Summary

### Admin View
- ✅ Can set qualification criteria
- ✅ Can run automatic qualification
- ✅ Can see eligible teams list
- ✅ Can manually override eligibility
- ✅ Sees qualification statistics

### Student View (Qualified)
- ✅ Sees qualified rounds with green badge
- ✅ Can access qualified rounds
- ✅ Sees "Enter Round" button for active rounds
- ✅ Can view individual performance
- ✅ Can view team performance

### Student View (Not Qualified)
- ✅ Sees disqualified rounds with red badge
- ✅ Cannot access disqualified rounds
- ✅ Sees lock icon
- ✅ No "Enter Round" button
- ✅ Can still view past performance

## Common Test Issues

### Issue: No teams showing in eligible list

**Cause**: Qualification hasn't been run or no teams meet criteria

**Solution**:
```sql
-- Check if qualification criteria exists
SELECT * FROM round_qualifications WHERE round_id = 'round-2-id';

-- Check team scores
SELECT * FROM team_scores WHERE round_id = 'round-1-id';

-- Manually run qualification
SELECT * FROM qualify_teams_for_next_round('round-1-id', 'round-2-id');
```

### Issue: Student sees all rounds regardless of qualification

**Cause**: Eligibility check not working

**Solution**:
```sql
-- Check eligibility records
SELECT * FROM team_round_eligibility WHERE team_id = 'team-id';

-- Verify RLS policies are enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'team_round_eligibility';
```

### Issue: Performance data not showing

**Cause**: Performance calculation not triggered

**Solution**:
```sql
-- Manually calculate performance
SELECT calculate_individual_performance('user-id', 'round-id');

-- Check if data exists
SELECT * FROM individual_performance WHERE user_id = 'user-id';
```

## Test Checklist

Use this checklist to verify all features:

### Admin Features
- [ ] Can access `/admin/qualifications`
- [ ] Can select different rounds
- [ ] Can set minimum score
- [ ] Can set maximum teams
- [ ] Can save criteria
- [ ] Can run qualification
- [ ] Can see eligible teams
- [ ] Can manually override eligibility

### Student Features
- [ ] Can access `/student/dashboard`
- [ ] Sees three tabs (Rounds, My Performance, Team Performance)
- [ ] Qualified rounds show green badge
- [ ] Disqualified rounds show red badge
- [ ] Can access qualified rounds
- [ ] Cannot access disqualified rounds
- [ ] Can view individual performance
- [ ] Can view team performance
- [ ] Performance metrics are accurate

### Database
- [ ] `round_qualifications` table has data
- [ ] `team_round_eligibility` table has data
- [ ] `individual_performance` table has data
- [ ] RLS policies are working
- [ ] Functions execute without errors

## Performance Testing

Test with larger datasets:

```sql
-- Create 50 teams
DO $
BEGIN
  FOR i IN 1..50 LOOP
    INSERT INTO teams (code, name, status)
    VALUES (
      'TEAM' || LPAD(i::text, 3, '0'),
      'Team ' || i,
      'active'
    );
  END LOOP;
END $;

-- Add scores for all teams
DO $
DECLARE
  team_record RECORD;
  round_id UUID;
BEGIN
  SELECT id INTO round_id FROM rounds WHERE round_number = 1;
  
  FOR team_record IN SELECT id FROM teams LOOP
    INSERT INTO team_scores (team_id, round_id, score)
    VALUES (team_record.id, round_id, FLOOR(RANDOM() * 100));
  END LOOP;
END $;

-- Run qualification with max teams = 20
-- Should qualify top 20 teams by score
```

## Automated Testing Script

Create a test script to automate testing:

```javascript
// test-qualification.js
const testQualificationSystem = async () => {
  console.log('Starting qualification system tests...');
  
  // Test 1: Set criteria
  await qualificationService.setRoundQualification(round2Id, {
    minScore: 70,
    maxTeams: 10
  });
  console.log('✅ Criteria set');
  
  // Test 2: Run qualification
  const results = await qualificationService.qualifyTeamsForNextRound(
    round1Id,
    round2Id
  );
  console.log('✅ Qualification run:', results);
  
  // Test 3: Check eligibility
  const eligible = await qualificationService.getEligibleTeams(round2Id);
  console.log('✅ Eligible teams:', eligible.length);
  
  // Test 4: Get performance
  const perf = await qualificationService.getIndividualPerformance(userId);
  console.log('✅ Performance data:', perf);
  
  console.log('All tests passed! ✅');
};
```

## Next Steps After Testing

Once all tests pass:

1. ✅ Document any issues found
2. ✅ Adjust qualification criteria based on testing
3. ✅ Train admins on using the system
4. ✅ Communicate qualification rules to students
5. ✅ Set up monitoring for production
6. ✅ Create backup procedures
7. ✅ Plan for edge cases

## Support

If you encounter issues during testing:

1. Check browser console for errors
2. Check Supabase logs
3. Verify database schema is correct
4. Review RLS policies
5. Check service method implementations
6. Refer to `QUALIFICATION_SYSTEM.md` for detailed documentation

---

**Happy Testing! 🎉**
