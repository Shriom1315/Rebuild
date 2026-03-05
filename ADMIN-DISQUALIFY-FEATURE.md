# Admin Team Disqualification Feature

## Overview
Added a manual "Disqualify Team" button to the Admin Team Management panel as a backup method to eliminate teams from all rounds.

## Location
**Admin Panel → Teams Tab → Each Team Card**

## What It Does

### Button Appearance
- 🚫 Orange "block" icon button
- Located between "Add Member" and "Delete Team" buttons
- Hover effect: Orange glow
- Tooltip: "Disqualify Team"

### Functionality
When clicked, the button:

1. **Shows Confirmation Dialog**
   ```
   Disqualify "team A" from ALL rounds? 
   This will block them from accessing any future rounds.
   ```

2. **Creates Elimination Records**
   - Inserts/updates `team_round_status` for ALL rounds
   - Sets `status = 'eliminated'`
   - Sets `message = 'Team disqualified by admin'`

3. **Updates Team Status**
   - Changes team's `status` to 'eliminated'
   - Team badge shows "ELIMINATED" in red

4. **Shows Success Message**
   ```
   ✅ Team "team A" has been disqualified from all rounds
   ```

## How to Use

### Step 1: Navigate to Admin Panel
1. Go to: http://localhost:3000/admin/teams
2. Log in as admin
3. Click "Teams" tab (should be default)

### Step 2: Find the Team
Scroll through the team cards to find the team you want to disqualify

### Step 3: Click Disqualify Button
1. Click the orange 🚫 button (middle button)
2. Confirm the action in the dialog
3. Wait for success message

### Step 4: Verify
The team should now:
- Show "ELIMINATED" badge in red
- Be blocked from all rounds on student dashboard
- See "TEAM ELIMINATED" banner when they log in

## Technical Details

### Database Changes
```sql
-- Creates records in team_round_status
INSERT INTO team_round_status (team_id, round_id, status, message)
VALUES 
  (team_id, round_1_id, 'eliminated', 'Team disqualified by admin'),
  (team_id, round_2_id, 'eliminated', 'Team disqualified by admin'),
  (team_id, round_3_id, 'eliminated', 'Team disqualified by admin'),
  ...
ON CONFLICT (team_id, round_id) 
DO UPDATE SET 
  status = 'eliminated',
  message = 'Team disqualified by admin';

-- Updates team status
UPDATE teams 
SET status = 'eliminated' 
WHERE id = team_id;
```

### Code Location
**File:** `src/pages/AdminTeamManagement.js`

**Function:** `handleDisqualifyTeam(teamId, teamName)`
- Lines: ~170-210

**UI Button:** 
- Lines: ~450-460

## Use Cases

### Use Case 1: Backup Elimination
If the automatic qualification system fails or doesn't work correctly, admin can manually disqualify teams.

### Use Case 2: Rule Violations
If a team violates rules outside the system (cheating, misconduct), admin can immediately disqualify them.

### Use Case 3: Technical Issues
If there are database sync issues or the team status isn't updating correctly, this provides a manual override.

### Use Case 4: Emergency Disqualification
Quick way to remove a team from competition without deleting their data.

## Differences from Delete

| Action | Disqualify | Delete |
|--------|-----------|--------|
| Team data | ✅ Preserved | ❌ Removed |
| Student data | ✅ Preserved | ❌ Removed |
| Scores | ✅ Preserved | ❌ Removed |
| Can view past rounds | ✅ Yes | ❌ No |
| Can access new rounds | ❌ No | ❌ No |
| Reversible | ✅ Yes (via SQL) | ❌ No |

## Reverting Disqualification

If you need to re-qualify a team, run this SQL:

```sql
-- Remove elimination records
DELETE FROM team_round_status 
WHERE team_id = (SELECT id FROM teams WHERE team_name = 'team A')
  AND status = 'eliminated';

-- Update team status
UPDATE teams 
SET status = 'active' 
WHERE team_name = 'team A';
```

## Visual Guide

### Before Disqualification
```
┌─────────────────────────────────┐
│ 🔷 team A          [ACTIVE]     │
│ RB-1234 • 4 MEMBERS             │
│                                 │
│ [👤] [🚫] [🗑️]                  │
└─────────────────────────────────┘
```

### After Disqualification
```
┌─────────────────────────────────┐
│ 🔷 team A          [ELIMINATED] │
│ RB-1234 • 4 MEMBERS             │
│                                 │
│ [👤] [🚫] [🗑️]                  │
└─────────────────────────────────┘
```

### Student View After Disqualification
```
┌─────────────────────────────────┐
│  ⚠️  TEAM ELIMINATED            │
│  Your team has been             │
│  disqualified from the          │
│  competition. Access to future  │
│  rounds is restricted.          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  NO ACTIVE PROTOCOLS            │
│  Awaiting Command Authorization │
└─────────────────────────────────┘
```

## Error Handling

### Error: "Column does not exist"
**Solution:** Run the schema migration to create `team_round_status` table

### Error: "Duplicate key violation"
**Solution:** The upsert will handle this automatically

### Error: "Team not found"
**Solution:** Refresh the page and try again

## Testing

### Test 1: Disqualify a Team
1. Click disqualify button on "team A"
2. Confirm the dialog
3. ✅ Should see success message
4. ✅ Team badge should show "ELIMINATED"

### Test 2: Student View
1. Log in as student from disqualified team
2. ✅ Should see red "TEAM ELIMINATED" banner
3. ✅ Should see "NO ACTIVE PROTOCOLS"
4. ✅ Should NOT see "START SEQUENCE" button

### Test 3: Database Verification
```sql
SELECT * FROM team_round_status 
WHERE team_id = (SELECT id FROM teams WHERE team_name = 'team A');
```
✅ Should show elimination records for all rounds

## Summary

✅ Added orange "Disqualify" button to admin panel
✅ Creates elimination records for ALL rounds
✅ Updates team status to 'eliminated'
✅ Shows confirmation dialog before action
✅ Provides success/error feedback
✅ Preserves team data (unlike delete)
✅ Blocks team from all future rounds
✅ Works as backup if automatic system fails

**The disqualification feature is now live and ready to use!** 🚀
