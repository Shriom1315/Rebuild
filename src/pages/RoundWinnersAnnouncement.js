import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { ShaderAnimation } from '../components/ui/shader-animation';

const RoundWinnersAnnouncement = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(null);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    setLoading(true);
    try {
      // Get the latest completed round
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('results_announced', true)
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      if (round) {
        setCurrentRound(round);
        // Get top teams for this round
        const { data: scores } = await supabase
          .from('team_scores')
          .select('*, teams(team_name, team_code)')
          .eq('round_id', round.id)
          .eq('qualified', true)
          .order('total_score', { ascending: false });

        setWinners(scores || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen relative overflow-hidden flex flex-col">

      {/* Background Animation */}
      <div className="absolute inset-0 z-0 opacity-40">
        <ShaderAnimation />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center py-16 px-6">

        {/* Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-12 h-px bg-brand"></span>
            <span className="text-xs text-brand font-bold uppercase tracking-[0.4em]">Results Announcement</span>
            <span className="w-12 h-px bg-brand"></span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display uppercase tracking-widest text-white mb-4">
            REBUILD
          </h1>
          <p className="text-sm text-white/30 uppercase tracking-[0.3em]">
            {currentRound ? `${currentRound.name} Qualifiers` : 'Simulation Results'}
          </p>
        </div>

        {loading ? (
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
        ) : winners.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[2rem] px-12">
            <p className="text-white/20 text-sm uppercase tracking-widest font-display">No results announced yet</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-4">
            {winners.map((winner, idx) => (
              <div
                key={winner.id}
                className={`group relative overflow-hidden bg-white/[0.03] border border-white/5 rounded-2xl p-6 md:p-8 flex items-center justify-between transition-all hover:bg-white/[0.05] hover:border-brand/30 animate-slideUp`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Ranking */}
                <div className="flex items-center gap-6 md:gap-10">
                  <span className="font-display text-4xl md:text-5xl text-white/10 group-hover:text-brand/20 transition-colors">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-brand transition-colors">
                      {winner.teams.team_name}
                    </h3>
                    <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mt-1">
                      Team Code: <span className="font-mono text-white/40">{winner.teams.team_code}</span>
                    </p>
                  </div>
                </div>

                {/* Score / Status */}
                <div className="text-right">
                  <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-1">Round Score</p>
                  <p className="text-2xl md:text-3xl font-display text-white">
                    {winner.total_score}
                  </p>
                </div>

                {/* Qualified Badge */}
                <div className="absolute top-0 right-0 p-3">
                  <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase tracking-wider">
                    Qualified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 text-center animate-fadeIn animation-delay-500">
          <p className="text-[10px] text-white/15 tracking-[0.5em] uppercase font-bold">
            TECH SYMPOSIUM 2K26 · DKTE's MCA Department
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoundWinnersAnnouncement;
