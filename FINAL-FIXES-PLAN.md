# Final Fixes Plan

## Issue 1: Users seeing results before admin announces them
**Problem**: Leaderboard shows all rounds regardless of `results_announced` status
**Fix**: Filter leaderboard to only show rounds where `results_announced = true`

## Issue 2: Aptitude page too big - requires scrolling to submit
**Problem**: The main content area has `overflow-y-auto` which creates scrolling
**Fix**: Make the layout use `h-screen` with proper flex distribution so submit button is always visible

## Issue 3: Score calculating lagging - Admin cannot manually add technical round marks
**Problem**: CSV upload overwrites all scores, no way to manually edit individual scores
**Fix**: Add manual score editing interface in AdminScoreManagement

## Issue 4: Score displaying everywhere not looking good
**Problem**: Score display format inconsistent across pages
**Fix**: Standardize score display format with better styling

## Implementation Order
1. Fix Issue 1 (Leaderboard filtering) - CRITICAL
2. Fix Issue 2 (Aptitude layout) - HIGH
3. Fix Issue 3 (Manual score editing) - HIGH
4. Fix Issue 4 (Score display styling) - MEDIUM
