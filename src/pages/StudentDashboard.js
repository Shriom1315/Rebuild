import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { ShaderAnimation } from '../components/ui/shader-animation';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { team, currentStudent, signOut } = useAuth();

  const [rounds, setRounds] = useState([]);
  const [teamStatus, setTeamStatus] = useState([]);
  const [studentScores, setStudentScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (team && currentStudent) {
      fetchDashboardData();
    }
  }, [team, currentStudent]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all rounds
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true });
      setRounds(roundsData || []);

      // Fetch team round status (qualification/elimination)
      const { data: statusData } = await supabase
        .from('team_round_status')
        .select('*')
        .eq('team_id', team.id);
      setTeamStatus(statusData || []);

      // Fetch individual scores for the current logged-in student
      const { data: scoresData } = await supabase
        .from('student_scores')
        .select('*, rounds(name, round_number)')
        .eq('student_id', currentStudent.id);
      setStudentScores(scoresData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamStatusForRound = (roundId) => {
    return teamStatus.find(ts => ts.round_id === roundId);
  };

  const getScoreForRound = (roundId) => {
    return studentScores.find(s => s.round_id === roundId);
  };

  const getCurrentRound = () => {
    return rounds.find(r => r.is_active);
  };

  const getLatestAnnouncedRound = () => {
    return [...rounds].reverse().find(r => r.results_announced);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const currentRound = getCurrentRound();
  const latestAnnounced = getLatestAnnouncedRound();
  const latestStatus = latestAnnounced ? getTeamStatusForRound(latestAnnounced.id) : null;

  // Check if team is eliminated based on latest results
  const isEliminated = latestStatus?.status === 'eliminated';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
          <div className="absolute inset-0 bg-brand/5 blur-xl animate-pulse rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-brand/30 selection:text-white">

      {/* ─── IMMERSIVE BACKGROUND ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShaderAnimation />
      </div>

      {/* ─── GLOBAL OVERLAYS ─── */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]/80"></div>
      {/* Removed the very thick border for a cleaner look consistent with landing page */}
      <div className="fixed inset-0 z-[2] pointer-events-none border border-white/10 opacity-30"></div>

      <div className="relative z-10 flex flex-col min-h-screen p-4 md:p-8">

        {/* ─── CONSISTENT NAV BAR (Matched to LandingPage) ─── */}
        <header className="w-full px-6 py-5 md:py-6 mb-8 border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-lg text-white uppercase tracking-[0.3em]">Rebuild</span>
            </Link>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end border-r border-white/20 pr-6">
                <span className="text-[10px] text-white/90 font-bold tracking-widest uppercase">{currentStudent?.full_name}</span>
                <span className="text-[8px] text-brand uppercase tracking-[0.3em] font-black">{team?.team_name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs font-medium text-white/60 hover:text-brand transition-colors tracking-wide flex items-center gap-2"
              >
                Logout
                <span className="material-symbols-outlined text-sm">power_settings_new</span>
              </button>
            </div>
          </div>
        </header>

        {/* ─── MAIN CONTENT AREA ─── */}
        <div className="max-w-7xl mx-auto w-full flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slideUp">

            {/* ── LEFT COLUMN: IDENTITY (Col-4) ── */}
            <aside className="lg:col-span-4 space-y-8">

              {/* Identity Card - INCREASED VISIBILITY */}
              <div className="relative group overflow-hidden bg-white/[0.04] border border-white/20 rounded-[2.5rem] p-10 shadow-2xl transition-all duration-500 hover:border-brand/40">
                <div className="absolute top-0 right-0 p-8">
                  <span className="material-symbols-outlined text-brand/20 text-6xl">fingerprint</span>
                </div>
                <div className="relative z-10 flex flex-col items-start gap-8">
                  <div className="w-20 h-20 rounded-[2rem] bg-brand text-white flex items-center justify-center text-4xl font-display shadow-glow-brand">
                    {currentStudent?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-display text-white uppercase tracking-wider mb-2">{currentStudent?.full_name}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-mono text-white uppercase">{currentStudent?.roll_number}</span>
                      <span className="px-3 py-1 bg-brand text-white rounded-full text-[9px] font-bold uppercase tracking-widest">AUTHORIZED ACCESS</span>
                    </div>
                  </div>
                  <div className="w-full pt-8 border-t border-white/20">
                    <p className="text-[10px] text-white/50 uppercase tracking-[0.4em] font-bold mb-4">Assigned Unit</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-white leading-tight">{team?.team_name}</span>
                        <span className="text-xs font-mono text-brand font-bold uppercase tracking-widest mt-1">{team?.team_code}</span>
                      </div>
                      <Link to="/student/team" className="p-3 bg-white/10 border border-white/20 rounded-2xl text-white hover:bg-brand hover:border-brand transition-all">
                        <span className="material-symbols-outlined text-sm">settings_input_component</span>
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Visual Corner Deco */}
                <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-brand/50 rounded-tl-[2.5rem]"></div>
              </div>

              {/* Status Pulse Banner */}
              {latestAnnounced && latestStatus && (
                <div className={`p-8 rounded-[2rem] border-2 flex flex-col items-center text-center gap-6 animate-fadeInDelay transition-all ${latestStatus.status === 'qualified'
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : latestStatus.status === 'eliminated'
                      ? 'bg-red-500/10 border-red-500/40'
                      : 'bg-white/10 border-white/20'
                  }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${latestStatus.status === 'qualified' ? 'bg-emerald-500 text-white' :
                      latestStatus.status === 'eliminated' ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                    }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {latestStatus.status === 'qualified' ? 'verified' : latestStatus.status === 'eliminated' ? 'warning' : 'hourglass_empty'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-xs font-black uppercase tracking-widest ${latestStatus.status === 'qualified' ? 'text-emerald-400' :
                        latestStatus.status === 'eliminated' ? 'text-red-400' : 'text-white'
                      }`}>
                      {latestStatus.status === 'qualified' ? 'QUALIFIED FOR NEXT PHASE' :
                        latestStatus.status === 'eliminated' ? 'SIMULATION OVER' : 'SCANNING RESULTS...'}
                    </h3>
                    <p className="text-[11px] text-white/80 font-medium leading-relaxed">
                      {latestStatus.message || (latestStatus.status === 'qualified' ? "Prepare for the technical verification phase." : "Access restricted.")}
                    </p>
                  </div>
                </div>
              )}
            </aside>

            {/* ── RIGHT COLUMN: OPERATIONS (Col-8) ── */}
            <main className="lg:col-span-8 flex flex-col gap-8">

              {/* CURRENT LIVE ROUND HERO */}
              {currentRound && !isEliminated ? (
                <div className="relative group overflow-hidden rounded-[3rem] border border-brand/50 bg-brand/10 p-1">
                  <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[2.8rem] p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className="w-24 h-24 rounded-[2rem] border-4 border-brand bg-brand/10 flex items-center justify-center text-5xl font-display text-white shadow-glow-brand animate-float">
                        {currentRound.round_number}
                      </div>
                      <div className="mt-4 px-4 py-1.5 bg-brand text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full">ACTIVE ROUND</div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl md:text-5xl font-display text-white uppercase tracking-wider mb-4">
                        {currentRound.name}
                      </h2>
                      <p className="text-sm text-white/90 font-medium leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
                        {currentRound.description || "Deploy technical protocols to secure your position in the simulation rank."}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        {(currentRound.type === 'aptitude' || currentRound.type === 'technical') && (
                          <Link
                            to={currentRound.type === 'aptitude' ? '/student/exam/aptitude' : '/student/exam/coding'}
                            className="w-full sm:w-auto px-10 py-5 bg-brand hover:bg-white hover:text-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-glow-brand flex items-center justify-center gap-4 group/btn"
                          >
                            START SEQUENCE
                            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">bolt</span>
                          </Link>
                        )}
                        <div className="flex items-center gap-3 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl">
                          <span className="material-symbols-outlined text-brand text-sm">schedule</span>
                          <span className="text-[11px] font-mono text-white/90 uppercase font-bold">{currentRound.duration_minutes} MINS ALLOCATED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[3rem] border border-white/20 bg-white/5 p-12 text-center">
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.5em] font-black mb-4">NO ACTIVE PROTOCOLS</p>
                  <h2 className="text-xl font-display text-white uppercase opacity-40">Awaiting Command Authorization</h2>
                </div>
              )}

              {/* MISSION ROADMAP */}
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <h3 className="text-[11px] text-white/80 font-black uppercase tracking-[0.4em]">Objective Roadmap</h3>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {rounds.map((round) => {
                    const status = getTeamStatusForRound(round.id);
                    const score = getScoreForRound(round.id);
                    const isLive = round.is_active;
                    const isCompleted = round.is_completed;
                    const isUpcoming = !isLive && !isCompleted;

                    return (
                      <div key={round.id} className={`p-8 rounded-[2rem] border-2 transition-all duration-300 ${isLive ? 'bg-brand/10 border-brand shadow-glow-brand translate-y-[-4px]' :
                          status?.status === 'qualified' ? 'bg-emerald-500/10 border-emerald-500/40' :
                            'bg-white/[0.04] border-white/20'
                        }`}>
                        <div className="flex justify-between items-start mb-6">
                          <span className={`text-2xl font-display font-bold ${isUpcoming ? 'text-white/20' : 'text-white'}`}>0{round.round_number}</span>
                          {isLive && <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>}
                        </div>
                        <h4 className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isUpcoming ? 'text-white/30' : 'text-white'}`}>{round.name}</h4>
                        <p className="text-[9px] text-brand font-bold uppercase tracking-widest mb-6">TYPE: {round.type}</p>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                          {score && round.results_announced ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">{score.score}<span className="text-white/40 font-normal">/{score.max_score}</span></span>
                              <span className="text-[8px] text-white/40 uppercase tracking-widest">RESULT</span>
                            </div>
                          ) : (
                            <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">{isLive ? 'LIVE' : isUpcoming ? 'QUEUED' : 'DONE'}</span>
                          )}
                          {status?.status === 'qualified' && <span className="material-symbols-outlined text-emerald-400 text-sm">stars</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SQUAD ROSTER */}
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <h3 className="text-[11px] text-white/80 font-black uppercase tracking-[0.4em]">Authorized Squad</h3>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>
                <div className="bg-white/[0.04] border border-white/20 rounded-[2.5rem] p-10">
                  <TeamMembersList teamId={team?.id} currentStudentId={currentStudent?.id} />
                </div>
              </div>

            </main>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-16 py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-center gap-4 opacity-50 px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.5em]">
            <span>DKTE MCA</span>
            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
            <span>SYSTEM BUILD 2026</span>
          </div>
          <p className="text-[11px] font-bold text-white uppercase tracking-[0.3em]">
            MISSION CRITICAL DATA · SECURE CONNECTION ACTIVE
          </p>
        </footer>

      </div>
    </div>
  );
};

// Refactored Team List Component with Increased Contrast
const TeamMembersList = ({ teamId, currentStudentId }) => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (teamId) {
      supabase.from('students').select('*').eq('team_id', teamId).order('created_at', { ascending: true })
        .then(({ data }) => setMembers(data || []));
    }
  }, [teamId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {members.map((m) => (
        <div key={m.id} className={`p-6 rounded-[2rem] border-2 transition-all ${m.id === currentStudentId ? 'bg-brand/10 border-brand' : 'bg-white/5 border-white/20'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-sm ${m.id === currentStudentId ? 'bg-brand text-white' : 'bg-white/10 text-white'
              }`}>
              {m.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{m.full_name}</p>
              <p className="text-[10px] font-mono text-white/60 font-medium">#{m.roll_number?.slice(-4) || 'CORE'}</p>
            </div>
          </div>
        </div>
      ))}
      {[...Array(Math.max(0, 4 - members.length))].map((_, i) => (
        <div key={i} className="p-6 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-white/30">group_add</span>
        </div>
      ))}
    </div>
  );
};

export default StudentDashboard;
