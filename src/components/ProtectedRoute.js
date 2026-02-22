import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles, teamOnly }) => {
  const { user, profile, loading, isTeamAuth, team, currentStudent } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/40 text-sm tracking-wider uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  // Team-only routes (student dashboard, exams, etc.)
  if (teamOnly) {
    if (!isTeamAuth || !team) {
      return <Navigate to="/login" replace />;
    }
    if (!currentStudent) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  // Admin/Judge routes (Supabase Auth)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    const roleRoutes = {
      admin: '/admin/teams',
      judge_gd: '/judge/gd-evaluation',
      judge_hr: '/judge/hr-evaluation',
    };
    return <Navigate to={roleRoutes[profile.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
