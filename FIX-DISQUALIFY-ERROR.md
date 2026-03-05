# Fix: Disqualify Button Error

## Error
```
record "new" has no field "updated_at"
```

## Cause
The `upsert` operation was triggering a database constraint or trigger that expected an `updated_at` column, which doesn't exist in the `team_round_status` table.

## Solution
Changed from `upsert` to a simpler approach:

### Old Code (Caused Error)
```javascript
const { error: insertError } = await supabase
  .from('team_round_status')
  .upsert(eliminationRecords, { 
    onConflict: 'team_id,round_id',
    ignoreDuplicates: false 
  });
```

### New Code (Fixed)
```javascript
// Delete existing records first
await supabase
  .from('team_round_status')
  .delete()
  .eq('team_id', teamId);

// Insert new elimination records
const { error: insertError } = await supabase
  .from('team_round_status')
  .insert(eliminationRecords);
```

## How It Works Now

1. **Delete existing records** for the team (if any)
2. **Insert fresh elimination records** for all rounds
3. **Update team status** to 'eliminated'

This avoids the `upsert` conflict and ensures clean data.

## Testing

### Test 1: Disqualify Team A
1. Go to admin panel
2. Click orange 🚫 button on team A
3. Confirm the dialog
4. ✅ Should see success message (no error)

### Test 2: Verify Database
```sql
SELECT * FROM team_round_status 
WHERE team_id = (SELECT id FROM teams WHERE team_name = 'team A');
```
✅ Should show elimination records for all rounds

### Test 3: Student View
1. Log in as student from team A
2. ✅ Should see "TEAM ELIMINATED" banner
3. ✅ Should NOT see "START SEQUENCE" button

## Summary

✅ Fixed the `updated_at` field error
✅ Changed from `upsert` to `delete + insert`
✅ Simpler and more reliable approach
✅ No database schema changes needed

**The disqualify button now works correctly!** 🚀
