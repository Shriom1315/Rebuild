import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import SetupGuide from './pages/SetupGuide';
import AdminTeamManagement from './pages/AdminTeamManagement';
import AptitudeRoundExam from './pages/AptitudeRoundExam';
import Elimination from './pages/Elimination';
import GDJudgeEvaluation from './pages/GDJudgeEvaluation';
import HRJudgeEvaluation from './pages/HRJudgeEvaluation';
import HRPanelDashboard from './pages/HRPanelDashboard';
import LiveLobbyMonitor from './pages/LiveLobbyMonitor';
import AdminQuestionManagement from './pages/AdminQuestionManagement';
import RoundWinnersAnnouncement from './pages/RoundWinnersAnnouncement';
import StudentTeamManagement from './pages/StudentTeamManagement';
import StudentDashboard from './pages/StudentDashboard';
import TechnicalCodingRound from './pages/TechnicalCodingRound';
import DemoOne from './pages/Demo';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  return url && key && !url.includes('your-project-id') && !key.includes('your-anon-key');
};

function App() {
  // If Supabase is not configured, show setup guide
  if (!isSupabaseConfigured()) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<SetupGuide />} />
        </Routes>
      </Router>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupGuide />} />

          {/* ═══ Admin Routes (Supabase Auth) ═══ */}
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTeamManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lobby"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LiveLobbyMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminQuestionManagement />
              </ProtectedRoute>
            }
          />


          {/* ═══ Student Routes (Team Code Auth) ═══ */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute teamOnly>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/team"
            element={
              <ProtectedRoute teamOnly>
                <StudentTeamManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/aptitude"
            element={
              <ProtectedRoute teamOnly>
                <AptitudeRoundExam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/coding"
            element={
              <ProtectedRoute teamOnly>
                <TechnicalCodingRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/elimination"
            element={
              <ProtectedRoute teamOnly>
                <Elimination />
              </ProtectedRoute>
            }
          />

          {/* ═══ Judge Routes (Supabase Auth) ═══ */}
          <Route
            path="/judge/gd-evaluation"
            element={
              <ProtectedRoute allowedRoles={['judge_gd', 'admin']}>
                <GDJudgeEvaluation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge/hr-evaluation"
            element={
              <ProtectedRoute allowedRoles={['judge_hr', 'admin']}>
                <HRJudgeEvaluation />
              </ProtectedRoute>
            }
          />

          {/* ═══ HR Routes (Supabase Auth) ═══ */}
          <Route
            path="/hr/dashboard"
            element={
              <ProtectedRoute allowedRoles={['judge_hr', 'admin']}>
                <HRPanelDashboard />
              </ProtectedRoute>
            }
          />

          {/* ═══ Public Results ═══ */}
          <Route path="/results/winners" element={<RoundWinnersAnnouncement />} />

          {/* Demo / Shader Animation */}
          <Route path="/demo" element={<DemoOne />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
