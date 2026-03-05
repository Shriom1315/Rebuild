import React, { useState, useEffect, useCallback } from 'react';
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
  const [scoreRevealed, setScoreRevealed] = useState(false);
  const [eliminatedRounds, setEliminatedRounds] = useState({});

  const fetchDashboardData = useCallback(async () => {
    if (!team || !currentStudent) return;
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

      // Fetch elimination status for current student
      const { data: eliminationData } = await supabase
        .from('student_answers')
        .select('round_id, is_eliminated')
        .eq('student_id', currentStudent.id)
        .eq('is_eliminated', true);
      
      const eliminatedRoundsMap = {};
      if (eliminationData && eliminationData.length > 0) {
        eliminatedRoundsMap[currentStudent.id] = eliminationData.map(e => e.round_id);
      }
      setEliminatedRounds(eliminatedRoundsMap);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [team, currentStudent]);

  // Initial data fetch
  useEffect(() => {
    if (team && currentStudent) {
      fetchDashboardData();
    }
  }, [team, currentStudent, fetchDashboardData]);

  // ═══ REAL-TIME SUBSCRIPTIONS (WebSocket) ═══
  // Listen for changes on rounds (results_announced), team_round_status, and student_scores
  useEffect(() => {
    if (!team || !currentStudent) return;

    // Subscribe to rounds table — triggers when admin announces results
    const roundsChannel = supabase
      .channel('dashboard-rounds-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rounds' },
        (payload) => {
          console.log('[Realtime] Rounds updated:', payload);
          // Re-fetch all dashboard data when rounds change
          fetchDashboardData();
          // Show a visual indicator when scores are revealed
          if (payload.new && payload.new.results_announced) {
            setScoreRevealed(true);
            setTimeout(() => setScoreRevealed(false), 5000);
          }
        }
      )
      .subscribe();

    // Subscribe to team_round_status — triggers when team status changes
    const statusChannel = supabase
      .channel('dashboard-status-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_round_status', filter: `team_id=eq.${team.id}` },
        (payload) => {
          console.log('[Realtime] Team status updated:', payload);
          fetchDashboardData();
        }
      )
      .subscribe();

    // Subscribe to student_scores — triggers when scores are added/updated
    const scoresChannel = supabase
      .channel('dashboard-scores-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_scores', filter: `student_id=eq.${currentStudent.id}` },
        (payload) => {
          console.log('[Realtime] Student scores updated:', payload);
          fetchDashboardData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(scoresChannel);
    };
  }, [team, currentStudent, fetchDashboardData]);

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

  // Check if team is eliminated in ANY round (once eliminated, always eliminated)
  const isEliminated = teamStatus.some(s => s.status === 'eliminated');

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

      {/* ─── REAL-TIME SCORE REVEALED NOTIFICATION ─── */}
      {scoreRevealed && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.2)] animate-slideUp">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-emerald-400 text-xl animate-pulse">campaign</span>
            <div>
              <p className="text-sm font-bold text-emerald-400">Results Announced!</p>
              <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest font-black">Scores have been revealed by the admin</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── IMMERSIVE BACKGROUND ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShaderAnimation />
      </div>

      {/* ─── GLOBAL OVERLAYS ─── */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]/80"></div>
      <div className="fixed inset-0 z-[2] pointer-events-none border border-white/10 opacity-30"></div>

      <div className="relative z-10 flex flex-col min-h-screen p-4 md:p-8">

        {/* ─── CONSISTENT NAV BAR (Matched to LandingPage) ─── */}
        <header className="w-full px-6 py-5 md:py-6 mb-8 border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-lg text-white uppercase tracking-[0.3em]">Rebuild</span>
            </Link>

            <div className="flex items-center gap-6">
              {/* Live connection indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[8px] font-black text-emerald-400/70 uppercase tracking-widest">Live</span>
              </div>
              <Link
                to="/student/leaderboard"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/30 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-brand text-sm">leaderboard</span>
                <span className="text-[10px] font-black text-white uppercase tracking-wider">Rankings</span>
              </Link>
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

              {/* TEAM ELIMINATION BANNER */}
              {teamStatus.some(s => s.status === 'eliminated') && (
                <div className="relative overflow-hidden rounded-[3rem] border-2 border-red-500/50 bg-red-500/10 p-1 animate-pulse">
                  <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[2.8rem] p-10 md:p-14">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-[2rem] border-4 border-red-500 bg-red-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                          <span className="material-symbols-outlined text-5xl text-red-500">dangerous</span>
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-display text-red-500 uppercase tracking-wider mb-3">
                          TEAM ELIMINATED
                        </h2>
                        <p className="text-sm text-white/70 font-medium leading-relaxed mb-4">
                          Your team has been eliminated from the competition. Access to future rounds is restricted.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">
                              Competition Status: Terminated
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                        {currentRound.type === 'aptitude' && (() => {
                          // Check if aptitude test already submitted
                          const examSubmitted = currentStudent &&
                            localStorage.getItem(`exam_submitted_${currentStudent.id}_${currentRound.id}`);

                          if (examSubmitted) {
                            return (
                              <div className="w-full sm:w-auto px-10 py-5 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4">
                                <span className="material-symbols-outlined text-sm">task_alt</span>
                                TEST COMPLETED
                              </div>
                            );
                          }

                          return (
                            <Link
                              to="/student/exam/aptitude"
                              className="w-full sm:w-auto px-10 py-5 bg-brand hover:bg-white hover:text-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-glow-brand flex items-center justify-center gap-4 group/btn"
                            >
                              START SEQUENCE
                              <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">bolt</span>
                            </Link>
                          );
                        })()}
                        {currentRound.type === 'technical' && (
                          <div className="w-full sm:w-auto px-10 py-5 bg-purple-500/10 border-2 border-purple-500/30 text-purple-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4">
                            <span className="material-symbols-outlined text-sm">code</span>
                            EXTERNAL ASSESSMENT
                          </div>
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

                    // Check if team is eliminated for this round
                    const isTeamEliminated = status?.status === 'eliminated';
                    
                    // Check if current student is eliminated for this round
                    const isStudentEliminated = eliminatedRounds[currentStudent?.id]?.includes(round.id);

                    // If eliminated, show blocked card
                    if (isTeamEliminated || isStudentEliminated) {
                      return (
                        <div key={round.id} className="p-8 rounded-[2rem] border-2 bg-red-500/5 border-red-500/30 relative overflow-hidden">
                          {/* Diagonal stripe pattern */}
                          <div className="absolute inset-0 opacity-5" style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.5) 10px, rgba(239, 68, 68, 0.5) 20px)'
                          }}></div>
                          
                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                              <span className="text-2xl font-display font-bold text-red-500/40">0{round.round_number}</span>
                              <span className="material-symbols-outlined text-red-500 text-xl">block</span>
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest mb-1 text-red-500/80">{round.name}</h4>
                            <p className="text-[9px] text-red-500/60 font-bold uppercase tracking-widest mb-6">ELIMINATED</p>

                            <div className="pt-4 border-t border-red-500/20">
                              <div className="flex items-center gap-2 text-red-500/80">
                                <span className="material-symbols-outlined text-sm">dangerous</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                  {isTeamEliminated ? 'Team Eliminated' : 'You Are Eliminated'}
                                </span>
                              </div>
                              <p className="text-[9px] text-white/40 mt-2">
                                Access to this round is blocked
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

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
                              <span className="text-sm font-bold text-white">
                                {score.correct_count || 0}/{score.total_questions || 0} correct
                              </span>
                              <span className="text-xs text-white/40">
                                {score.wrong_count || 0} wrong • {score.percentage || 0}%
                              </span>
                              <span className="text-[8px] text-brand font-bold uppercase tracking-widest mt-1">
                                {score.score} points
                              </span>
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

// Refactored Team List Component with Individual Performance
const TeamMembersList = ({ teamId, currentStudentId }) => {
  const [members, setMembers] = useState([]);
  const [memberPerformances, setMemberPerformances] = useState({});
  const [eliminatedRounds, setEliminatedRounds] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true);
        
        // Try team_members table first (new structure)
        let { data: teamMembersData } = await supabase
          .from('team_members')
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              email,
              role
            )
          `)
          .eq('team_id', teamId);

        let membersWithProfiles = [];

        // If team_members table has data, use it
        if (teamMembersData && teamMembersData.length > 0) {
          membersWithProfiles = teamMembersData.map(tm => ({
            id: tm.profiles.id,
            full_name: tm.profiles.full_name,
            email: tm.profiles.email,
            is_captain: tm.is_captain,
            role: tm.role || 'Member'
          }));
        } else {
          // Fallback to students table (old structure)
          const { data: studentsData } = await supabase
            .from('students')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: true });

          if (studentsData && studentsData.length > 0) {
            membersWithProfiles = studentsData.map(s => ({
              id: s.id,
              full_name: s.full_name,
              email: s.email,
              roll_number: s.roll_number,
              is_captain: false,
              role: 'Member'
            }));
          }
        }

        setMembers(membersWithProfiles);

        // Fetch individual performance for each member
        const performancePromises = membersWithProfiles.map(async (member) => {
          const { data: perfData } = await supabase
            .from('student_scores')
            .select(`
              *,
              rounds!inner (name, type, round_number)
            `)
            .eq('student_id', member.id);

          // Check if student was eliminated in any round
          const { data: answersData } = await supabase
            .from('student_answers')
            .select('round_id, is_eliminated')
            .eq('student_id', member.id)
            .eq('is_eliminated', true);

          return {
            userId: member.id,
            performances: perfData || [],
            eliminatedRounds: answersData?.map(a => a.round_id) || []
          };
        });

        const performancesArray = await Promise.all(performancePromises);
        const performancesMap = {};
        const eliminatedRoundsMap = {};
        performancesArray.forEach(p => {
          performancesMap[p.userId] = p.performances;
          eliminatedRoundsMap[p.userId] = p.eliminatedRounds;
        });

        setMemberPerformances(performancesMap);
        setEliminatedRounds(eliminatedRoundsMap);
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const getTotalScore = (userId) => {
    const perfs = memberPerformances[userId] || [];
    return perfs.reduce((sum, p) => sum + (p.score || 0), 0);
  };

  const getAverageAccuracy = (userId) => {
    const perfs = memberPerformances[userId] || [];
    if (perfs.length === 0) return 0;
    const totalAccuracy = perfs.reduce((sum, p) => sum + (p.percentage || 0), 0);
    return Math.round(totalAccuracy / perfs.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no members found, show simple message
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-white/20 text-6xl mb-4">group_off</span>
        <p className="text-white/40 text-sm">No team members found</p>
        <p className="text-white/30 text-xs mt-2">Run SIMPLE_FIX.sql to add yourself to the team</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {members.map((m) => {
          const totalScore = getTotalScore(m.id);
          const avgAccuracy = getAverageAccuracy(m.id);
          const performances = memberPerformances[m.id] || [];

          return (
            <div 
              key={m.id} 
              className={`p-6 rounded-[2rem] border-2 transition-all hover:scale-105 cursor-pointer ${
                m.id === currentStudentId ? 'bg-brand/10 border-brand' : 'bg-white/5 border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex flex-col gap-4">
                {/* Member Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display text-lg ${
                    m.id === currentStudentId ? 'bg-brand text-white' : 'bg-white/10 text-white'
                  }`}>
                    {m.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{m.full_name}</p>
                    <p className="text-[10px] font-mono text-white/60 font-medium uppercase">{m.role}</p>
                    {m.is_captain && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-accent-yellow/20 text-accent-yellow text-[8px] font-bold uppercase tracking-wider rounded-full">
                        Captain
                      </span>
                    )}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Total Score</span>
                    <span className="text-sm font-bold text-white">{totalScore} pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Accuracy</span>
                    <span className="text-sm font-bold text-emerald-400">{avgAccuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Rounds</span>
                    <span className="text-sm font-bold text-white">{performances.length}</span>
                  </div>
                </div>

                {/* Performance Indicator */}
                {performances.length > 0 && (
                  <div className="pt-2">
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(avgAccuracy, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Elimination Status */}
                {eliminatedRounds[m.id]?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-500/20">
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <span className="material-symbols-outlined text-red-500 text-sm">block</span>
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                        Eliminated from {eliminatedRounds[m.id].length} round(s)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Empty Slots */}
        {[...Array(Math.max(0, 4 - members.length))].map((_, i) => (
          <div key={`empty-${i}`} className="p-6 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <span className="material-symbols-outlined text-white/30 text-4xl">group_add</span>
            <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Empty Slot</p>
          </div>
        ))}
      </div>

      {/* Detailed Performance Table */}
      {members.length > 0 && (
        <div className="mt-8 bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 overflow-hidden">
          <h4 className="text-sm font-black uppercase tracking-widest text-white/80 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-brand">leaderboard</span>
            Individual Performance Breakdown
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-white/50 uppercase tracking-wider">Member</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-white/50 uppercase tracking-wider">Rounds</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Score</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-white/50 uppercase tracking-wider">Avg Accuracy</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-white/50 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const performances = memberPerformances[member.id] || [];
                  const totalScore = getTotalScore(member.id);
                  const avgAccuracy = getAverageAccuracy(member.id);
                  
                  return (
                    <tr 
                      key={member.id} 
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        member.id === currentStudentId ? 'bg-brand/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            member.id === currentStudentId ? 'bg-brand text-white' : 'bg-white/10 text-white'
                          }`}>
                            {member.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{member.full_name}</p>
                            <p className="text-[10px] text-white/50">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-bold text-white">{performances.length}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-bold text-brand">{totalScore}</span>
                        <span className="text-[10px] text-white/40 ml-1">pts</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-sm font-bold ${
                            avgAccuracy >= 80 ? 'text-emerald-400' :
                            avgAccuracy >= 60 ? 'text-accent-yellow' :
                            'text-red-400'
                          }`}>
                            {avgAccuracy}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {(() => {
                          const hasElimination = eliminatedRounds[member.id]?.length > 0;
                          if (hasElimination) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                <span className="material-symbols-outlined text-xs">dangerous</span>
                                Terminated
                              </span>
                            );
                          } else if (performances.length > 0) {
                            return (
                              <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Active
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Pending
                              </span>
                            );
                          }
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Round-by-Round Breakdown */}
          <div className="mt-8 space-y-4">
            <h5 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">analytics</span>
              Round-by-Round Performance
            </h5>
            
            {members.map((member) => {
              const performances = memberPerformances[member.id] || [];
              if (performances.length === 0) return null;

              return (
                <details 
                  key={member.id} 
                  className="group bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden"
                >
                  <summary className="cursor-pointer p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {member.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-white">{member.full_name}</span>
                      <span className="text-[10px] text-white/40">({performances.length} rounds)</span>
                    </div>
                    <span className="material-symbols-outlined text-white/40 group-open:rotate-180 transition-transform">
                      expand_more
                    </span>
                  </summary>
                  
                  <div className="p-4 pt-0 space-y-3">
                    {performances.map((perf) => {
                      const isEliminated = eliminatedRounds[member.id]?.includes(perf.round_id);
                      
                      return (
                        <div 
                          key={perf.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isEliminated 
                              ? 'bg-red-500/10 border-red-500/30' 
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-bold text-white">{perf.rounds?.name}</p>
                              {isEliminated && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-black uppercase tracking-wider rounded-full">
                                  <span className="material-symbols-outlined text-xs">dangerous</span>
                                  TERMINATED
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/50 uppercase mt-1">{perf.rounds?.type}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-white/50 uppercase tracking-wider">Score</p>
                              <p className={`text-lg font-bold ${isEliminated ? 'text-red-400' : 'text-brand'}`}>
                                {perf.score}
                                <span className="text-xs text-white/40">/{perf.rounds?.max_score}</span>
                              </p>
                            </div>
                            {perf.metrics?.accuracy && (
                              <div className="text-right">
                                <p className="text-xs text-white/50 uppercase tracking-wider">Accuracy</p>
                                <p className={`text-lg font-bold ${isEliminated ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {perf.metrics.accuracy}%
                                </p>
                              </div>
                            )}
                            {perf.metrics?.correct_answers && (
                            <div className="text-right">
                              <p className="text-xs text-white/50 uppercase tracking-wider">Correct</p>
                              <p className="text-lg font-bold text-white">
                                {perf.metrics.correct_answers}/{perf.metrics.total_questions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
