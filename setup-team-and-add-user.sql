-- Complete Setup: Create Team and Add User
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check existing teams
SELECT id, code, name, status FROM public.teams;

-- Step 2: Create a new team (if needed)
-- This will create Team A or do nothing if it already exists
INSERT INTO public.teams (code, name, status)
VALUES ('TEAM001', 'Team A', 'ready')
ON CONFLICT (code) DO NOTHING
RETURNING id, code, name;

-- Step 3: Get the team ID we just created or that already exists
DO $$
DECLARE
    v_team_id UUID;
    v_user_id UUID := '0e5e4015-460a-4a10-8433-cd8c3f680bfc'; -- Shriom Dayal's ID
BEGIN
    -- Get the team ID
    SELECT id INTO v_team_id FROM public.teams WHERE code = 'TEAM001';
    
    -- Add user to team
    INSERT INTO public.team_members (team_id, user_id, is_captain, role)
    VALUES (v_team_id, v_user_id, true, 'Leader')
    ON CONFLICT (team_id, user_id) DO UPDATE
    SET is_captain = true, role = 'Leader';
    
    RAISE NOTICE 'User added to team successfully!';
END $$;

-- Step 4: Verify the setup
SELECT 
    t.code as team_code,
    t.name as team_name,
    t.status,
    p.full_name as member_name,
    p.email,
    tm.is_captain,
    tm.role
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
JOIN public.profiles p ON p.id = tm.user_id
WHERE p.email = 'shriomdayal3838@gmail.com';
