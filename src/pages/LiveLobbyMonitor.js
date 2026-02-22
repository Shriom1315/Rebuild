import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { ShaderAnimation } from '../components/ui/shader-animation';

const LiveLobbyMonitor = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, qualified: 0, eliminated: 0 });

  useEffect(() => {
    fetchLiveTeams();
    const channel = supabase
      .channel('live-lobby')
      .on('postgres_changes', { event: '*', table: 'teams' }, () => fetchLiveTeams())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLiveTeams = async () => {
    try {
      const { data } = await supabase
        .from('teams')
        .select(`*, students(id), team_round_status(violation_count, round_id)`)
        .order('team_name', { ascending: true });

      setTeams(data || []);

      const total = data?.length || 0;
      const active = data?.filter(t => t.status === 'active').length || 0;
      const qualified = data?.filter(t => t.status === 'qualified').length || 0;
      const eliminated = data?.filter(t => t.status === 'eliminated').length || 0;
      setStats({ total, active, qualified, eliminated });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const statusMap = {
    registered: { label: 'Registered', color: 'text-white/30', bg: 'bg-white/5', border: 'border-white/5' },
    active: { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    qualified: { label: 'Qualified', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    eliminated: { label: 'Eliminated', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-brand/30">

      {/* ─── IMMERSIVE BACKGROUND ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShaderAnimation />
      </div>

      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]/80"></div>

      {/* Compact Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-[#0a0a0a]/90 backdrop-blur-3xl border-r border-white/10 flex flex-col transition-all duration-300`}>
        <div className="p-6 border-b border-white/10">
          <h1 className="font-display text-xl text-white uppercase tracking-[0.2em]">Rebuild</h1>
          <p className="text-[9px] text-brand font-black tracking-[0.3em] uppercase mt-0.5">Admin HQ</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <Link to="/admin/teams" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined text-base">groups</span>
            Teams
          </Link>
          <Link to="/admin/questions" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined text-base">quiz</span>
            Questions
          </Link>
          <div className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand text-white shadow-glow-brand ring-1 ring-white/10">
            <span className="material-symbols-outlined text-base">monitor_heart</span>
            Live Lobby
          </div>
        </nav>

        <div className="p-6 border-t border-white/10">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all">
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10">

        {/* Mobile Nav Toggle */}
        <div className="lg:hidden sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 p-5 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <span className="material-symbols-outlined">menu_open</span>
          </button>
          <span className="font-display text-base text-white uppercase tracking-[0.2em]">REBUILD HQ</span>
          <div className="w-6"></div>
        </div>

        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">

          {/* Header Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="flex-1 relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Live_Telemetry_Feed</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wider mb-2 leading-tight">Simulation Monitor</h2>
              <p className="text-xs text-white/60 font-medium tracking-wide max-w-xl">Real-time surveillance of fleet performance and sector status.</p>
            </div>

            {/* Status Grid in Header */}
            <div className="flex gap-4 relative z-10">
              <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Sector_Active</p>
                <p className="text-xl font-display font-bold text-white">Nominal</p>
              </div>
              <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Latency</p>
                <p className="text-xl font-display font-bold text-brand">14MS</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slideUp">
            {[
              { label: 'Total Units', value: stats.total, icon: 'groups', color: 'text-white' },
              { label: 'In Operation', value: stats.active, icon: 'bolt', color: 'text-blue-400' },
              { label: 'Qualified', value: stats.qualified, icon: 'verified', color: 'text-emerald-400' },
              { label: 'Eliminated', value: stats.eliminated, icon: 'cancel', color: 'text-red-400' }
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.04] border-2 border-white/20 rounded-[1.5rem] p-6 shadow-xl hover:border-brand/40 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{s.label}</span>
                  <span className={`material-symbols-outlined text-xl ${s.color}`}>{s.icon}</span>
                </div>
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Real-time Roster */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-4 px-2">
                <h3 className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em]">Fleet Status Matrix</h3>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                    <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Scanning Sector...</span>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-20 uppercase tracking-[0.3em] text-[10px] font-black">No units online</div>
                ) : teams.map((team, idx) => (
                  <div key={team.id} className="bg-white/[0.03] border-2 border-white/10 rounded-[2rem] p-6 hover:border-brand/30 transition-all group animate-slideUp relative overflow-hidden" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div>
                        <h4 className="font-bold text-white uppercase tracking-wider group-hover:text-brand transition-colors text-sm">{team.team_name}</h4>
                        <p className="text-[9px] font-mono font-black text-white/20 mt-1 uppercase tracking-widest">{team.team_code}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border-2 ${statusMap[team.status]?.bg} ${statusMap[team.status]?.color} ${statusMap[team.status]?.border}`}>
                        {statusMap[team.status]?.label}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {[1, 2].map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-white/10 border-2 border-[#050505] flex items-center justify-center text-[8px] font-black text-white/30 overflow-hidden backdrop-blur-md">
                              {i + 1}
                            </div>
                          ))}
                        </div>
                        <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">{team.students?.length || 0} PERSONS</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        {team.team_round_status?.some(s => s.violation_count > 0) && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md mb-2">
                            <span className="material-symbols-outlined text-[10px] text-red-500">warning</span>
                            <span className="text-[8px] font-black text-red-500 uppercase">{team.team_round_status.find(s => s.violation_count > 0)?.violation_count} VIOLATIONS</span>
                          </div>
                        )}
                        <p className="text-[8px] font-black text-white/10 uppercase mb-0.5 tracking-widest">Telemetry</p>
                        <p className="text-sm font-display font-bold text-white/40">{team.total_score} <span className="text-[9px] font-black">PTS</span></p>
                      </div>

                      {/* Deco UI Element */}
                      <div className="absolute -bottom-4 -left-4 text-4xl font-display text-white/[0.03] italic font-black pointer-events-none">
                        {team.team_code.split('-')[1]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Telemetry Sidebar */}
            <div className="space-y-6">
              <div className="bg-[#0a0a0a]/40 backdrop-blur-3xl border-2 border-white/10 rounded-[2.5rem] p-8 h-fit sticky top-8">
                <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-base">analytics</span>
                  System_Payload
                </h3>
                <div className="space-y-8">
                  {[
                    { label: 'Core_Logic_Processing', value: 'NOMINAL', sub: '98.4% THRESHOLD' },
                    { label: 'Neural_Network_Matrix', value: 'ACTIVE', sub: 'SYNC_STABLE (14ms)' },
                    { label: 'Evaluation_Control', value: 'READY', sub: 'ROUND_3_HANDLERS' },
                    { label: 'Global_Broadcast', value: 'STANDBY', sub: 'ENCRYPTED_FEED' }
                  ].map((item, i) => (
                    <div key={i} className="relative pl-6 border-l-2 border-white/5 group">
                      <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-white/10 group-hover:bg-brand transition-all"></div>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{item.label}</p>
                      <p className="text-base font-display font-bold text-white/80 mt-1 uppercase tracking-wider">{item.value}</p>
                      <p className="text-[8px] font-black text-white/10 uppercase mt-1 tracking-[0.2em]">{item.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-white/[0.03] border border-white/10 rounded-2xl opacity-40">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-brand text-base">security</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Encryption_Active</span>
                  </div>
                  <p className="text-[8px] font-medium leading-relaxed uppercase tracking-wider">All transmissions between terminal and units are secured via 256-bit AES protocols.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <footer className="mt-10 py-10 border-t border-white/10 flex items-center justify-center opacity-30">
          <div className="flex items-center gap-6 text-[8px] font-black uppercase tracking-[0.4em]">
            <span>DKTE COMMAND</span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span>MONITOR_NODE_A1</span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span>2026_LIVE_FEED</span>
          </div>
        </footer>
      </main>

    </div>
  );
};

export default LiveLobbyMonitor;
