-- ============================================
-- Verification Queries for Judge Account Setup
-- ============================================
-- Run these queries to verify everything is working correctly

-- 1. Check if triggers are installed
-- Expected: Should see 2 triggers (on_auth_user_created, on_judge_user_created)
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgtype as trigger_type
FROM pg_trigger 
WHERE tgname LIKE '%user%'
ORDER BY tgname;

-- 2. Check profiles table structure
-- Expected: Should have id, email, full_name, role, created_at, updated_at columns
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. List all judge accounts in auth
-- Expected: email_confirmed_at should NOT be null for judges
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' LIKE 'judge%'
ORDER BY created_at DESC;

-- 4. List all judge profiles
-- Expected: Should match the number of judges in auth.users
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role LIKE 'judge%'
ORDER BY created_at DESC;

-- 5. Find judges without profiles (should be empty)
-- Expected: No results (all judges should have profiles)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'role' as role,
  'MISSING PROFILE' as issue
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE 
  u.raw_user_meta_data->>'role' LIKE 'judge%'
  AND p.id IS NULL;

-- 6. Find judges with unconfirmed emails (should be empty)
-- Expected: No results (all judges should be confirmed)
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  'EMAIL NOT CONFIRMED' as issue
FROM auth.users 
WHERE 
  raw_user_meta_data->>'role' LIKE 'judge%'
  AND email_confirmed_at IS NULL;

-- 7. Count judges by role
-- Expected: Shows breakdown of GD and HR judges
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
WHERE role LIKE 'judge%'
GROUP BY role
ORDER BY role;

-- 8. Check recent judge creations (last 24 hours)
-- Expected: Shows recently created judges with all details
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.id IS NOT NULL as has_profile,
  u.raw_user_meta_data->>'role' as role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE 
  u.raw_user_meta_data->>'role' LIKE 'judge%'
  AND u.created_at > NOW() - INTERVAL '24 hours'
ORDER BY u.created_at DESC;

-- ============================================
-- Quick Status Check
-- ============================================
-- Run this single query to get overall status
SELECT 
  'Total Judges' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE raw_user_meta_data->>'role' LIKE 'judge%'

UNION ALL

SELECT 
  'Confirmed Emails' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE 
  raw_user_meta_data->>'role' LIKE 'judge%'
  AND email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
  'With Profiles' as metric,
  COUNT(*) as value
FROM public.profiles 
WHERE role LIKE 'judge%'

UNION ALL

SELECT 
  'Missing Profiles' as metric,
  COUNT(*) as value
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE 
  u.raw_user_meta_data->>'role' LIKE 'judge%'
  AND p.id IS NULL

UNION ALL

SELECT 
  'Unconfirmed Emails' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE 
  raw_user_meta_data->>'role' LIKE 'judge%'
  AND email_confirmed_at IS NULL;

-- ============================================
-- Expected Results for Healthy Setup:
-- ============================================
-- Total Judges: X (number of judges you created)
-- Confirmed Emails: X (same as total)
-- With Profiles: X (same as total)
-- Missing Profiles: 0
-- Unconfirmed Emails: 0

-- If any of the last two show > 0, run the fix queries from QUICK-FIX-JUDGE-ISSUE.md
