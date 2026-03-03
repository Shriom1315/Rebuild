# Create Admin Account - Complete Guide

## 🎯 Recommended Method (Easiest & Safest)

### Option 1: Supabase Dashboard (BEST) ⭐

1. **Go to Supabase Dashboard**
   - Open your project at https://supabase.com/dashboard

2. **Navigate to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Users" tab

3. **Add New User**
   - Click "Add user" button (top right)
   - Choose "Create new user"

4. **Fill in Details**
   ```
   Email: admin@recruitsim.com
   Password: Admin@123456
   ☑ Auto Confirm User (check this!)
   ```

5. **Click "Create user"**
   - Copy the User ID that's generated

6. **Update Role to Admin**
   - Go to "SQL Editor" in Supabase
   - Run this query:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin'
   WHERE email = 'admin@recruitsim.com';
   ```

7. **Verify**
   ```sql
   SELECT id, email, full_name, role 
   FROM public.profiles 
   WHERE email = 'admin@recruitsim.com';
   ```

8. **Login**
   - Go to your app: http://localhost:3000/login
   - Email: `admin@recruitsim.com`
   - Password: `Admin@123456`
   - You'll be redirected to `/admin/teams`

---

## 🔧 Option 2: SQL Method (Advanced)

If you prefer SQL, use the `create-admin-simple.sql` file:

1. Open `create-admin-simple.sql`
2. Edit these lines (around line 70):
   ```sql
   SELECT create_admin_user(
       'admin@recruitsim.com',     -- Change email
       'Admin@123456',              -- Change password
       'System Administrator'       -- Change name
   );
   ```
3. Copy entire file contents
4. Paste in Supabase SQL Editor
5. Click "Run"
6. Check the results - should show `"success": true`

---

## 🚀 Option 3: Make Your Current Account Admin (Quickest)

If you already have an account (like `shriomdayal3838@gmail.com`):

```sql
-- Just run this in Supabase SQL Editor
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'shriomdayal3838@gmail.com';

-- Verify
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE email = 'shriomdayal3838@gmail.com';
```

Then logout and login again - you'll have admin access!

---

## 📋 Default Admin Credentials (After Setup)

**Method 1 (New Admin Account):**
```
Email: admin@recruitsim.com
Password: Admin@123456
Role: admin
```

**Method 3 (Your Current Account):**
```
Email: shriomdayal3838@gmail.com
Password: (your current password)
Role: admin (updated)
```

---

## ✅ Verification Steps

After creating admin account:

1. **Check in Database**
   ```sql
   SELECT id, email, full_name, role, created_at
   FROM public.profiles
   WHERE role = 'admin';
   ```

2. **Test Login**
   - Go to http://localhost:3000/login
   - Enter admin credentials
   - Should redirect to `/admin/teams`

3. **Check Admin Pages**
   - `/admin/teams` - Team management
   - `/admin/qualifications` - Qualification system
   - `/admin/lobby` - Live monitor
   - `/admin/questions` - Question management

---

## 🐛 Troubleshooting

### Issue: "Invalid login credentials"
**Solution:** 
- Make sure you checked "Auto Confirm User" when creating
- Or run: 
  ```sql
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE email = 'admin@recruitsim.com';
  ```

### Issue: "User not found"
**Solution:**
- User wasn't created in auth.users table
- Use Supabase Dashboard method instead

### Issue: "Redirects to student dashboard"
**Solution:**
- Role wasn't set to admin
- Run:
  ```sql
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE email = 'admin@recruitsim.com';
  ```
- Logout and login again

### Issue: "Profile doesn't exist"
**Solution:**
- The trigger didn't create the profile
- Manually create it:
  ```sql
  INSERT INTO public.profiles (id, email, full_name, role)
  SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
  FROM auth.users
  WHERE email = 'admin@recruitsim.com'
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ```

---

## 🔐 Security Best Practices

1. **Change Default Password**
   - After first login, change the password
   - Use a strong password (min 12 characters)

2. **Use Environment Variables**
   - Don't hardcode admin credentials in code
   - Store in `.env` file (never commit to git)

3. **Limit Admin Accounts**
   - Only create admin accounts for trusted users
   - Use student/judge roles for others

4. **Enable MFA (Optional)**
   - Supabase supports Multi-Factor Authentication
   - Enable for admin accounts in production

---

## 📝 Quick Reference

**Create Admin via Dashboard:**
1. Supabase → Authentication → Users → Add user
2. Email: `admin@recruitsim.com`, Password: `Admin@123456`
3. Check "Auto Confirm User"
4. SQL: `UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@recruitsim.com';`

**Create Admin via SQL:**
1. Run `create-admin-simple.sql`
2. Edit email/password in the file first
3. Verify with SELECT query

**Make Existing User Admin:**
1. SQL: `UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email';`
2. Logout and login again

---

## 🎉 Next Steps

After creating admin account:

1. ✅ Login as admin
2. ✅ Create teams in `/admin/teams`
3. ✅ Create rounds
4. ✅ Set qualification criteria in `/admin/qualifications`
5. ✅ Add students to teams
6. ✅ Start your first round!

---

**Need help?** Check the other documentation files:
- `SUPABASE_SETUP.md` - Complete Supabase setup
- `QUALIFICATION_SETUP_INSTRUCTIONS.md` - Qualification system setup
- `QUICK_START.md` - Quick start guide
