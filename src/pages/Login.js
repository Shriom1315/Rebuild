import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShaderAnimation } from '../components/ui/shader-animation';

const Login = () => {
  const navigate = useNavigate();
  const { teamLogin, selectStudent, signIn } = useAuth();

  // Mode: 'team' or 'admin'
  const [mode, setMode] = useState('team');

  // Team login state
  const [teamCode, setTeamCode] = useState('');
  const [teamData, setTeamData] = useState(null);
  const [members, setMembers] = useState([]);
  const [step, setStep] = useState('code'); // 'code' | 'select-student'

  // Admin login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Team Code Submit ──
  const handleTeamCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await teamLogin(teamCode);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setTeamData(data);
      // Fetch members will be done by context, but we need to wait
      // Get members directly
      const { supabase } = await import('../config/supabase');
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('team_id', data.id)
        .order('created_at', { ascending: true });

      setMembers(students || []);
      setStep('select-student');
      setLoading(false);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  // ── Select Student ──
  const handleSelectStudent = (student) => {
    selectStudent(student);
    navigate('/student/dashboard');
  };

  // ── Admin Login Submit ──
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Fetch profile to determine route
      const { supabase } = await import('../config/supabase');
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const roleRoutes = {
        admin: '/admin/teams',
        judge_gd: '/judge/gd-evaluation',
        judge_hr: '/judge/hr-evaluation',
      };

      navigate(roleRoutes[profile?.role] || '/admin/teams');
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="font-sans bg-[#050505] text-white min-h-screen relative overflow-hidden">

      {/* Shader Background */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/30 to-black/60"></div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header */}
        <header className="w-full px-6 sm:px-10 py-5 md:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-display text-lg text-white/80 uppercase tracking-widest group-hover:text-white transition-colors">Rebuild</span>
            </Link>
            <Link to="/" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </Link>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-center justify-center px-5 pb-10">
          <div className="max-w-sm w-full animate-slideUp">

            {/* ════════ TEAM LOGIN ════════ */}
            {mode === 'team' && (
              <>
                {step === 'code' && (
                  <>
                    {/* Title */}
                    <div className="text-center mb-8">
                      <h1 className="font-display text-3xl md:text-4xl text-white tracking-wide uppercase">
                        Enter
                      </h1>
                      <p className="mt-2 text-sm text-white/30 tracking-[0.2em] uppercase">
                        The Simulation
                      </p>
                    </div>

                    {/* Team Code Form */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8">

                      {error && (
                        <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-fadeIn">
                          <span className="material-symbols-outlined text-base">error</span>
                          {error}
                        </div>
                      )}

                      <form onSubmit={handleTeamCodeSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">Team Code</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20 text-lg">group</span>
                            <input
                              type="text"
                              value={teamCode}
                              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                              required
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all uppercase tracking-wider font-mono"
                              placeholder="ENTER YOUR TEAM CODE"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 text-white text-sm font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Verifying...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-lg">login</span>
                              Enter Simulation
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {/* ── Student Selection Step ── */}
                {step === 'select-student' && (
                  <>
                    <div className="text-center mb-8">
                      <h1 className="font-display text-2xl md:text-3xl text-white tracking-wide uppercase">
                        Select Yourself
                      </h1>
                      <p className="mt-2 text-sm text-white/30">
                        Team: <span className="text-brand font-semibold">{teamData?.team_name}</span>
                        <span className="text-white/15 mx-2">·</span>
                        <span className="font-mono text-white/40">{teamData?.team_code}</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      {members.length === 0 ? (
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-center">
                          <span className="material-symbols-outlined text-3xl text-white/20 mb-2">group_off</span>
                          <p className="text-sm text-white/30">No members found in this team.</p>
                          <p className="text-xs text-white/15 mt-1">Contact admin to add your team members.</p>
                        </div>
                      ) : (
                        members.map((student, i) => (
                          <button
                            key={student.id}
                            onClick={() => handleSelectStudent(student)}
                            className="w-full flex items-center gap-4 p-4 bg-black/40 border border-white/10 rounded-xl hover:border-brand/30 hover:bg-brand/5 transition-all group text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                              {student.full_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{student.full_name}</p>
                              {student.roll_number && (
                                <p className="text-xs text-white/30 font-mono">{student.roll_number}</p>
                              )}
                            </div>
                            <span className="material-symbols-outlined text-white/20 group-hover:text-brand transition-colors">
                              arrow_forward
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Back button */}
                    <button
                      onClick={() => { setStep('code'); setError(''); }}
                      className="mt-4 w-full text-center text-sm text-white/30 hover:text-white transition-colors"
                    >
                      ← Enter a different code
                    </button>
                  </>
                )}

                {/* Admin login link */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setMode('admin'); setError(''); }}
                    className="text-[11px] text-white/20 hover:text-white/40 transition-colors tracking-wider uppercase"
                  >
                    Admin / Judge Login →
                  </button>
                </div>
              </>
            )}

            {/* ════════ ADMIN / JUDGE LOGIN ════════ */}
            {mode === 'admin' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl md:text-4xl text-white tracking-wide uppercase">
                    Admin
                  </h1>
                  <p className="mt-2 text-sm text-white/30 tracking-[0.2em] uppercase">
                    Control Panel
                  </p>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8">

                  {error && (
                    <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-fadeIn">
                      <span className="material-symbols-outlined text-base">error</span>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleAdminSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">Email</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20 text-lg">mail</span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all"
                          placeholder="admin@rebuild.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20 text-lg">lock</span>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/10 hover:bg-white/15 text-white text-sm font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">shield</span>
                          Access Control Panel
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Back to team login */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setMode('team'); setError(''); }}
                    className="text-[11px] text-white/20 hover:text-white/40 transition-colors tracking-wider uppercase"
                  >
                    ← Back to Team Login
                  </button>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-[11px] text-white/15 tracking-wider uppercase">
                © TECH SYMPOSIUM 2K26 · <span className="text-brand/40 font-bold">DKTE's MCA</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
