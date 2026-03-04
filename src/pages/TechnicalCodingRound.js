import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const TechnicalCodingRound = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [timeLeft, setTimeLeft] = useState(2700); // 45 min
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(`class Solution:\n    def solve(self, input_str: str) -> str:\n        # Write your code here\n        return ""`);

  useEffect(() => {
    const fetchRoundData = async () => {
      try {
        const { data } = await supabase.from('rounds').select('*').eq('round_number', 2).single();
        if (data) {
          if (data.duration_minutes) setTimeLeft(data.duration_minutes * 60);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };

    fetchRoundData();
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = async () => {
    navigate('/student/dashboard');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-[#050505] text-white h-screen flex flex-col overflow-hidden font-sans selection:bg-brand/30">

      {/* CONSISTENT NAV BAR (Matched to LandingPage & Dashboard) */}
      <header className="h-16 border-b border-white/20 flex items-center justify-between px-8 bg-[#0a0a0a] shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/student/dashboard" className="flex items-center gap-2 group">
            <span className="font-display text-lg tracking-[0.3em] uppercase text-white transition-colors group-hover:text-brand">Rebuild</span>
          </Link>
          <div className="h-4 w-px bg-white/30 hidden md:block"></div>
          <p className="text-[10px] font-black text-white/50 tracking-[0.3em] uppercase hidden md:block">TECHNICAL_VERIFICATION_02</p>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 px-6 py-2 bg-white/5 border-2 border-white/10 rounded-full shadow-lg">
            <span className={`material-symbols-outlined text-sm ${timeLeft < 300 ? 'text-red-500 animate-pulse font-black' : 'text-brand font-black'}`}>timer</span>
            <span className={`text-sm font-mono font-bold tracking-tighter ${timeLeft < 300 ? 'text-red-500' : 'text-white'}`}>{formatTime(timeLeft)}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-brand hover:bg-white hover:text-brand text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest shadow-glow-brand"
            >
              Commit Code
            </button>
            <button onClick={handleSignOut} className="text-white/40 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-sm">power_settings_new</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left: Problem Section - HIGH CONTRAST */}
        <section className="w-2/5 border-r border-white/20 bg-[#0a0a0a] overflow-y-auto p-10">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-brand text-white text-[9px] font-black uppercase tracking-widest rounded-full">SECURITY: MEDIUM</span>
              <span className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold">STRENGTH: 100 POINTS</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-display uppercase tracking-widest text-white leading-tight">
              Dynamic Payload Verification
            </h1>

            <div className="text-sm text-white leading-relaxed font-medium space-y-6">
              <p>Initialize a subroutine to identify the <span className="text-brand font-black">Longest Palindromic Sequence</span> within the incoming data packet <code className="bg-white/10 px-2 py-1 rounded text-white font-mono font-bold">s</code>.</p>
              <p className="opacity-80">Encryption integrity requires identifying substrings that preserve character parity across their longitudinal axis.</p>
            </div>

            <div className="space-y-6 pt-6">
              <div className="p-6 bg-white/5 border-2 border-white/10 rounded-3xl shadow-xl">
                <p className="text-[10px] text-white/50 uppercase font-black mb-4 tracking-[0.2em]">Signal Example 01</p>
                <div className="space-y-3 font-mono text-xs">
                  <p className="flex items-center gap-3"><span className="text-brand font-bold uppercase tracking-widest text-[9px]">Input:</span> <span className="text-white">s = "babad"</span></p>
                  <p className="flex items-center gap-3"><span className="text-brand font-bold uppercase tracking-widest text-[9px]">Output:</span> <span className="text-white font-black">"bab"</span></p>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/10 opacity-30">
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em]">
                <span className="material-symbols-outlined text-sm">lock</span>
                CONNECTION ENCRYPTED
              </div>
            </div>
          </div>
        </section>

        {/* Right: Code Editor & Terminal */}
        <section className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
          {/* Editor Header */}
          <div className="h-10 border-b border-white/20 flex items-center px-6 bg-[#0a0a0a] shrink-0 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand shadow-glow-brand animate-pulse"></div>
              <span className="text-[10px] text-white font-black uppercase tracking-[0.4em]">Subroutine: Python_3.11</span>
            </div>
            <span className="text-[9px] text-white/40 uppercase font-black font-mono">UTF-8 // CRLF</span>
          </div>

          {/* Editor Main */}
          <div className="flex-1 p-8 font-mono text-sm overflow-y-auto leading-relaxed bg-[#050505]">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-white font-medium resize-none outline-none leading-relaxed"
              spellCheck="false"
              placeholder="# Initialize simulation code here..."
            />
          </div>

          {/* Terminal / Output */}
          <div className="h-1/3 bg-[#0a0a0a] border-t-2 border-white/20 flex flex-col shadow-2xl">
            <div className="h-10 border-b border-white/10 flex items-center px-6 bg-black/40">
              <span className="text-[10px] text-brand/80 uppercase font-black tracking-[0.5em]">SYSTEM_TERMINAL</span>
            </div>
            <div className="flex-1 p-8 space-y-4 font-mono overflow-y-auto">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 text-[11px] text-white/60 font-medium">
                  <span className="material-symbols-outlined text-xs text-white/20">data_array</span>
                  TEST_SUITE_0{i}: <span className="text-white/20 uppercase tracking-widest text-[9px]">INITIALIZING_CONNECTION...</span>
                </div>
              ))}
            </div>
            <div className="p-6 bg-black/60 flex justify-end gap-5">
              <button className="px-8 py-3 bg-white/5 border-2 border-white/10 hover:border-white/40 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white/80 hover:text-white transition-all">
                Execute Test
              </button>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
};

export default TechnicalCodingRound;
