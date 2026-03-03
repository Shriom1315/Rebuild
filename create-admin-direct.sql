-- Create Admin Account Directly (Bypasses Dashboard Issues)
-- Run this entire script in Supabase SQL Editor

-- Step 1: Fix the trigger first (if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Profile creation error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 2: Create admin user directly
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@dkte.ac.in';  -- CHANGE THIS
    v_password TEXT := 'Admin@123';       -- CHANGE THIS (min 6 chars)
    v_full_name TEXT := 'Admin User';
BEGIN
    -- Generate a new UUID for the user
    v_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),
        NOW(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', v_full_name)::jsonb,
        NULL,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL
    );
    
    -- Insert into profiles with admin role
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_user_id, v_email, v_full_name, 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', full_name = v_full_name;
    
    RAISE NOTICE '✅ Admin account created successfully!';
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Password: %', v_password;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'You can now login at: http://localhost:3000/login';
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE '⚠️  User already exists. Updating to admin role...';
        UPDATE public.profiles 
        SET role = 'admin'
        WHERE email = v_email;
        RAISE NOTICE '✅ User updated to admin role!';
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error: %', SQLERRM;
END $$;

-- Step 3: Verify the admin account
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ Auth user exists'
        ELSE '❌ Auth user missing'
    END as auth_status,
    CASE
        WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmed'
        ELSE '❌ Email not confirmed'
    END as email_status
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;
