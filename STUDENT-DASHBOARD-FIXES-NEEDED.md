# Student Dashboard Fixes Needed

## Current Issues

1. ✅ Admin panel working perfect
2. ❌ Student dashboard showing "0 pts" and "0%"
3. ❌ Not showing elimination status
4. ❌ Not blocking eliminated teams from next rounds

## Root Causes

### Issue 1: Wrong Table Reference
**Problem:** StudentDashboard is fetching from `individual_performance` table
**Reality:** Scores are in `student_scores` table

**Current code (line ~483):**
```javascript
const { data: perfData } = await supabase
  .from('individual_performance')  // ← This table doesn't exist!
  .select(`
    *,
    rounds (name, type, max_score)
  `)
  .eq('user_id', member.id)
  .eq('team_id', teamId);
```

**Should be:**
```javascript
const { data: perfData } = await supabase
  .from('student_scores')  // ← Use this table
  .select(`
    *,
    rounds (name, type)
  `)
  .eq('student_id', member.id);
```

### Issue 2: No Elimination Display
**Problem:** Dashboard doesn't show if team/student is eliminated
**Solution:** Check `team_round_status` and show elimination badge

### Issue 3: No Round Blocking
**Problem:** Eliminated teams can still access next rounds
**Solution:** Check elimination status before allowing round access

---

## Fixes Required

### Fix 1: Update StudentDashboard.js Data Fetching

**File:** `src/pages/StudentDashboard.js`
**Line:** ~483

**Change from:**
```javascript
const { data: perfData } = await supabase
  .from('individual_performance')
  .select(`
    *,
    rounds (name, type, max_score)
  `)
  .eq('user_id', member.id)
  .eq('team_id', teamId);
```

**Change to:**
```javascript
const { data: perfData } = await supabase
  .from('student_scores')
  .select(`
    *,
    rounds!inner (name, type, round_number)
  `)
  .eq('student_id', member.id);
```

### Fix 2: Update Score Calculation

**Current (line ~528):**
```javascript
const getTotalScore = (userId) => {
  const perfs = memberPerformances[userId] || [];
  return perfs.reduce((sum, p) => sum + (p.score || 0), 0);
};
```

**This is correct, but make sure the data structure matches**

### Fix 3: Update Accuracy Calculation

**Current (line ~533):**
```javascript
const getAverageAccuracy = (userId) => {
  const perfs = memberPerformances[userId] || [];
  if (perfs.length === 0) return 0;
  const totalAccuracy = perfs.reduce((sum, p) => sum + (p.metrics?.accuracy || 0), 0);
  return Math.round(totalAccuracy / perfs.length);
};
```

**Change to:**
```javascript
const getAverageAccuracy = (userId) => {
  const perfs = memberPerformances[userId] || [];
  if (perfs.length === 0) return 0;
  const totalAccuracy = perfs.reduce((sum, p) => sum + (p.percentage || 0), 0);
  return Math.round(totalAccuracy / perfs.length);
};
```

### Fix 4: Add Elimination Status Display

**Add this section in the member card (after line ~610):**
```javascript
{/* Elimination Status */}
{eliminatedRounds[m.id]?.length > 0 && (
  <div className="mt-4 pt-4 border-t border-red-500/20">
    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
      <span className="material-symbols-outlined text-red-500 text-sm">block</span>
      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
        Eliminated from {eliminatedRounds[m.id].length} round(s)
      </span>
    </div>
  </div>
)}
```

### Fix 5: Block Eliminated Teams from Rounds

**In the rounds display section (around line ~350):**

**Add this check before showing round access:**
```javascript
// Check if team is eliminated for this round
const isTeamEliminated = teamStatus.find(
  s => s.round_id === round.id && s.status === 'eliminated'
);

// Check if current student is eliminated
const isStudentEliminated = eliminatedRounds[currentStudent.id]?.includes(round.id);

// Don't show round if eliminated
if (isTeamEliminated || isStudentEliminated) {
  return (
    <div key={round.id} className="...">
      {/* Show elimination message */}
      <div className="flex items-center gap-3 p-6 bg-red-500/10 border-2 border-red-500/20 rounded-2xl">
        <span className="material-symbols-outlined text-red-500 text-3xl">block</span>
        <div>
          <p className="text-sm font-bold text-red-500">ELIMINATED</p>
          <p className="text-xs text-white/60">You cannot access this round</p>
        </div>
      </div>
    </div>
  );
}
```

---

## Quick Fix Code Changes

I'll create the updated StudentDashboard.js with all fixes applied.

---

## Testing Checklist

After applying fixes:

- [ ] Student dashboard shows correct scores (not 0 pts)
- [ ] Student dashboard shows correct accuracy (not 0%)
- [ ] Eliminated students see "ELIMINATED" badge
- [ ] Eliminated students cannot access next rounds
- [ ] Team elimination status is visible
- [ ] Scores update in real-time when admin announces results

---

## Files to Modify

1. **`src/pages/StudentDashboard.js`** - Main fixes needed here
2. **`src/pages/StudentTeamManagement.js`** - May need similar fixes

---

## Summary

The student dashboard is fetching from the wrong table (`individual_performance` instead of `student_scores`). Once we fix the data source and add elimination checks, everything will work correctly.

**Next Step:** I'll create the fixed version of StudentDashboard.js
