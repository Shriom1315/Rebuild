# Individual SEB Elimination Fix

## Problem

Currently, when ONE student violates SEB rules, the ENTIRE TEAM gets eliminated. This is unfair to other team members who are following the rules.

## Solution

Only eliminate the individual student who violated the rules. The team continues with remaining members.

## Changes Needed

### 1. Change localStorage Key

**Before (Wrong):**
```javascript
localStorage.setItem(`eliminated_${team.id}_${round.id}`, 'true');
```

**After (Correct):**
```javascript
localStorage.setItem(`eliminated_${currentStudent.id}_${round.id}`, 'true');
```

### 2. Don't Update Team Status

**Before (Wrong):**
```javascript
// This eliminates the entire team
await supabase.from('teams').update({ status: 'eliminated' }).eq('id', team.id);
```

**After (Correct):**
```javascript
// Don't update team status at all
// Only mark the individual student as eliminated
```

### 3. Mark Individual Student in Database

**Use the existing `is_eliminated` flag in `student_answers`:**
```javascript
// When student is eliminated, mark their answers
await supabase
  .from('student_answers')
  .update({ is_eliminated: true })
  .eq('student_id', currentStudent.id)
  .eq('round_id', roundInfo.id);
```

### 4. Update team_round_status Differently

**Before (Wrong):**
```javascript
await supabase
  .from('team_round_status')
  .upsert({
    team_id: team.id,
    round_id: roundInfoRef.current.id,
    status: 'eliminated',  // ← Wrong! Eliminates whole team
    violation_count: newCount,
    message: `Eliminated: ${reason}`
  });
```

**After (Correct):**
```javascript
// Just track violations, don't change team status
await supabase
  .from('team_round_status')
  .upsert({
    team_id: team.id,
    round_id: roundInfoRef.current.id,
    status: 'in_progress',  // ← Team continues
    violation_count: newCount,
    message: `Student ${currentStudent.full_name} eliminated: ${reason}`
  });
```

## Code Changes in AptitudeRoundExam.js

### Location: handleViolation function (around line 200)

**Replace this section:**
```javascript
if (newCount >= maxWarnings) {
  // ═══ ELIMINATION ═══
  isEliminatedRef.current = true;
  setIsEliminated(true);
  setViolationMessage("PROTOCOL TERMINATED: Maximum violations exceeded. You have been eliminated.");
  setShowViolationBanner(true);

  // Persist elimination to localStorage
  localStorage.setItem(`eliminated_${team.id}_${roundInfoRef.current.id}`, 'true');

  // ... auto-submit code ...

  // Update DB — mark team round status as eliminated
  await supabase
    .from('team_round_status')
    .upsert({
      team_id: team.id,
      round_id: roundInfoRef.current.id,
      status: 'eliminated',
      violation_count: newCount,
      message: `Eliminated: ${reason} (${newCount} violations)`
    });

  // Also update team table status to eliminated
  await supabase.from('teams').update({ status: 'eliminated' }).eq('id', team.id);
}
```

**With this:**
```javascript
if (newCount >= maxWarnings) {
  // ═══ INDIVIDUAL ELIMINATION ═══
  isEliminatedRef.current = true;
  setIsEliminated(true);
  setViolationMessage("PROTOCOL TERMINATED: You have been eliminated. Your team continues.");
  setShowViolationBanner(true);

  // Persist INDIVIDUAL elimination to localStorage
  localStorage.setItem(`eliminated_${currentStudent.id}_${roundInfoRef.current.id}`, 'true');

  // ... auto-submit code stays the same ...

  // Mark individual student as eliminated in their answers
  await supabase
    .from('student_answers')
    .update({ is_eliminated: true })
    .eq('student_id', currentStudent.id)
    .eq('round_id', roundInfoRef.current.id);

  // Update team_round_status but DON'T eliminate the team
  await supabase
    .from('team_round_status')
    .upsert({
      team_id: team.id,
      round_id: roundInfoRef.current.id,
      status: 'in_progress',  // Team continues!
      violation_count: newCount,
      message: `Student ${currentStudent.full_name} eliminated: ${reason} (${newCount} violations)`
    }, { onConflict: 'team_id, round_id' });

  // DON'T update team status - team continues with remaining members
}
```

### Location: Check for elimination (around line 90)

**Replace this:**
```javascript
// Also check localStorage for previous elimination
const wasEliminated = localStorage.getItem(`eliminated_${team.id}_${round.id}`);
if (wasEliminated) {
  setIsEliminated(true);
  isEliminatedRef.current = true;
}
```

**With this:**
```javascript
// Check if THIS STUDENT was eliminated (not the team)
const wasEliminated = localStorage.getItem(`eliminated_${currentStudent.id}_${round.id}`);
if (wasEliminated) {
  setIsEliminated(true);
  isEliminatedRef.current = true;
}
```

## Score Calculation Impact

### Before (Wrong):
```
Team A: 4 members
- Student 1: 18/45 (40%)
- Student 2: ELIMINATED (team eliminated)
- Student 3: ELIMINATED (team eliminated)
- Student 4: ELIMINATED (team eliminated)
Team Average: 0 (entire team out)
```

### After (Correct):
```
Team A: 4 members
- Student 1: 18/45 (40%)
- Student 2: ELIMINATED (only this student)
- Student 3: 20/45 (44%)
- Student 4: 22/45 (49%)
Team Average: (18 + 20 + 22) / 3 = 20.0 (fair!)
```

## Benefits

1. ✅ **Fair to team members** - One person's mistake doesn't punish everyone
2. ✅ **Encourages good behavior** - Students know they're responsible for themselves
3. ✅ **Team can still compete** - Remaining members can qualify
4. ✅ **Accurate scoring** - Team average reflects actual performers
5. ✅ **Individual accountability** - Each student owns their actions

## Testing

### Test Case 1: One Student Violates
1. Student A violates SEB 3 times
2. Student A gets eliminated
3. Student B, C, D continue exam
4. Team score = average of B, C, D only

### Test Case 2: Multiple Students Violate
1. Student A violates → eliminated
2. Student B violates → eliminated
3. Student C, D continue
4. Team score = average of C, D only

### Test Case 3: All Students Violate
1. All 4 students violate individually
2. All 4 get eliminated
3. Team has no score (all members eliminated)
4. Team is effectively eliminated

## Database Queries

### Check which students are eliminated:
```sql
SELECT 
  s.full_name,
  t.team_name,
  sa.is_eliminated
FROM student_answers sa
JOIN students s ON sa.student_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE sa.round_id = (SELECT id FROM rounds WHERE round_number = 1)
  AND sa.is_eliminated = true;
```

### Calculate team score excluding eliminated students:
```sql
SELECT 
  t.team_name,
  COUNT(DISTINCT s.id) as active_members,
  ROUND(AVG(ss.score), 2) as team_average
FROM student_scores ss
JOIN students s ON ss.student_id = s.id
JOIN teams t ON s.team_id = t.id
LEFT JOIN student_answers sa ON sa.student_id = s.id AND sa.round_id = ss.round_id
WHERE ss.round_id = (SELECT id FROM rounds WHERE round_number = 1)
  AND (sa.is_eliminated IS NULL OR sa.is_eliminated = false)
GROUP BY t.team_name
ORDER BY team_average DESC;
```

## Summary

**Old System:** One violation = entire team eliminated (unfair)

**New System:** One violation = only that student eliminated (fair)

This makes the system fair and encourages individual responsibility!
