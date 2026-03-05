import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Admin/Judge auth (Supabase Auth)
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Student/Team auth (team code lookup)
  const [team, setTeam] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isTeamAuth, setIsTeamAuth] = useState(false);

  useEffect(() => {
    // Restore team session from localStorage
    const savedTeam = localStorage.getItem('rebuild_team');
    const savedStudent = localStorage.getItem('rebuild_student');
    if (savedTeam) {
      const teamData = JSON.parse(savedTeam);
      setTeam(teamData);
      setIsTeamAuth(true);
      // Fetch team members
      fetchTeamMembers(teamData.id);
      if (savedStudent) {
        setCurrentStudent(JSON.parse(savedStudent));
      }
    }

    // Check active Supabase Auth sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Team Code Login (Students) ──
  const teamLogin = async (teamCode) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('team_code', teamCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        return { data: null, error: { message: 'Invalid team code. Please check and try again.' } };
      }

      setTeam(data);
      setIsTeamAuth(true);
      localStorage.setItem('rebuild_team', JSON.stringify(data));

      // Fetch team members
      await fetchTeamMembers(data.id);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'An unexpected error occurred' } };
    }
  };

  // Select which student is using the platform
  const selectStudent = (student) => {
    setCurrentStudent(student);
    localStorage.setItem('rebuild_student', JSON.stringify(student));
  };

  // ── Admin/Judge Login (Supabase Auth) ──
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Create judge account (admin only)
  const createJudgeAccount = async (email, password, fullName, role) => {
    try {
      // Use Supabase Auth signUp with email confirmation disabled
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role, // 'judge_gd' or 'judge_hr'
          },
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;

      // If user was created, ensure profile exists
      if (data?.user) {
        // Wait a moment for trigger to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile exists, if not create it manually
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Create profile manually as fallback
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: role,
            }]);

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Don't throw error, profile might be created by trigger
          }
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // ── Sign Out ──
  const signOut = async () => {
    try {
      if (isTeamAuth) {
        // Clear team session
        setTeam(null);
        setCurrentStudent(null);
        setTeamMembers([]);
        setIsTeamAuth(false);
        localStorage.removeItem('rebuild_team');
        localStorage.removeItem('rebuild_student');
      } else {
        // Supabase Auth signout
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    // Admin/Judge
    user,
    profile,
    signIn,
    createJudgeAccount,

    // Team/Student
    team,
    currentStudent,
    teamMembers,
    isTeamAuth,
    teamLogin,
    selectStudent,

    // Common
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
