-- Make Shriom Dayal an Admin
-- Run this in Supabase SQL Editor

-- Update your account to admin role
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'shriomdayal3838@gmail.com';

-- Verify it worked
SELECT 
    id, 
    email, 
    full_name, 
    role,
    created_at
FROM public.profiles 
WHERE email = 'shriomdayal3838@gmail.com';

-- You should see role = 'admin' in the results
