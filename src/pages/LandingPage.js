import React from 'react';
import { Link } from 'react-router-dom';
import { ShaderAnimation } from '../components/ui/shader-animation';

const LandingPage = () => {
  return (
    <div className="bg-[#050505] text-white min-h-screen flex flex-col font-sans overflow-hidden relative">

      {/* Shader Background — fullscreen */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Nav — minimal */}
        <header className="w-full px-6 sm:px-10 py-5 md:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-white/80 uppercase tracking-widest">Rebuild</span>
            </div>
            <Link
              to="/login"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors tracking-wide"
            >
              Login
            </Link>
          </div>
        </header>

        {/* Center — Main branding */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-26 md:-mt-4">

          {/* Top label */}
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-5 md:mb-6">
              <span className="w-10 h-px bg-brand"></span>
              <span className="text-[11px] md:text-xs text-brand font-bold uppercase tracking-[0.3em]">Corporate Simulation</span>
              <span className="w-10 h-px bg-brand"></span>
            </div>
          </div>

          {/* Main title — wide letter spacing */}
          <div className="animate-slideUp animation-delay-100">
            <h1 className="font-display text-[clamp(3.5rem,12vw,7rem)] text-white leading-[0.85] tracking-[0.15em] md:tracking-[0.2em] uppercase">
              Rebuild
            </h1>
          </div>

          {/* Subtitle */}
          <div className="animate-slideUp animation-delay-200">
            <p className="mt-2 md:mt-3 text-sm md:text-base text-white/35 tracking-[0.4em] uppercase font-medium">
              The Simulation
            </p>
          </div>

          {/* Divider line */}
          <div className="animate-fadeIn animation-delay-400">
            <div className="w-12 h-px bg-white/10 mx-auto mt-5 md:mt-6"></div>
          </div>

          {/* Short tagline */}
          <div className="animate-slideUp animation-delay-500">
            <p className="mt-4 md:mt-5 text-sm text-white/30 max-w-md leading-relaxed">
              A multi-round competitive simulation that mirrors real corporate recruitment. Prove your skills. Rise to the top.
            </p>
          </div>

          {/* Info chips */}
          <div className="animate-slideUp animation-delay-600">
            <div className="mt-4 md:mt-5 flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
              {[
                { icon: 'groups', label: 'Team Based' },
                { icon: 'bolt', label: '4 Rounds' },
                { icon: 'filter_alt', label: 'Elimination' },
                { icon: 'emoji_events', label: 'Live' },
              ].map((chip, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-white/5 text-[11px] md:text-xs text-white/40 font-medium tracking-wider uppercase">
                  <span className="material-symbols-outlined text-xs text-brand/70">{chip.icon}</span>
                  {chip.label}
                </div>
              ))}
            </div>
          </div>

          {/* Login CTA */}
          <div className="animate-slideUp animation-delay-700">
            <Link
              to="/login"
              className="mt-6 md:mt-8 inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 hover:border-white/20 text-white text-sm font-medium py-3 px-8 rounded-full transition-all duration-300 group"
            >
              Enter Platform
              <span className="material-symbols-outlined text-base text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                arrow_forward
              </span>
            </Link>
          </div>
        </main>

        {/* Bottom bar */}
        <footer className="w-full px-6 sm:px-10 py-5 md:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-[11px] text-white/15 tracking-wider uppercase">
              MADE By <span className="text-brand font-bold"> DKTE's MCA</span> Department
            </p>
            <p className="text-[11px] text-white/15 tracking-wider">
              © TECH SYMPOSIUM 2K26
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
