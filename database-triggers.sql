-- ============================================
-- Database Triggers for Judge Account Creation
-- ============================================

-- This trigger automatically creates a profile when a new user is created in auth.users
-- Run this in your Supabase SQL Editor

-- 1. Create or replace the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger (drop if exists first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure profiles table has the correct structure
-- Run this only if your profiles table doesn't have these columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Add index for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ============================================
-- IMPORTANT: Disable Email Confirmation
-- ============================================
-- Go to Supabase Dashboard → Authentication → Settings
-- Under "Email Auth" section:
-- 1. Disable "Enable email confirmations"
-- OR
-- 2. Enable "Enable custom SMTP" and configure your email provider

-- ============================================
-- Alternative: Auto-confirm emails for judges
-- ============================================
-- If you want to keep email confirmation for regular users
-- but auto-confirm judges, use this function:

CREATE OR REPLACE FUNCTION public.auto_confirm_judge()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm if role is judge
  IF NEW.raw_user_meta_data->>'role' LIKE 'judge%' THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-confirmation
DROP TRIGGER IF EXISTS on_judge_user_created ON auth.users;

CREATE TRIGGER on_judge_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_judge();

-- ============================================
-- Test the setup
-- ============================================
-- After running these triggers, test by creating a judge account
-- The profile should be automatically created and email should be confirmed

-- To check if triggers are working:
SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';

-- To check profiles:
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;

-- To check auth users:
SELECT id, email, email_confirmed_at, raw_user_meta_data 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
