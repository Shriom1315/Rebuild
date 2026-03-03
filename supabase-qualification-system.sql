-- Additional tables and functions for Qualification System
-- 
-- IMPORTANT: Run supabase-schema.sql FIRST before running this file!
-- This file depends on tables created in the main schema.
--

-- Verify required tables exist
DO $
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_members') THEN
        RAISE EXCEPTION 'Required table "team_members" does not exist. Please run supabase-schema.sql first.';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teams') THEN
        RAISE EXCEPTION 'Required table "teams" does not exist. Please run supabase-schema.sql first.';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rounds') THEN
        RAISE EXCEPTION 'Required table "rounds" does not exist. Please run supabase-schema.sql first.';
    END IF;
END $;

-- Round qualifications table (stores qualification criteria for each round)
CREATE TABLE IF NOT EXISTS public.round_qualifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    min_score INTEGER NOT NULL,
    max_teams INTEGER, -- Optional: limit number of teams that can qualify
    qualification_type TEXT DEFAULT 'score', -- 'score', 'percentage', 'rank'
    criteria JSONB, -- Additional criteria (e.g., {"min_attendance": 80})
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
    metrics JSONB, -- Store detailed metrics (e.g., {"accuracy": 85, "time_taken": 45})
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, round_id)
);

-- Enable RLS
ALTER TABLE public.round_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_round_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_performance ENABLE ROW LEVEL SECURITY;

-- Policies for round_qualifications
DROP POLICY IF EXISTS "Qualifications viewable by everyone" ON public.round_qualifications;
DROP POLICY IF EXISTS "Admins can manage qualifications" ON public.round_qualifications;

CREATE POLICY "Qualifications viewable by everyone"
    ON public.round_qualifications FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage qualifications"
    ON public.round_qualifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for team_round_eligibility
DROP POLICY IF EXISTS "Eligibility viewable by everyone" ON public.team_round_eligibility;
DROP POLICY IF EXISTS "Admins can manage eligibility" ON public.team_round_eligibility;

CREATE POLICY "Eligibility viewable by everyone"
    ON public.team_round_eligibility FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage eligibility"
    ON public.team_round_eligibility FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for individual_performance
DROP POLICY IF EXISTS "Users can view own performance" ON public.individual_performance;
DROP POLICY IF EXISTS "Team members can view team performance" ON public.individual_performance;
DROP POLICY IF EXISTS "Admins and judges can view all performance" ON public.individual_performance;
DROP POLICY IF EXISTS "System can insert performance" ON public.individual_performance;

CREATE POLICY "Users can view own performance"
    ON public.individual_performance FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team performance"
    ON public.individual_performance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = individual_performance.team_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and judges can view all performance"
    ON public.individual_performance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'judge', 'hr')
        )
    );

CREATE POLICY "System can insert performance"
    ON public.individual_performance FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update performance"
    ON public.individual_performance FOR UPDATE
    USING (true);

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
                -- Team didn't make the cut due to max teams limit
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
            -- Team didn't meet minimum score
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

-- Add updated_at trigger for new tables
DROP TRIGGER IF EXISTS set_updated_at ON public.round_qualifications;
DROP TRIGGER IF EXISTS set_updated_at ON public.individual_performance;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.round_qualifications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.individual_performance
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
