# GD Judge Panel - Troubleshooting Guide

## Issue: "No teams showing in GD Judge panel"

### Root Cause
The GD Judge panel displays teams where `teams.status = 'qualified'`. If no teams appear, it means:
1. No teams have been qualified for Round 3 (GD)
2. Teams exist but their status is not set to 'qualified'

### Solution Steps

#### Step 1: Check Current Team Status
Run this query in Supabase SQL Editor:
```sql
SELECT team_code, team_name, status, event_name
FROM teams
ORDER BY team_name;
```

**Expected Result**: You should see teams with various statuses (active, qualified, eliminated, etc.)

#### Step 2: Qualify Teams for GD Round
Choose ONE of these options:

**Option A: Qualify ALL teams (for testing)**
```sql
UPDATE teams 
SET status = 'qualified'
WHERE status IS NOT NULL;
```

**Option B: Qualify specific teams (recommended)**
```sql
UPDATE teams 
SET status = 'qualified'
WHERE team_code IN ('RB-0001', 'RB-0002', 'RB-0003');
```

**Option C: Use the provided script**
Run the entire `QUICK-SETUP-GD-TEAMS.sql` file

#### Step 3: Verify Teams Appear
1. Refresh the GD Judge page (Ctrl+F5)
2. Check the left sidebar under "QUALIFIED TEAMS"
3. You should now see team cards

#### Step 4: Click on a Team
1. Click any team card in the left sidebar
2. The main area should show a table with all team members
3. You can now enter scores for each criterion

### What You Should See

**Left Sidebar:**
- List of qualified teams
- Team name and code
- Member count

**Main Area (after selecting a team):**
- Table with columns:
  - Student Name
  - Awareness About The Topic (10)
  - Content (10)
  - Logical Thinking (10)
  - Listening Skills (10)
  - Team Work (10)
  - Total (50)
  - Action (Save button)
- Team average score at bottom
- "Save All Evaluations" button
- Team remarks section

### Common Issues

#### Issue 1: Teams show but no students
**Cause**: Teams don't have any members
**Solution**: Add students to teams via Admin Team Management

#### Issue 2: Can't save scores
**Cause**: Database permissions or round_id mismatch
**Solution**: Check that Round 3 exists in rounds table

#### Issue 3: Table doesn't appear after clicking team
**Cause**: JavaScript error or build issue
**Solution**: 
1. Check browser console for errors
2. Rebuild: `npm run build`
3. Hard refresh: Ctrl+F5

### Workflow Summary

1. **Admin qualifies teams** (via Admin Score Management or SQL)
2. **GD Judge logs in** → sees qualified teams in sidebar
3. **Judge clicks team** → sees all members in table format
4. **Judge enters scores** → 0-10 for each of 5 criteria
5. **Judge saves** → individual or "Save All"
6. **Judge adds remarks** → team-level observations
7. **Repeat for all teams**
8. **Admin calculates qualified teams** → determines next round qualifiers

### Database Schema Reference

**teams table:**
- `status` column values: 'active', 'qualified', 'eliminated', 'winner'
- GD Judge filters by: `status = 'qualified'`

**team_round_status table:**
- Links teams to specific rounds
- `qualified` boolean field
- `status` field for round-specific status

**students table:**
- `team_id` foreign key links to teams
- Must have students for evaluation

**student_scores table:**
- Stores individual scores
- `round_id` must match Round 3 (GD)
- `score` out of `max_score` (50 for GD)

### Quick Test

Run this to create test data:
```sql
-- Create a test team if none exist
INSERT INTO teams (team_name, team_code, status, event_name)
VALUES ('Test Team', 'TEST-01', 'qualified', 'REBUILD : The Simulation')
ON CONFLICT DO NOTHING;

-- Add test students
INSERT INTO students (team_id, full_name, email, roll_number, role)
SELECT 
  t.id,
  'Test Student ' || i,
  'test' || i || '@example.com',
  'TEST-' || i,
  CASE WHEN i = 1 THEN 'leader' ELSE 'member' END
FROM teams t, generate_series(1, 4) i
WHERE t.team_code = 'TEST-01'
ON CONFLICT DO NOTHING;
```

### Support

If issues persist:
1. Check browser console for JavaScript errors
2. Verify database schema matches expected structure
3. Ensure all migrations have run
4. Check Supabase logs for database errors
