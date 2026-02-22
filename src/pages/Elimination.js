import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const Elimination = () => {
  const navigate = useNavigate();
  const { team, currentStudent, signOut } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data: statusData } = await supabase
        .from('team_round_status')
        .select(`*, rounds(name, round_number)`)
        .eq('team_id', team.id)
        .eq('announced', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (statusData) {
        setStatus(statusData);
      }
    } catch (error) {
      console.error('Error fetching elimination status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  const isEliminated = status?.status === 'eliminated';
  const isQualified = status?.status === 'qualified';

  return (
    <div className="bg-[#050505] text-white min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 selection:bg-brand/30">

      {/* Background Ambience */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] blur-[150px] rounded-full opacity-30 pointer-events-none transition-colors duration-1000 ${isEliminated ? 'bg-red-500' : isQualified ? 'bg-emerald-500' : 'bg-brand'
        }`}></div>

      <div className="relative z-10 max-w-xl w-full text-center">

        {/* Status Icon - HIGH CONTRAST */}
        <div className={`w-28 h-28 mx-auto mb-10 rounded-[2.5rem] border-4 flex items-center justify-center animate-float shadow-2xl ${isEliminated ? 'bg-red-500/10 border-red-500 text-red-500 shadow-red-500/20' :
            isQualified ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-emerald-500/20' :
              'bg-white/10 border-white/20 text-white'
          }`}>
          <span className="material-symbols-outlined text-6xl">
            {isEliminated ? 'cancel' : isQualified ? 'verified' : 'hourglass_empty'}
          </span>
        </div>

        {/* Main Status Text */}
        <h1 className="text-5xl md:text-7xl font-display uppercase tracking-[0.2em] mb-6 animate-slideUp text-white">
          {isEliminated ? 'TERMINATED' : isQualified ? 'QUALIFIED' : 'SCANNING'}
        </h1>

        <div className="animate-slideUp animation-delay-100">
          <p className={`text-[11px] font-black uppercase tracking-[0.6em] mb-10 ${isEliminated ? 'text-red-400' : isQualified ? 'text-emerald-400' : 'text-brand'
            }`}>
            {status?.rounds?.name || 'SIMULATION STATUS ANALYSIS'}
          </p>

          {/* Message Box - HIGH VISIBILITY */}
          <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border-2 border-white/20 rounded-[3rem] p-10 md:p-14 mb-12 shadow-2xl">
            <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
              {status?.message || (
                isEliminated
                  ? "Your current profile has fallen below the simulation threshold. Participation authorization revoked."
                  : isQualified
                    ? "Simulation metrics confirmed. Authorization for next phase has been granted to your squad."
                    : "Primary data processors are calculating global ranks. Maintain connection for imminent update."
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {isQualified ? (
              <Link
                to="/student/dashboard"
                className="w-full sm:w-auto px-12 py-5 bg-emerald-500 hover:bg-white hover:text-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-glow-emerald"
              >
                PROCEED TO NEXT PHASE
              </Link>
            ) : isEliminated ? (
              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto px-12 py-5 bg-white text-black hover:bg-red-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl"
              >
                DISCONNECT SESSION
              </button>
            ) : (
              <Link
                to="/student/dashboard"
                className="w-full sm:w-auto px-12 py-5 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-glow-brand"
              >
                RETURN TO COMMAND
              </Link>
            )}
          </div>
        </div>

        {/* Global Footer Identifier */}
        <div className="mt-20 pt-10 border-t border-white/10 animate-fadeIn opacity-30">
          <div className="flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.5em]">
            <span>DKTE MCA</span>
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            <span>BUILD 2.0.26</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Elimination;
