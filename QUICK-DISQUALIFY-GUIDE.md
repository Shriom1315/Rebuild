# Quick Guide: Disqualify a Team

## 3 Simple Steps

### Step 1: Go to Admin Panel
```
http://localhost:3000/admin/teams
```

### Step 2: Find the Team & Click 🚫
Look for the orange block icon button on the team card

```
team A                    [ACTIVE]
RB-1234 • 4 MEMBERS

[👤 Add]  [🚫 Disqualify]  [🗑️ Delete]
          ↑ CLICK THIS
```

### Step 3: Confirm
Click "OK" in the confirmation dialog

```
Disqualify "team A" from ALL rounds?
This will block them from accessing any future rounds.

[Cancel]  [OK]
```

## Result

✅ Team is immediately disqualified from ALL rounds
✅ Team badge changes to "ELIMINATED" (red)
✅ Students see "TEAM ELIMINATED" banner
✅ Students cannot access any rounds

## What Happens Behind the Scenes

1. Creates elimination records in `team_round_status` for every round
2. Updates team status to 'eliminated'
3. Students are blocked from accessing rounds
4. All data is preserved (scores, members, etc.)

## When to Use

- ✅ Automatic qualification system not working
- ✅ Team violated rules
- ✅ Need to manually eliminate a team
- ✅ Emergency disqualification needed

## Difference from Delete

| Disqualify | Delete |
|-----------|--------|
| Keeps all data | Removes all data |
| Can be reversed | Cannot be reversed |
| Team can view past scores | Team data gone |
| Blocks future access | Removes team entirely |

## To Undo (SQL Required)

```sql
-- Remove elimination
DELETE FROM team_round_status 
WHERE team_id = (SELECT id FROM teams WHERE team_name = 'team A');

-- Reactivate team
UPDATE teams SET status = 'active' WHERE team_name = 'team A';
```

---

**That's it! Simple 3-step process to disqualify any team.** 🚀
