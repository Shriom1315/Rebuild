# Judge Account Setup Guide - Fix Email Confirmation Issue

## Problem
When creating judge accounts:
1. Judges are created in Supabase Auth but not in profiles table
2. Judges cannot login due to "Email not confirmed" error

## Solution Overview
We need to:
1. Disable email confirmation for judge accounts
2. Auto-create profile records when judges are created
3. Update the code to handle profile creation

---

## Step 1: Run Database Triggers (REQUIRED)

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from `database-triggers.sql`
5. Click **Run** or press `Ctrl+Enter`

### Option B: Using Supabase CLI

```bash
supabase db push
```

### What the triggers do:
- **handle_new_user()**: Automatically creates a profile when a user is created
- **auto_confirm_judge()**: Automatically confirms email for judge accounts
- Creates necessary indexes for performance

---

## Step 2: Disable Email Confirmation (REQUIRED)

### Method 1: Disable for All Users (Simplest)

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. Find **"Enable email confirmations"**
5. **Toggle it OFF** (disable it)
6. Click **Save**

### Method 2: Auto-confirm Judges Only (Better)

The database trigger `auto_confirm_judge()` in Step 1 already handles this.
It automatically confirms emails for any user with role starting with "judge".

---

## Step 3: Verify Setup

### Check Triggers are Installed

Run this query in SQL Editor:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';
```

You should see:
- `on_auth_user_created`
- `on_judge_user_created`

### Check Profiles Table Structure

Run this query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

Required columns:
- `id` (uuid)
- `email` (text)
- `full_name` (text)
- `role` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

## Step 4: Test Judge Creation

### Create a Test Judge

1. Login as admin
2. Go to Admin Team Management
3. Click "Judges" tab
4. Click "Create Judge Account"
5. Fill in details:
   - Name: Test Judge
   - Email: testjudge@example.com
   - Password: TestPass123
   - Role: GD_JUDGE or HR_JUDGE
6. Click "Authorize"

### Verify Creation

Run these queries in SQL Editor:

**Check Auth User:**
```sql
SELECT id, email, email_confirmed_at, raw_user_meta_data 
FROM auth.users 
WHERE email = 'testjudge@example.com';
```

Expected result:
- `email_confirmed_at` should have a timestamp (not null)
- `raw_user_meta_data` should contain full_name and role

**Check Profile:**
```sql
SELECT * FROM public.profiles 
WHERE email = 'testjudge@example.com';
```

Expected result:
- Record should exist
- `role` should be 'judge_gd' or 'judge_hr'
- `full_name` should match what you entered

### Test Login

1. Logout from admin
2. Go to login page
3. Enter judge credentials
4. Should login successfully without email confirmation error

---

## Step 5: Fix Existing Judges (If Any)

If you already created judges before running the triggers, fix them:

### Confirm Existing Judge Emails

```sql
-- Confirm all existing judge emails
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE 
  raw_user_meta_data->>'role' LIKE 'judge%'
  AND email_confirmed_at IS NULL;
```

### Create Missing Profiles

```sql
-- Create profiles for judges that don't have one
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'role' as role,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE 
  p.id IS NULL
  AND u.raw_user_meta_data->>'role' LIKE 'judge%';
```

---

## Troubleshooting

### Issue: "Email not confirmed" error persists

**Solution 1**: Manually confirm the email
```sql
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'judge@example.com';
```

**Solution 2**: Check if email confirmation is disabled
- Go to Authentication → Settings
- Ensure "Enable email confirmations" is OFF

### Issue: Profile not created

**Solution 1**: Check if trigger exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Solution 2**: Manually create profile
```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'user-uuid-here',
  'judge@example.com',
  'Judge Name',
  'judge_gd'
);
```

### Issue: "Profile not found" error on login

**Solution**: The profile record is missing. Run the fix query from Step 5.

### Issue: Trigger not executing

**Solution 1**: Check trigger is enabled
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```
`tgenabled` should be 'O' (enabled)

**Solution 2**: Re-create the trigger
Run the SQL from `database-triggers.sql` again.

---

## Code Changes Made

### AuthContext.js
Updated `createJudgeAccount` function to:
1. Include `emailRedirectTo` option
2. Wait for trigger to execute
3. Manually create profile as fallback if trigger fails
4. Better error handling

### Benefits
- Automatic profile creation
- No email confirmation required for judges
- Fallback mechanism if triggers fail
- Better error messages

---

## Security Considerations

### Email Confirmation Disabled
- **Risk**: Anyone can create accounts without verifying email
- **Mitigation**: Only admins can create judge accounts through the admin panel
- **Alternative**: Use Method 2 (auto-confirm judges only) to keep confirmation for other users

### Profile Creation
- **Security**: Triggers run with SECURITY DEFINER (elevated privileges)
- **Safe**: Only creates profiles for authenticated users
- **Audit**: All operations are logged in Supabase

---

## Best Practices

1. **Always use triggers**: Don't rely on client-side profile creation
2. **Test in development**: Test judge creation before deploying
3. **Monitor logs**: Check Supabase logs for any errors
4. **Backup data**: Always backup before running SQL scripts
5. **Use strong passwords**: Enforce strong passwords for judge accounts

---

## Quick Checklist

- [ ] Run database triggers SQL
- [ ] Disable email confirmation OR use auto-confirm trigger
- [ ] Test creating a new judge
- [ ] Verify profile is created
- [ ] Test judge login
- [ ] Fix existing judges if needed
- [ ] Document judge credentials securely

---

## Support

If issues persist:
1. Check Supabase logs (Dashboard → Logs)
2. Verify database triggers are installed
3. Check profiles table structure
4. Review auth.users table
5. Contact system administrator

---

## Summary

**Quick Fix (5 minutes)**:
1. Run `database-triggers.sql` in SQL Editor
2. Disable email confirmation in Auth Settings
3. Test creating a judge
4. Done!

**The triggers will automatically**:
- Create profile when judge is created
- Confirm judge email immediately
- Handle all future judge creations

No more manual intervention needed! 🎉
