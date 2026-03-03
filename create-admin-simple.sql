-- Simple Admin Account Creation
-- This is the RECOMMENDED method for Supabase

-- STEP 1: First, you need to create the user through Supabase Dashboard or API
-- Go to: Supabase Dashboard > Authentication > Users > Add User
-- OR use this SQL to create a user (Supabase will handle password hashing):

-- For Supabase, you should use the Dashboard to create users with passwords
-- But if you want to do it via SQL, here's how:

-- Create a function to add admin user
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email TEXT,
    admin_password TEXT,
    admin_name TEXT
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Note: This requires the pgcrypto extension
    -- Supabase has this enabled by default
    
    -- Insert into auth.users (this is simplified - Supabase handles this better via Dashboard)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
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
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', admin_name)::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO new_user_id;
    
    -- The trigger will automatically create the profile
    -- But we'll update it to admin role
    UPDATE public.profiles
    SET role = 'admin', full_name = admin_name
    WHERE id = new_user_id;
    
    RETURN json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', admin_email,
        'message', 'Admin user created successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the admin user
-- CHANGE THESE VALUES:
SELECT create_admin_user(
    'admin@recruitsim.com',     -- Email
    'Admin@123456',              -- Password (min 6 characters)
    'System Administrator'       -- Full Name
);

-- Verify the admin was created
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    CASE 
        WHEN au.email IS NOT NULL THEN 'Auth user exists'
        ELSE 'Auth user missing'
    END as auth_status
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;
