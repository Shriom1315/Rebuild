# 🚀 Quick Fix: Judge Account Issue

## Problem
❌ Judges can't login - "Email not confirmed" error
❌ Profiles not created in database

## Solution (2 Steps - 5 Minutes)

### Step 1: Run SQL Script ⚡

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy ALL content from `database-triggers.sql`
4. Paste and click **RUN**
5. ✅ Wait for "Success" message

### Step 2: Disable Email Confirmation 🔓

1. In Supabase Dashboard
2. Go to **Authentication** → **Settings**
3. Find **"Enable email confirmations"**
4. **Turn it OFF** (toggle to disabled)
5. Click **Save**

---

## That's It! ✅

Now you can:
- ✅ Create judge accounts normally
- ✅ Judges can login immediately
- ✅ Profiles auto-created
- ✅ No email confirmation needed

---

## Test It

1. Create a test judge account
2. Try logging in with judge credentials
3. Should work immediately!

---

## Fix Existing Judges (Optional)

If you already created judges, run this SQL:

```sql
-- Confirm existing judge emails
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE raw_user_meta_data->>'role' LIKE 'judge%'
AND email_confirmed_at IS NULL;

-- Create missing profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id, u.email,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'role',
  NOW(), NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
AND u.raw_user_meta_data->>'role' LIKE 'judge%';
```

---

## Need Help?

See `JUDGE-ACCOUNT-SETUP-GUIDE.md` for detailed instructions.
