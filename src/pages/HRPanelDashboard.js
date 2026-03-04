import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const HRPanelDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [finalists, setFinalists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinalists();
  }, []);

  const fetchFinalists = async () => {
    try {
      // Get teams that are in the HR round (status: qualified or in-progress for r4)
      const { data } = await supabase
        .from('teams')
        .select(`*, team_scores(*)`)
        .eq('status', 'qualified')
        .order('team_name', { ascending: true });

      setFinalists(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans flex flex-col">
      <header className="h-20 border-b border-white/5 bg-[#0a0a0a] px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg tracking-widest uppercase text-brand">Rebuild</span>
          <div className="h-4 w-px bg-white/10"></div>
          <h1 className="text-xs font-bold uppercase tracking-widest text-white/40">HR Management Control</h1>
        </div>
        <button onClick={() => signOut()} className="text-[10px] text-white/20 hover:text-red-400 transition-all uppercase font-bold tracking-[0.2em] border border-white/5 px-4 py-2 rounded-lg">Logout Session</button>
      </header>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-12">

          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h2 className="text-4xl font-display uppercase tracking-widest text-white">Final Round Queue</h2>
              <p className="text-sm text-white/30 mt-2">Manage and evaluate candidates for the terminal HR simulation phase.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Assessment Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 flex justify-center"><div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div></div>
            ) : finalists.length === 0 ? (
              <div className="col-span-full py-20 text-center text-white/10 uppercase tracking-widest text-xs border border-dashed border-white/10 rounded-3xl">No finalists currently in queue</div>
            ) : finalists.map((team, idx) => (
              <div key={team.id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 group hover:bg-white/[0.04] hover:border-brand/30 transition-all animate-slideUp" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-display text-xl">
                    {team.team_name.charAt(0)}
                  </div>
                  <span className="text-[10px] font-mono text-white/20">#{team.team_code}</span>
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-brand transition-colors">{team.team_name}</h3>

                <div className="space-y-4 pt-6 border-t border-white/5 mb-8">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-white/30">
                    <span>Simulation Progress</span>
                    <span className="text-white/60">Stage 04/04</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-3/4"></div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/judge/hr-evaluation')}
                  className="w-full py-4 bg-white/5 group-hover:bg-brand text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all border border-white/10 group-hover:border-brand"
                >
                  Start HR Interview
                </button>
              </div>
            ))}
          </div>

          {/* System Footer Info */}
          <div className="pt-20 border-t border-white/5 flex flex-col items-center gap-4 opacity-20">
            <span className="material-symbols-outlined text-4xl">terminal</span>
            <p className="text-[8px] uppercase tracking-[0.6em] font-extrabold text-center leading-loose">
              DKTE SOCIETY'S REBUILD PLATFORM · UNIT 01<br />
              HR EVALUATION SUBSYSTEM · STABLE BUILD 2026
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default HRPanelDashboard;
