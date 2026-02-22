import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const SetupGuide = () => {
  const [status, setStatus] = useState({
    envConfigured: false,
    supabaseConnected: false,
    databaseSetup: false,
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    const envConfigured =
      process.env.REACT_APP_SUPABASE_URL &&
      process.env.REACT_APP_SUPABASE_ANON_KEY &&
      !process.env.REACT_APP_SUPABASE_URL.includes('your-project-id') &&
      !process.env.REACT_APP_SUPABASE_ANON_KEY.includes('your-anon-key');

    let supabaseConnected = false;
    let databaseSetup = false;

    if (envConfigured) {
      try {
        const { error } = await supabase.from('profiles').select('count').limit(1);
        supabaseConnected = !error;
        databaseSetup = !error;
      } catch (err) {
        console.error('Connection test failed:', err);
      }
    }

    setStatus({ envConfigured, supabaseConnected, databaseSetup });
  };

  const StatusItem = ({ title, description, completed, step }) => (
    <div className="feature-card flex items-start gap-4 !p-5">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${completed
        ? 'bg-green-50 text-green-600 border-2 border-green-200'
        : 'bg-light-100 text-dark-100 border-2 border-light-200'
        }`}>
        {completed ? (
          <span className="material-symbols-outlined text-lg">check</span>
        ) : step}
      </div>
      <div className="flex-1">
        <h3 className="font-display text-base md:text-lg text-dark mb-1">{title}</h3>
        <p className="text-sm text-dark-100">{description}</p>
      </div>
    </div>
  );

  const allComplete = status.envConfigured && status.supabaseConnected && status.databaseSetup;

  return (
    <div className="min-h-screen bg-white font-sans p-4 md:p-6 relative overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute top-[10%] right-[5%] w-72 h-72 bg-brand/5 animate-blob pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14 pt-6 animate-slideUp">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="font-display text-3xl md:text-4xl text-dark uppercase">Rebuild</span>
            <span className="text-dark/30 font-light mx-1.5">|</span>
            <span className="text-sm text-brand font-medium tracking-wider uppercase">Setup</span>
          </div>
          <p className="text-base text-dark-100">
            {allComplete
              ? '🎉 Setup complete! You can now use the platform.'
              : 'Follow these steps to complete your setup'}
          </p>
        </div>

        {/* Status Steps */}
        <div className="space-y-3 mb-8 animate-slideUp animation-delay-200">
          <StatusItem step="1" title="Configure Environment Variables" description="Create a .env file with your Supabase credentials" completed={status.envConfigured} />
          <StatusItem step="2" title="Connect to Supabase" description="Verify connection to your Supabase project" completed={status.supabaseConnected} />
          <StatusItem step="3" title="Set Up Database" description="Run the database schema in Supabase SQL Editor" completed={status.databaseSetup} />
        </div>

        {!allComplete && (
          <div className="bg-brand/5 border border-brand/15 rounded-2xl p-6 md:p-8 animate-slideUp animation-delay-400">
            <h3 className="font-display text-lg text-dark mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">info</span>
              Next Steps
            </h3>

            {!status.envConfigured && (
              <div className="mb-6">
                <h4 className="font-bold text-dark mb-3 text-sm">1. Set up Supabase Project</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-dark-100">
                  <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-600 underline underline-offset-2">supabase.com/dashboard</a></li>
                  <li>Create a new project named "Rebuild"</li>
                  <li>Go to Settings → API</li>
                  <li>Copy your Project URL and anon/public key</li>
                  <li>Update the <code className="bg-light-100 text-brand-600 px-2 py-0.5 rounded-md text-xs font-mono">.env</code> file</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            )}

            {status.envConfigured && !status.databaseSetup && (
              <div className="mb-6">
                <h4 className="font-bold text-dark mb-3 text-sm">2. Set up Database Schema</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-dark-100">
                  <li>Open Supabase dashboard → SQL Editor</li>
                  <li>Copy content from <code className="bg-light-100 text-brand-600 px-2 py-0.5 rounded-md text-xs font-mono">supabase-schema.sql</code></li>
                  <li>Paste and click "Run"</li>
                  <li>Refresh this page to verify</li>
                </ol>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={checkSetupStatus} className="btn-pill-brand text-sm py-2.5 px-6">
                <span className="material-symbols-outlined text-lg">refresh</span>
                Check Status
              </button>
              <a href="/QUICK_START.md" target="_blank" className="btn-pill-outline text-sm py-2.5 px-6">
                <span className="material-symbols-outlined text-lg">description</span>
                View Full Guide
              </a>
            </div>
          </div>
        )}

        {allComplete && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 md:p-10 text-center animate-scaleIn">
            <div className="w-16 h-16 mx-auto mb-5 bg-green-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
            </div>
            <h3 className="font-display text-2xl text-dark mb-2">Setup Complete!</h3>
            <p className="text-dark-100 mb-8">Your REBUILD platform is ready to use.</p>
            <a href="/login" className="btn-pill-brand text-sm inline-flex">
              <span className="material-symbols-outlined text-lg">login</span>
              Go to Login
            </a>
          </div>
        )}

        <div className="mt-10 text-center text-sm text-dark-100 animate-fadeIn animation-delay-600">
          <p className="mb-3">Need help? Check the documentation:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/QUICK_START.md" className="text-brand hover:text-brand-600 transition-colors">Quick Start</a>
            <a href="/SUPABASE_SETUP.md" className="text-brand hover:text-brand-600 transition-colors">Detailed Setup</a>
            <a href="/API_REFERENCE.md" className="text-brand hover:text-brand-600 transition-colors">API Reference</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;
