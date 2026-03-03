-- ============================================================================
-- RecruitSim Complete Database Schema for Supabase
-- ============================================================================
-- This file contains the complete database schema including:
-- 1. Main tables (profiles, teams, rounds, etc.)
-- 2. Qualification system tables
-- 3. All functions and triggers
-- 4. Row Level Security policies
--
-- Run this file ONCE in Supabase SQL Editor to set up everything
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create enum for user roles
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'student', 'judge', 'hr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for team status
DO $$ 
BEGIN
    CREATE TYPE team_status AS ENUM ('ready', 'in-progress', 'eliminated', 'qualified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for round types
DO $$ 
BEGIN
    CREATE TYPE round_type AS ENUM ('aptitude', 'technical', 'gd', 'hr_interview');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status team_status DEFAULT 'ready',
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT,
    is_captain BOOLEAN DEFAULT FALSE,
    readiness INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Rounds table
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    round_number INTEGER,
    type round_type NOT NULL,
    description TEXT,
    max_score INTEGER DEFAULT 100,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    results_announced BOOLEAN DEFAULT FALSE,
    seb_max_warnings INTEGER DEFAULT 3,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team scores table
CREATE TABLE IF NOT EXISTS public.team_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, round_id)
);

-- Evaluations table (for judge scoring)
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    judge_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    criteria JSONB,
    total_score INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table (for aptitude/technical rounds)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT,
    options JSONB,
    correct_answer TEXT,
    points INTEGER DEFAULT 1,
    difficulty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User answers table
CREATE TABLE IF NOT EXISTS public.user_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    answer TEXT,
    is_correct BOOLEAN,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- ============================================================================
-- QUALIFICATION SYSTEM TABLES
-- ============================================================================

-- Round qualifications table (stores qualification criteria for each round)
CREATE TABLE IF NOT EXISTS public.round_qualifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    min_score INTEGER NOT NULL,
    max_teams INTEGER,
    qualification_type TEXT DEFAULT 'score',
    criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(round_id)
);

-- Team round eligibility table (tracks which teams are eligible for which rounds)
CREATE TABLE IF NOT EXISTS public.team_round_eligibility (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    is_eligible BOOLEAN DEFAULT FALSE,
    qualified_at TIMESTAMP WITH TIME ZONE,
    qualification_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, round_id)
);

-- Individual performance tracking
CREATE TABLE IF NOT EXISTS public.individual_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, round_id)
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check team qualification for a round
CREATE OR REPLACE FUNCTION public.check_team_qualification(
    p_team_id UUID,
    p_round_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_eligible BOOLEAN;
BEGIN
    SELECT is_eligible INTO v_is_eligible
    FROM public.team_round_eligibility
    WHERE team_id = p_team_id AND round_id = p_round_id;
    
    RETURN COALESCE(v_is_eligible, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to qualify teams based on previous round performance
CREATE OR REPLACE FUNCTION public.qualify_teams_for_next_round(
    p_current_round_id UUID,
    p_next_round_id UUID
)
RETURNS TABLE(team_id UUID, qualified BOOLEAN, reason TEXT) AS $$
DECLARE
    v_qualification RECORD;
    v_team RECORD;
    v_team_score INTEGER;
    v_qualified_count INTEGER := 0;
BEGIN
    -- Get qualification criteria for next round
    SELECT * INTO v_qualification
    FROM public.round_qualifications
    WHERE round_id = p_next_round_id;
    
    -- If no criteria set, all teams qualify
    IF v_qualification IS NULL THEN
        FOR v_team IN 
            SELECT DISTINCT ts.team_id
            FROM public.team_scores ts
            WHERE ts.round_id = p_current_round_id
        LOOP
            INSERT INTO public.team_round_eligibility (team_id, round_id, is_eligible, qualified_at, qualification_reason)
            VALUES (v_team.team_id, p_next_round_id, TRUE, NOW(), 'No criteria set - auto qualified')
            ON CONFLICT (team_id, round_id) 
            DO UPDATE SET is_eligible = TRUE, qualified_at = NOW();
            
            team_id := v_team.team_id;
            qualified := TRUE;
            reason := 'No criteria set';
            RETURN NEXT;
        END LOOP;
        RETURN;
    END IF;
    
    -- Qualify teams based on score criteria
    FOR v_team IN 
        SELECT ts.team_id, ts.score
        FROM public.team_scores ts
        WHERE ts.round_id = p_current_round_id
        ORDER BY ts.score DESC
    LOOP
        v_team_score := v_team.score;
        
        -- Check if team meets minimum score
        IF v_team_score >= v_qualification.min_score THEN
            -- Check max teams limit if set
            IF v_qualification.max_teams IS NULL OR v_qualified_count < v_qualification.max_teams THEN
                INSERT INTO public.team_round_eligibility (team_id, round_id, is_eligible, qualified_at, qualification_reason)
                VALUES (v_team.team_id, p_next_round_id, TRUE, NOW(), 
                    format('Qualified with score %s (min: %s)', v_team_score, v_qualification.min_score))
                ON CONFLICT (team_id, round_id) 
                DO UPDATE SET is_eligible = TRUE, qualified_at = NOW();
                
                v_qualified_count := v_qualified_count + 1;
                team_id := v_team.team_id;
                qualified := TRUE;
                reason := format('Score: %s >= %s', v_team_score, v_qualification.min_score);
                RETURN NEXT;
            ELSE
                INSERT INTO public.team_round_eligibility (team_id, round_id, is_eligible, qualified_at, qualification_reason)
                VALUES (v_team.team_id, p_next_round_id, FALSE, NOW(), 
                    format('Did not qualify - max teams limit reached (%s)', v_qualification.max_teams))
                ON CONFLICT (team_id, round_id) 
                DO UPDATE SET is_eligible = FALSE;
                
                team_id := v_team.team_id;
                qualified := FALSE;
                reason := 'Max teams limit reached';
                RETURN NEXT;
            END IF;
        ELSE
            INSERT INTO public.team_round_eligibility (team_id, round_id, is_eligible, qualified_at, qualification_reason)
            VALUES (v_team.team_id, p_next_round_id, FALSE, NOW(), 
                format('Did not qualify - score %s < minimum %s', v_team_score, v_qualification.min_score))
            ON CONFLICT (team_id, round_id) 
            DO UPDATE SET is_eligible = FALSE;
            
            team_id := v_team.team_id;
            qualified := FALSE;
            reason := format('Score %s < minimum %s', v_team_score, v_qualification.min_score);
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate individual performance
CREATE OR REPLACE FUNCTION public.calculate_individual_performance(
    p_user_id UUID,
    p_round_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_team_id UUID;
    v_total_score INTEGER := 0;
    v_correct_answers INTEGER := 0;
    v_total_questions INTEGER := 0;
    v_metrics JSONB;
BEGIN
    -- Get user's team
    SELECT team_id INTO v_team_id
    FROM public.team_members
    WHERE user_id = p_user_id
    LIMIT 1;
    
    -- Calculate score from answers
    SELECT 
        COUNT(*) FILTER (WHERE is_correct = TRUE),
        COUNT(*),
        COALESCE(SUM(q.points) FILTER (WHERE ua.is_correct = TRUE), 0)
    INTO v_correct_answers, v_total_questions, v_total_score
    FROM public.user_answers ua
    JOIN public.questions q ON q.id = ua.question_id
    WHERE ua.user_id = p_user_id AND ua.round_id = p_round_id;
    
    -- Build metrics JSON
    v_metrics := jsonb_build_object(
        'correct_answers', v_correct_answers,
        'total_questions', v_total_questions,
        'accuracy', CASE WHEN v_total_questions > 0 
            THEN ROUND((v_correct_answers::NUMERIC / v_total_questions) * 100, 2)
            ELSE 0 
        END
    );
    
    -- Insert or update individual performance
    INSERT INTO public.individual_performance (user_id, round_id, team_id, score, metrics)
    VALUES (p_user_id, p_round_id, v_team_id, v_total_score, v_metrics)
    ON CONFLICT (user_id, round_id)
    DO UPDATE SET 
        score = v_total_score,
        metrics = v_metrics,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.teams;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.evaluations;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.evaluations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.round_qualifications;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.round_qualifications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.individual_performance;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.individual_performance
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_round_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_performance ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Teams policies
DROP POLICY IF EXISTS "Teams viewable by everyone" ON public.teams;
CREATE POLICY "Teams viewable by everyone"
    ON public.teams FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
CREATE POLICY "Admins can manage teams"
    ON public.teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Team members policies
DROP POLICY IF EXISTS "Team members viewable by everyone" ON public.team_members;
CREATE POLICY "Team members viewable by everyone"
    ON public.team_members FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members"
    ON public.team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Rounds policies
DROP POLICY IF EXISTS "Rounds viewable by everyone" ON public.rounds;
CREATE POLICY "Rounds viewable by everyone"
    ON public.rounds FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage rounds" ON public.rounds;
CREATE POLICY "Admins can manage rounds"
    ON public.rounds FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Team scores policies
DROP POLICY IF EXISTS "Team scores viewable by everyone" ON public.team_scores;
CREATE POLICY "Team scores viewable by everyone"
    ON public.team_scores FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "System can insert team scores" ON public.team_scores;
CREATE POLICY "System can insert team scores"
    ON public.team_scores FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage team scores" ON public.team_scores;
CREATE POLICY "Admins can manage team scores"
    ON public.team_scores FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Evaluations policies
DROP POLICY IF EXISTS "Evaluations viewable by admins and judges" ON public.evaluations;
CREATE POLICY "Evaluations viewable by admins and judges"
    ON public.evaluations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'judge', 'hr')
        )
    );

DROP POLICY IF EXISTS "Judges can create evaluations" ON public.evaluations;
CREATE POLICY "Judges can create evaluations"
    ON public.evaluations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'judge', 'hr')
        )
    );

-- Questions policies
DROP POLICY IF EXISTS "Questions viewable by everyone" ON public.questions;
CREATE POLICY "Questions viewable by everyone"
    ON public.questions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions"
    ON public.questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User answers policies
DROP POLICY IF EXISTS "Users can view own answers" ON public.user_answers;
CREATE POLICY "Users can view own answers"
    ON public.user_answers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own answers" ON public.user_answers;
CREATE POLICY "Users can insert own answers"
    ON public.user_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all answers" ON public.user_answers;
CREATE POLICY "Admins can view all answers"
    ON public.user_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Qualification policies
DROP POLICY IF EXISTS "Qualifications viewable by everyone" ON public.round_qualifications;
CREATE POLICY "Qualifications viewable by everyone"
    ON public.round_qualifications FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage qualifications" ON public.round_qualifications;
CREATE POLICY "Admins can manage qualifications"
    ON public.round_qualifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Eligibility policies
DROP POLICY IF EXISTS "Eligibility viewable by everyone" ON public.team_round_eligibility;
CREATE POLICY "Eligibility viewable by everyone"
    ON public.team_round_eligibility FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage eligibility" ON public.team_round_eligibility;
CREATE POLICY "Admins can manage eligibility"
    ON public.team_round_eligibility FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Performance policies
DROP POLICY IF EXISTS "Users can view own performance" ON public.individual_performance;
CREATE POLICY "Users can view own performance"
    ON public.individual_performance FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Team members can view team performance" ON public.individual_performance;
CREATE POLICY "Team members can view team performance"
    ON public.individual_performance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = individual_performance.team_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins and judges can view all performance" ON public.individual_performance;
CREATE POLICY "Admins and judges can view all performance"
    ON public.individual_performance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'judge', 'hr')
        )
    );

DROP POLICY IF EXISTS "System can insert performance" ON public.individual_performance;
CREATE POLICY "System can insert performance"
    ON public.individual_performance FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "System can update performance" ON public.individual_performance;
CREATE POLICY "System can update performance"
    ON public.individual_performance FOR UPDATE
    USING (true);

-- ============================================================================
-- COMPLETE! 
-- ============================================================================
-- Schema setup complete. You can now:
-- 1. Create your admin account
-- 2. Start using the application
-- 3. Set qualification criteria
-- ============================================================================
