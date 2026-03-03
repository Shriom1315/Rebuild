-- Create Admin Account with Password
-- Run this in Supabase SQL Editor

-- This function creates a complete admin user with authentication
-- Change the email and password below to your desired credentials

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@recruitsim.com';  -- CHANGE THIS
    v_password TEXT := 'Admin@123456';        -- CHANGE THIS
    v_full_name TEXT := 'System Administrator';
BEGIN
    -- Create user in auth.users table
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),  -- Encrypt password
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', v_full_name),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO v_user_id;

    -- Create profile with admin role
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_user_id, v_email, v_full_name, 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', full_name = v_full_name;

    RAISE NOTICE 'Admin account created successfully!';
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Password: %', v_password;
    RAISE NOTICE 'User ID: %', v_user_id;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'User with email % already exists. Updating to admin role...', v_email;
        -- Update existing user to admin
        UPDATE public.profiles 
        SET role = 'admin'
        WHERE email = v_email;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating admin: %', SQLERRM;
END $$;

-- Verify the admin account was created
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
