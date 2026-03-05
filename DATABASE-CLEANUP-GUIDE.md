# Database Cleanup Guide

## Current Database Status

Looking at your Supabase database, there are several tables. Let me clarify which are ACTIVE and which are UNUSED.

---

## ✅ ACTIVE TABLES (Currently Used)

### 1. **profiles** 
- **Purpose:** User authentication and basic info
- **Used by:** Login system, AuthContext
- **Columns:** id, email, full_name, role
- **Status:** ✅ ACTIVE - DO NOT DELETE

### 2. **teams**
- **Purpose:** Team information
- **Used by:** Team management, student dashboard
- **Columns:** id, team_name, team_code, status
- **Status:** ✅ ACTIVE - DO NOT DELETE

### 3. **students**
- **Purpose:** Student information linked to teams
- **Used by:** Student dashboard, team management
- **Columns:** id, team_id, full_name, roll_number, email
- **Status:** ✅ ACTIVE - DO NOT DELETE

### 4. **rounds**
- **Purpose:** Competition rounds (Aptitude, Technical, GD, HR)
- **Used by:** All round pages, admin panel
- **Columns:** id, name, round_number, type, is_active, results_announced
- **Status:** ✅ ACTIVE - DO NOT DELETE

### 5. **questions**
- **Purpose:** Exam questions for aptitude/technical rounds
- **Used by:** Exam pages, question upload
- **Columns:** id, round_id, question_text, options, correct_answer, points
- **Status:** ✅ ACTIVE - DO NOT DELETE

### 6. **student_answers**
- **Purpose:** Student exam submissions and answers
- **Used by:** Exam pages, score calculation
- **Columns:** id, student_id, round_id, question_id, selected_answer, is_correct, is_eliminated
- **Status:** ✅ ACTIVE - DO NOT DELETE

### 7. **student_scores**
- **Purpose:** Calculated scores for each student per round
- **Used by:** Score management, student dashboard
- **Columns:** id, student_id, round_id, score, correct_count, wrong_count, percentage
- **Status:** ✅ ACTIVE - DO NOT DELETE

### 8. **team_round_status**
- **Purpose:** Team qualification/elimination status per round
- **Used by:** Qualification system, elimination blocking
- **Columns:** team_id, round_id, status, message
- **Status:** ✅ ACTIVE - DO NOT DELETE

---

## ❌ UNUSED/REDUNDANT TABLES

### 9. **team_scores** ⚠️
- **Purpose:** Originally for team aggregate scores
- **Current Status:** ❌ UNUSED - Data is calculated from student_scores
- **Recommendation:** Can be DELETED or kept for future use
- **Why unused:** Team scores are calculated on-the-fly from student_scores

### 10. **evaluations** ⚠️
- **Purpose:** Judge evaluations (GD/HR rounds)
- **Current Status:** ⚠️ PARTIALLY USED (if you're using GD/HR rounds)
- **Recommendation:** Keep if using judge evaluation features

### 11. **individual_performance** ⚠️
- **Purpose:** Old performance tracking table
- **Current Status:** ❌ UNUSED - Replaced by student_scores
- **Recommendation:** Can be DELETED

### 12. **round_qualifications** ⚠️
- **Purpose:** Qualification criteria per round
- **Current Status:** ⚠️ PARTIALLY USED (if using qualification system)
- **Recommendation:** Keep if using automatic qualification

### 13. **team_members** ⚠️
- **Purpose:** Alternative team membership tracking
- **Current Status:** ❌ UNUSED - Using students table instead
- **Recommendation:** Can be DELETED

### 14. **team_round_eligibility** ⚠️
- **Purpose:** Alternative eligibility tracking
- **Current Status:** ❌ UNUSED - Using team_round_status instead
- **Recommendation:** Can be DELETED

### 15. **user_answers** ⚠️
- **Purpose:** Old answer tracking
- **Current Status:** ❌ UNUSED - Using student_answers instead
- **Recommendation:** Can be DELETED

---

## 📊 Data Flow Diagram

### Exam Flow
```
Student takes exam
    ↓
student_answers (stores each answer)
    ↓
Admin calculates scores
    ↓
student_scores (stores final scores)
    ↓
Student dashboard displays scores
```

### Qualification Flow
```
Admin sets qualification criteria
    ↓
Admin qualifies/eliminates teams
    ↓
team_round_status (stores status)
    ↓
Student dashboard checks status
    ↓
Blocks/allows access to rounds
```

### Team Management Flow
```
Admin creates team
    ↓
teams table
    ↓
Admin adds students
    ↓
students table (with team_id)
    ↓
Student logs in
    ↓
Sees team info on dashboard
```

---

## 🗑️ Safe Cleanup SQL

If you want to remove unused tables, run this SQL:

```sql
-- BACKUP FIRST! Export your database before running this!

-- Drop unused tables (ONLY if you're sure you don't need them)
DROP TABLE IF EXISTS team_scores CASCADE;
DROP TABLE IF EXISTS individual_performance CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS team_round_eligibility CASCADE;
DROP TABLE IF EXISTS user_answers CASCADE;

-- Keep these if you're using judge evaluation features:
-- DROP TABLE IF EXISTS evaluations CASCADE;
-- DROP TABLE IF EXISTS round_qualifications CASCADE;
```

⚠️ **WARNING:** Only run this after backing up your database!

---

## 🔍 How to Check What's Actually Used

Run these queries to see which tables have data:

```sql
-- Check all tables and row counts
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check specific tables
SELECT 'profiles' as table_name, COUNT(*) as rows FROM profiles
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'rounds', COUNT(*) FROM rounds
UNION ALL
SELECT 'questions', COUNT(*) FROM questions
UNION ALL
SELECT 'student_answers', COUNT(*) FROM student_answers
UNION ALL
SELECT 'student_scores', COUNT(*) FROM student_scores
UNION ALL
SELECT 'team_round_status', COUNT(*) FROM team_round_status
UNION ALL
SELECT 'team_scores', COUNT(*) FROM team_scores
UNION ALL
SELECT 'individual_performance', COUNT(*) FROM individual_performance;
```

---

## 📋 Recommended Database Structure

### Minimal Required Tables (8 tables)

1. **profiles** - User accounts
2. **teams** - Team info
3. **students** - Student info
4. **rounds** - Competition rounds
5. **questions** - Exam questions
6. **student_answers** - Exam submissions
7. **student_scores** - Calculated scores
8. **team_round_status** - Team qualification status

### Optional Tables (2 tables)

9. **evaluations** - If using judge evaluation
10. **round_qualifications** - If using auto-qualification

---

## 🎯 Current Issues & Solutions

### Issue 1: Confusion about where scores are stored

**Problem:** Multiple tables seem to store scores
- `student_scores` ✅ (USED)
- `team_scores` ❌ (UNUSED)
- `individual_performance` ❌ (UNUSED)

**Solution:** Only use `student_scores`. Team scores are calculated on-the-fly.

### Issue 2: Confusion about team membership

**Problem:** Multiple tables for team members
- `students` ✅ (USED - has team_id column)
- `team_members` ❌ (UNUSED)

**Solution:** Only use `students` table with `team_id` foreign key.

### Issue 3: Confusion about qualification status

**Problem:** Multiple tables for eligibility
- `team_round_status` ✅ (USED)
- `team_round_eligibility` ❌ (UNUSED)

**Solution:** Only use `team_round_status`.

---

## 🔧 Cleanup Steps

### Step 1: Backup Database
```bash
# In Supabase dashboard:
# Settings → Database → Backups → Create backup
```

### Step 2: Identify Unused Tables
Run the row count query above to see which tables are empty.

### Step 3: Export Data (if needed)
If any unused tables have data you want to keep, export them first.

### Step 4: Drop Unused Tables
Run the cleanup SQL above (only for confirmed unused tables).

### Step 5: Verify Application
Test all features to ensure nothing broke.

---

## 📝 Summary

### Keep These (8 core tables):
✅ profiles
✅ teams  
✅ students
✅ rounds
✅ questions
✅ student_answers
✅ student_scores
✅ team_round_status

### Can Delete These (if unused):
❌ team_scores
❌ individual_performance
❌ team_members
❌ team_round_eligibility
❌ user_answers

### Keep If Using Features:
⚠️ evaluations (for judge scoring)
⚠️ round_qualifications (for auto-qualification)

---

## 🚀 After Cleanup

Your database will be:
- ✅ Cleaner and easier to understand
- ✅ Faster queries (fewer tables to scan)
- ✅ Less confusion about where data is stored
- ✅ Easier to maintain and debug

**The application will work exactly the same, just with a cleaner database!**
