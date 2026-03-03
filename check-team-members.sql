-- Check Team Members Data
-- Run this to see what's in your database

-- Check if you have team members
SELECT 
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.is_captain,
    tm.role,
    p.full_name,
    p.email,
    t.name as team_name
FROM public.team_members tm
JOIN public.profiles p ON p.id = tm.user_id
JOIN public.teams t ON t.id = tm.team_id;

-- If empty, check if you have students table instead
SELECT * FROM public.students LIMIT 5;

-- Check your teams
SELECT * FROM public.teams;

-- Check your profile
SELECT * FROM public.profiles WHERE email = 'shriomdayal3838@gmail.com';
