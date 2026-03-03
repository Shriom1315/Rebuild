# Database Setup - Correct Order

## ⚠️ IMPORTANT: Run in This Order!

You have **TWO OPTIONS** for setting up your database:

## Option 1: Single File (RECOMMENDED) ✅

Run this ONE file that contains everything:

```sql
supabase-complete-schema.sql
```

This file includes:
- ✅ All main tables
- ✅ Qualification system tables
- ✅ All functions
- ✅ All triggers
- ✅ All RLS policies

**Steps:**
1. Open Supabase SQL Editor
2. Copy contents of `supabase-complete-schema.sql`
3. Paste and click "Run"
4. Done! ✅

## Option 2: Separate Files (If you prefer)

If you want to run files separately, use this EXACT order:

### Step 1: Main Schema FIRST
```sql
supabase-schema.sql
```
OR
```sql
supabase-schema-safe.sql  (if tables already exist)
```

### Step 2: Qualification System SECOND
```sql
supabase-qualification-system.sql
```

**Why this order?**
The qualification system depends on tables created in the main schema:
- `teams`
- `team_members`
- `rounds`
- `profiles`

## ❌ Common Error

If you see this error:
```
ERROR: 42P01: relation "public.team_members" does not exist
```

**Cause:** You tried to run `supabase-qualification-system.sql` BEFORE `supabase-schema.sql`

**Solution:** 
1. Run `supabase-schema.sql` first
2. Then run `supabase-qualification-system.sql`

OR just use `supabase-complete-schema.sql` instead!

## 🎯 Recommended Approach

**For New Projects:**
```bash
Use: supabase-complete-schema.sql
```

**For Existing Projects:**
```bash
1. Use: supabase-schema-safe.sql (handles existing tables)
2. Then: supabase-qualification-system.sql
```

## ✅ Verification

After running the schema, verify it worked:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- ✅ profiles
- ✅ teams
- ✅ team_members
- ✅ rounds
- ✅ team_scores
- ✅ evaluations
- ✅ questions
- ✅ user_answers
- ✅ round_qualifications
- ✅ team_round_eligibility
- ✅ individual_performance

## 🚀 Next Steps

After database setup:
1. Create admin account
2. Configure `.env` file
3. Start the application
4. Test the qualification system

## 📁 File Reference

```
Database Schema Files:
├── supabase-complete-schema.sql        ⭐ USE THIS (all-in-one)
├── supabase-schema.sql                 (main tables only)
├── supabase-schema-safe.sql            (safe version for existing DBs)
└── supabase-qualification-system.sql   (qualification tables only)
```

## 💡 Pro Tip

Always use `supabase-complete-schema.sql` for:
- ✅ New Supabase projects
- ✅ Clean database setup
- ✅ Avoiding order issues
- ✅ One-click setup

Use separate files only if:
- ❓ You need to update specific parts
- ❓ You're debugging issues
- ❓ You have existing tables

---

**Need help?** Check `QUALIFICATION_SETUP_INSTRUCTIONS.md` for complete setup guide.
