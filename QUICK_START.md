# Quick Start Guide - RecruitSim

Get RecruitSim up and running in 10 minutes!

## Prerequisites

- Node.js (v14+) installed
- A Supabase account (free tier works)
- Git (optional)

## Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

## Step 2: Set Up Supabase (5 minutes)

### 2.1 Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it "RecruitSim"
4. Choose a password and region
5. Wait for setup to complete

### 2.2 Get Credentials
1. Go to Settings > API
2. Copy "Project URL"
3. Copy "anon public" key

### 2.3 Configure Environment
Create `.env` file:
```bash
REACT_APP_SUPABASE_URL=your_project_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 2.4 Set Up Database
1. Go to SQL Editor in Supabase
2. Copy all content from `supabase-schema.sql`
3. Paste and click "Run"

## Step 3: Create Admin Account (2 minutes)

### Option A: Via Supabase Dashboard
1. Go to Authentication > Users
2. Click "Add user"
3. Email: `admin@recruitsim.com`
4. Password: (your choice)
5. Check "Auto Confirm User"
6. Click "Create user"

Then run in SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@recruitsim.com';
```

### Option B: Via SQL Only
Run in SQL Editor (replace password):
```sql
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@recruitsim.com',
  crypt('YourPassword123!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin User", "role": "admin"}'::jsonb,
  NOW(), NOW(), '', '', '', ''
);

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@recruitsim.com';
```

## Step 4: Start the App (1 minute)

```bash
npm start
```

App opens at http://localhost:3000

## Step 5: Test Login

1. Go to http://localhost:3000/login
2. Enter:
   - Email: `admin@recruitsim.com`
   - Password: (what you set)
3. Click "Sign In"
4. You should be redirected to `/admin/teams`

## That's It! 🎉

You now have a working RecruitSim installation with:
- ✅ Supabase backend
- ✅ Authentication system
- ✅ Admin account
- ✅ Role-based routing

## Next Steps

### Create Test Users

**Student Account:**
```sql
-- Create in Auth > Users, then:
UPDATE public.profiles 
SET role = 'student' 
WHERE email = 'student@test.com';
```

**Judge Account:**
```sql
UPDATE public.profiles 
SET role = 'judge' 
WHERE email = 'judge@test.com';
```

**HR Account:**
```sql
UPDATE public.profiles 
SET role = 'hr' 
WHERE email = 'hr@test.com';
```

### Add Sample Data

**Create a Team:**
```sql
INSERT INTO public.teams (code, name, status, total_score)
VALUES ('RS-1001', 'Team Alpha', 'ready', 0);
```

**Create a Round:**
```sql
INSERT INTO public.rounds (name, type, description, max_score, duration_minutes)
VALUES ('Aptitude Test', 'aptitude', 'General aptitude assessment', 100, 60);
```

## Troubleshooting

### "Invalid API key"
- Check `.env` file has correct values
- Restart dev server: `Ctrl+C` then `npm start`

### "Cannot connect to Supabase"
- Verify Supabase project is running
- Check internet connection
- Verify credentials in `.env`

### "Login not working"
- Check user exists in Supabase Auth
- Verify profile was created in `profiles` table
- Check browser console for errors

### "Redirected to wrong page"
- Verify user's role in `profiles` table
- Check RLS policies are set up correctly

## Need More Help?

- **Detailed Setup**: See `SUPABASE_SETUP.md`
- **API Reference**: See `API_REFERENCE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Supabase Docs**: https://supabase.com/docs

## Common Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Check for issues
npm run lint
```

## Project Structure

```
recruitsim-react/
├── src/
│   ├── components/       # Reusable components
│   ├── config/          # Configuration files
│   ├── contexts/        # React contexts
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── App.js           # Main app component
├── .env                 # Environment variables (create this)
├── .env.example         # Environment template
└── supabase-schema.sql  # Database schema
```

## Default Credentials

After setup, you can login with:
- **Email**: `admin@recruitsim.com`
- **Password**: (what you set during setup)

## What's Next?

1. **Explore the App**: Navigate through different pages
2. **Create More Users**: Add students, judges, HR users
3. **Add Data**: Create teams, rounds, questions
4. **Customize**: Modify pages to fit your needs
5. **Deploy**: When ready, deploy to production

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the detailed documentation
3. Check Supabase dashboard for errors
4. Look at browser console for error messages

Happy coding! 🚀
