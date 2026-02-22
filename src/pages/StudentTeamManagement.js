import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const StudentTeamManagement = () => {
  const navigate = useNavigate();
  const { team, currentStudent, teamMembers, signOut } = useAuth();
  const [stats, setStats] = useState({ rank: '---', score: 0 });

  useEffect(() => {
    if (team) {
      fetchTeamStats();
    }
  }, [team]);

  const fetchTeamStats = async () => {
    try {
      const { data } = await supabase
        .from('teams')
        .select('total_score')
        .eq('id', team.id)
        .single();

      if (data) {
        setStats({ rank: '12th', score: data.total_score });
      }
    } catch (e) { console.error(e); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans flex flex-col relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* CONSISTENT NAV BAR */}
      <header className="w-full px-8 py-5 md:py-6 border-b border-white/20 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/student/dashboard" className="flex items-center gap-2">
              <span className="font-display text-lg tracking-[0.3em] uppercase text-white">Rebuild</span>
            </Link>
            <div className="h-4 w-px bg-white/30 hidden md:block"></div>
            <nav className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <Link to="/student/dashboard" className="text-white/60 hover:text-white transition-all">Dashboard</Link>
              <span className="text-white/20">/</span>
              <span className="text-brand">My Team</span>
            </nav>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Squad Sync Active</span>
            </div>
            <button onClick={handleSignOut} className="text-xs text-white/60 hover:text-brand transition-all uppercase font-bold tracking-widest flex items-center gap-2">
              Logout
              <span className="material-symbols-outlined text-sm">power_settings_new</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Hero Section */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl md:text-5xl font-display uppercase tracking-wider text-white mb-2">Squad Personnel</h2>
              <p className="text-sm text-white/70 font-medium">Manage your unit members and tactical synchronization.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 border-2 border-white/20 p-5 rounded-3xl min-w-[160px] shadow-xl">
                <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em] mb-2">Total Power</p>
                <p className="text-2xl font-bold text-brand">{stats.score} <span className="text-xs text-brand/60 font-medium">PTS</span></p>
              </div>
              <div className="bg-white/5 border-2 border-white/20 p-5 rounded-3xl min-w-[160px] shadow-xl">
                <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em] mb-2">Tactical ID</p>
                <p className="text-2xl font-mono font-bold text-white tracking-widest">{team?.team_code}</p>
              </div>
            </div>
          </div>

          {/* Members Grid */}
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em]">OPERATIONAL PERSONNEL [{teamMembers.length}/4]</h3>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, idx) => (
                <div key={member.id} className={`bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-10 transition-all hover:bg-white/[0.06] hover:border-brand/60 group animate-slideUp shadow-2xl`} style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex items-center gap-6 mb-10">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-display text-2xl shadow-xl ${member.id === currentStudent?.id ? 'bg-brand text-white shadow-glow-brand' : 'bg-white/10 text-white/80'}`}>
                      {member.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xl text-white group-hover:text-brand transition-colors truncate">{member.full_name}</h4>
                      <p className="text-xs font-mono text-white/50 font-bold mt-1 tracking-wider uppercase">{member.roll_number}</p>
                    </div>
                  </div>

                  <div className="space-y-5 pt-8 border-t border-white/10">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">UNIT RANK</span>
                      <span className="text-[10px] text-brand font-black uppercase tracking-widest">{idx === 0 ? 'TEAM LEAD' : 'SPECIALIST'}</span>
                    </div>
                    <div className="px-5 py-4 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[11px] text-white/90 leading-relaxed font-medium italic">
                        "Personnel optimized for Simulation Round {team?.current_round + 1} operations."
                      </p>
                    </div>
                  </div>

                  {member.id === currentStudent?.id && (
                    <div className="mt-8 flex justify-center">
                      <span className="text-[9px] px-4 py-1.5 bg-brand text-white border-2 border-brand/20 rounded-full font-black uppercase tracking-[0.2em] shadow-glow-brand">Active Session</span>
                    </div>
                  )}
                </div>
              ))}

              {teamMembers.length < 4 && (
                <div className="bg-transparent border-2 border-dashed border-white/20 rounded-[2.5rem] p-10 flex flex-col items-center justify-center min-h-[300px] opacity-40 hover:opacity-100 hover:border-brand/40 transition-all cursor-not-allowed group">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl text-white/40 group-hover:text-brand">person_add</span>
                  </div>
                  <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.4em]">Empty Slot</p>
                  <p className="text-[10px] text-white/30 mt-3 text-center max-w-[150px]">Contact Admin Command for personnel expansion.</p>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="relative overflow-hidden bg-brand/10 border-2 border-brand/30 rounded-[3rem] p-10 md:p-16 animate-fadeInDelay">
            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
              <h3 className="text-2xl font-display uppercase tracking-[0.4em] text-white">SIMULATION PROTOCOLS</h3>
              <p className="text-sm md:text-base text-white font-medium leading-relaxed">
                Strict adherence to procedural guidelines is mandatory. Squad synchronization must be maintained at 100% during live event windows. Terminal disqualification will be enforced for any unauthorized resource access.
              </p>
              <div className="flex justify-center gap-12 pt-4">
                <div className="text-center group">
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.3em] mb-2 group-hover:text-brand transition-colors">Integrity</p>
                  <p className="text-sm font-black text-white">STRICT 1.0</p>
                </div>
                <div className="text-center group">
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.3em] mb-2 group-hover:text-brand transition-colors">Connection</p>
                  <p className="text-sm font-black text-white">LOW LATENCY</p>
                </div>
                <div className="text-center group">
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.3em] mb-2 group-hover:text-brand transition-colors">Sync</p>
                  <p className="text-sm font-black text-white">REAL-TIME</p>
                </div>
              </div>
            </div>
            {/* Glow Deco */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand/5 blur-[100px] pointer-events-none"></div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default StudentTeamManagement;
