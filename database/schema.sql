-- ============================================
-- REBUILD : The Simulation — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES (Admin & Judges only — Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'judge_gd', 'judge_hr')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TEAMS
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_code TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'qualified', 'eliminated')),
  current_round INT DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. STUDENTS (members of teams)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ROUNDS
-- ============================================
CREATE TABLE IF NOT EXISTS rounds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('aptitude', 'technical', 'gd', 'hr')),
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  results_announced BOOLEAN DEFAULT FALSE,
  duration_minutes INT DEFAULT 30,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  seb_max_warnings INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. QUESTIONS (Aptitude & Technical rounds)
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT NOT NULL,  -- 'a', 'b', 'c', or 'd'
  points INT DEFAULT 1,
  question_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. STUDENT ANSWERS (individual responses)
-- ============================================
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
  selected_answer TEXT,  -- 'a', 'b', 'c', or 'd'
  is_correct BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, question_id)
);

-- ============================================
-- 7. STUDENT SCORES (individual per round)
-- Used by judges to see past performance
-- ============================================
CREATE TABLE IF NOT EXISTS student_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  remarks TEXT,
  evaluated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, round_id)
);

-- ============================================
-- 8. TEAM SCORES (aggregated per round)
-- ============================================
CREATE TABLE IF NOT EXISTS team_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
  total_score NUMERIC DEFAULT 0,
  average_score NUMERIC DEFAULT 0,
  qualified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, round_id)
);

-- ============================================
-- 9. TEAM ROUND STATUS (qualification per round)
-- ============================================
CREATE TABLE IF NOT EXISTS team_round_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'qualified', 'eliminated')),
  announced BOOLEAN DEFAULT FALSE,
  message TEXT,
  violation_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, round_id)
);

-- ============================================
-- INSERT DEFAULT ROUNDS
-- ============================================
INSERT INTO rounds (round_number, name, type, description, duration_minutes) VALUES
  (1, 'Aptitude Test', 'aptitude', 'Multiple choice aptitude and reasoning test', 30),
  (2, 'Technical Round', 'technical', 'Technical knowledge and coding challenges', 45),
  (3, 'Group Discussion', 'gd', 'Group strategy pitch and discussion evaluation', 20),
  (4, 'HR Interview', 'hr', 'Final HR interview and soft skills evaluation', 15)
ON CONFLICT (round_number) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_round_status ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES — ANON (Students via team code)
-- ============================================

-- Teams: anon can read (for team code lookup)
CREATE POLICY "anon_teams_select" ON teams FOR SELECT TO anon USING (true);

-- Students: anon can read (to show team members after login)
CREATE POLICY "anon_students_select" ON students FOR SELECT TO anon USING (true);

-- Rounds: anon can read (to see current round info)
CREATE POLICY "anon_rounds_select" ON rounds FOR SELECT TO anon USING (true);

-- Questions: anon can read (to display questions during exam)
CREATE POLICY "anon_questions_select" ON questions FOR SELECT TO anon USING (true);

-- Student answers: anon can read and write (students submit answers)
CREATE POLICY "anon_answers_select" ON student_answers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_answers_insert" ON student_answers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_answers_update" ON student_answers FOR UPDATE TO anon USING (true);

-- Student scores: anon can read (students view their scores)
CREATE POLICY "anon_student_scores_select" ON student_scores FOR SELECT TO anon USING (true);

-- Team scores: anon can read
CREATE POLICY "anon_team_scores_select" ON team_scores FOR SELECT TO anon USING (true);

-- Team round status: anon can read
CREATE POLICY "anon_team_round_status_select" ON team_round_status FOR SELECT TO anon USING (true);

-- Profiles: anon can read (for judge names, etc.)
CREATE POLICY "anon_profiles_select" ON profiles FOR SELECT TO anon USING (true);

-- ============================================
-- RLS POLICIES — AUTHENTICATED (Admin & Judges)
-- ============================================

-- Profiles
CREATE POLICY "auth_profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_profiles_update" ON profiles FOR UPDATE TO authenticated USING (true);

-- Teams: full access
CREATE POLICY "auth_teams_all" ON teams FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Students: full access
CREATE POLICY "auth_students_all" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Rounds: full access
CREATE POLICY "auth_rounds_all" ON rounds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Questions: full access
CREATE POLICY "auth_questions_all" ON questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Student answers: full access
CREATE POLICY "auth_answers_all" ON student_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Student scores: full access
CREATE POLICY "auth_student_scores_all" ON student_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Team scores: full access
CREATE POLICY "auth_team_scores_all" ON team_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Team round status: full access
CREATE POLICY "auth_team_round_status_all" ON team_round_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGER: Auto-create profile on auth signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTION: Calculate team score for round
-- ============================================
CREATE OR REPLACE FUNCTION calculate_team_round_score(p_team_id UUID, p_round_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(ss.score), 0) INTO total
  FROM student_scores ss
  JOIN students s ON ss.student_id = s.id
  WHERE s.team_id = p_team_id AND ss.round_id = p_round_id;
  
  -- Upsert team score
  INSERT INTO team_scores (team_id, round_id, total_score, average_score)
  VALUES (
    p_team_id,
    p_round_id,
    total,
    total / NULLIF((SELECT COUNT(*) FROM students WHERE team_id = p_team_id), 0)
  )
  ON CONFLICT (team_id, round_id)
  DO UPDATE SET
    total_score = EXCLUDED.total_score,
    average_score = EXCLUDED.average_score;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
