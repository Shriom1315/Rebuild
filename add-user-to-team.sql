-- Add User to Team
-- Run this in Supabase SQL Editor to add yourself to a team

-- Step 1: Check your user ID
SELECT id, email, full_name FROM public.profiles;

-- Step 2: Check available teams
SELECT id, code, name FROM public.teams;

-- Step 3: Add yourself to a team
-- Replace 'YOUR_USER_ID' with your actual user ID from Step 1
-- Replace 'YOUR_TEAM_ID' with the team ID from Step 2

INSERT INTO public.team_members (team_id, user_id, is_captain)
VALUES (
    'YOUR_TEAM_ID',  -- Replace with actual team ID
    'YOUR_USER_ID',  -- Replace with your user ID
    true             -- Set to true if you want to be captain
);

-- Example:
-- INSERT INTO public.team_members (team_id, user_id, is_captain)
-- VALUES (
--     '34ea92f1-6204-4f7f-86f1-43c8e2ffa28e',
--     '0e5e4015-460a-4a10-8433-cd8c3f680bfc',
--     true
-- );

-- Step 4: Verify the addition
SELECT 
    tm.id,
    t.name as team_name,
    p.full_name as member_name,
    tm.is_captain
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
JOIN public.profiles p ON p.id = tm.user_id;
