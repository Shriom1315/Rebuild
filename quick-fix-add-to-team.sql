-- Quick Fix: Add Shriom Dayal to Team A
-- Copy and paste this into Supabase SQL Editor and click Run

-- Add user to team_members table
INSERT INTO public.team_members (team_id, user_id, is_captain, role)
VALUES (
    '34ea92f1-6204-4f7f-86f1-43c8e2ffa28e',  -- Team A ID
    '0e5e4015-460a-4a10-8433-cd8c3f680bfc',  -- Shriom Dayal's user ID
    true,                                      -- Make captain
    'Leader'                                   -- Role
)
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Verify it worked
SELECT 
    t.name as team_name,
    t.code as team_code,
    p.full_name as member_name,
    p.email,
    tm.is_captain,
    tm.role
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
JOIN public.profiles p ON p.id = tm.user_id
WHERE p.email = 'shriomdayal3838@gmail.com';
