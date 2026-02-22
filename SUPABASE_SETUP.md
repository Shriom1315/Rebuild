# Supabase Setup Instructions for RecruitSim

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in the project details:
   - Name: RecruitSim
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
4. Click "Create new project"
5. Wait for the project to be set up (takes ~2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to Settings > API
2. Copy the following:
   - Project URL (under "Project URL")
   - anon/public key (under "Project API keys")

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your project:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Click "New Query"
3. Copy the entire content from `supabase-schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema

This will create:
- All necessary tables (profiles, teams, rounds, etc.)
- Row Level Security (RLS) policies
- Database functions and triggers
- Proper relationships and constraints

## Step 5: Create Default Admin Account

### Method 1: Using Supabase Dashboard

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user" > "Create new user"
3. Fill in:
   - Email: `admin@recruitsim.com`
   - Password: (choose a secure password)
   - Auto Confirm User: Yes
4. Click "Create user"

5. Go to SQL Editor and run:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@recruitsim.com';
```

### Method 2: Using SQL Only

Run this in SQL Editor (replace with your desired credentials):
```sql
-- First, create the auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
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
  'admin@recruitsim.com',
  crypt('YourSecurePassword123!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin User", "role": "admin"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- The profile will be created automatically by the trigger
-- But let's make sure the role is set to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@recruitsim.com';
```

## Step 6: Test the Setup

1. Start your React app:
```bash
npm start
```

2. Navigate to http://localhost:3000/login

3. Try logging in with your admin credentials:
   - Email: `admin@recruitsim.com`
   - Password: (the password you set)

4. You should be redirected to `/admin/teams`

## Step 7: Create Additional Test Users (Optional)

### Student User
```sql
-- Create student user via Supabase Dashboard or SQL
-- Email: student@test.com
-- The profile will automatically have role='student' (default)
```

### Judge User
```sql
-- After creating user in Auth, update their role:
UPDATE public.profiles 
SET role = 'judge' 
WHERE email = 'judge@test.com';
```

### HR User
```sql
-- After creating user in Auth, update their role:
UPDATE public.profiles 
SET role = 'hr' 
WHERE email = 'hr@test.com';
```

## Troubleshooting

### Issue: "Invalid API key"
- Double-check your `.env` file has the correct credentials
- Make sure you're using the `anon` key, not the `service_role` key
- Restart your development server after changing `.env`

### Issue: "Row Level Security policy violation"
- Make sure you ran the entire `supabase-schema.sql` file
- Check that RLS policies were created correctly in Database > Policies

### Issue: "Profile not found after login"
- Check if the `handle_new_user()` trigger is working
- Manually create a profile if needed:
```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'user-uuid-from-auth-users',
  'user@email.com',
  'User Name',
  'student'
);
```

### Issue: "Cannot read properties of null"
- Make sure the user is confirmed (email_confirmed_at is set)
- Check browser console for detailed error messages

## Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for all accounts
3. **Enable MFA** for admin accounts in production
4. **Review RLS policies** before deploying to production
5. **Use service_role key only in backend** - Never expose it in frontend

## Next Steps

1. Customize the database schema for your needs
2. Add more RLS policies as needed
3. Set up email templates in Supabase Auth settings
4. Configure OAuth providers if needed
5. Set up database backups
6. Monitor usage in Supabase dashboard

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
