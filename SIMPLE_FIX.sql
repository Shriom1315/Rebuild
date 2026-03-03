-- SIMPLE FIX: Add yourself to a team
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Create a team if it doesn't exist
INSERT INTO public.teams (code, name, status, total_score)
VALUES ('TEAM001', 'Team Alpha', 'ready', 0)
ON CONFLICT (code) DO NOTHING;

-- Step 2: Add your user to the team
INSERT INTO public.team_members (team_id, user_id, is_captain, role)
SELECT 
    t.id as team_id,
    p.id as user_id,
    true as is_captain,
    'Leader' as role
FROM public.teams t
CROSS JOIN public.profiles p
WHERE t.code = 'TEAM001'
  AND p.email = 'shriomdayal3838@gmail.com'
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Step 3: Verify
SELECT 
    t.name as team_name,
    t.code,
    p.full_name,
    p.email,
    tm.is_captain
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
JOIN public.profiles p ON p.id = tm.user_id
WHERE p.email = 'shriomdayal3838@gmail.com';
