# How to Test the Elimination Fix

## Step 1: Check Database Status

Run this query in Supabase SQL Editor:

```sql
-- Check if team A is eliminated
SELECT 
  t.team_name,
  r.name as round_name,
  r.round_number,
  trs.status
FROM team_round_status trs
JOIN teams t ON trs.team_id = t.id
JOIN rounds r ON trs.round_id = r.id
WHERE t.team_name = 'team A'
ORDER BY r.round_number;
```

**Expected Result:**
```
team_name | round_name      | round_number | status
----------|-----------------|--------------|----------
team A    | APTITUDE TEST   | 1            | eliminated
```

If you see `status = 'eliminated'`, the database is correct.

## Step 2: Refresh the Frontend

1. Go to: http://localhost:3000/student/dashboard
2. Press `Ctrl + Shift + R` (hard refresh) to clear cache
3. Log in as a student from "team A"

## Step 3: Verify the Fix

You should now see:

### ✅ What You Should See:
1. **Red Banner at Top:**
   ```
   ⚠️ TEAM ELIMINATED
   Your team has been eliminated from the competition.
   Access to future rounds is restricted.
   ```

2. **No Active Round Card:**
   ```
   NO ACTIVE PROTOCOLS
   Awaiting Command Authorization
   ```

3. **No "START SEQUENCE" Button**
   - The orange button should be completely gone

### ❌ What You Should NOT See:
- "ACTIVE ROUND" card with round number
- "START SEQUENCE" button
- "AUTHORIZED ACCESS" badge on active rounds

## Step 4: Test Other Teams

Log in as a student from a NON-eliminated team (e.g., "team B"):

### ✅ They Should See:
1. **Green Status Banner:**
   ```
   ✅ QUALIFIED FOR NEXT PHASE
   ```

2. **Active Round Card:**
   ```
   02 TECHNICAL ROUND
   [START SEQUENCE] button
   ```

3. Can click and access the round

## Troubleshooting

### Issue: Still seeing "START SEQUENCE" button

**Solution 1: Hard Refresh**
```
Press Ctrl + Shift + R (Windows/Linux)
Press Cmd + Shift + R (Mac)
```

**Solution 2: Clear Browser Cache**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Solution 3: Check Database**
Run `QUICK-CHECK-ELIMINATION.sql` to verify team is actually eliminated

### Issue: Database shows no elimination

**Solution: Add elimination record**
```sql
-- Add elimination for team A in Round 1
INSERT INTO team_round_status (team_id, round_id, status, message)
SELECT 
  t.id,
  r.id,
  'eliminated',
  'Team eliminated from aptitude round'
FROM teams t
CROSS JOIN rounds r
WHERE t.team_name = 'team A'
  AND r.round_number = 1
ON CONFLICT (team_id, round_id) 
DO UPDATE SET status = 'eliminated';
```

## Summary

**Before Fix:**
- ❌ Eliminated team sees "START SEQUENCE"
- ❌ Can access next rounds

**After Fix:**
- ✅ Eliminated team sees "TEAM ELIMINATED" banner
- ✅ Shows "NO ACTIVE PROTOCOLS"
- ✅ Cannot access any rounds

**The fix is working if eliminated teams are properly blocked!** 🚀
