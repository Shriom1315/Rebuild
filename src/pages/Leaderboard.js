import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { ShaderAnimation } from '../components/ui/shader-animation';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { team, currentStudent, signOut } = useAuth();
  
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadLeaderboard();
    }
  }, [selectedRound]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get all rounds
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true });
      
      setRounds(roundsData || []);
      
      // Select latest announced round by default
      const latestAnnounced = roundsData?.reverse().find(r => r.results_announced);
      if (latestAnnounced) {
        setSelectedRound(latestAnnounced);
      } else if (roundsData && roundsData.length > 0) {
        setSelectedRound(roundsData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!selectedRound) return;
    
    try {
      setLoading(true);
      
      // Get all teams with their students
      const { data: teamsData } = await supabase
        .from('teams')
        .select(`
          *,
          students (
            id,
            full_name,
            roll_number
          )
        `)
        .order('team_name', { ascending: true });

      // Get scores for this round
      const { data: scoresData } = await supabase
        .from('student_scores')
        .select('*')
        .eq('round_id', selectedRound.id);

      // Calculate team averages
      const leaderboard = teamsData?.map(team => {
        const teamStudents = team.students || [];
        const teamScores = teamStudents
          .map(s => scoresData?.find(score => score.student_id === s.id))
          .filter(Boolean);
        
        const totalScore = teamScores.reduce((sum, s) => sum + (s.score || 0), 0);
        const avgScore = teamStudents.length > 0 ? totalScore / teamStudents.length : 0;
        const totalPercentage = teamScores.reduce((sum, s) => sum + (s.percentage || 0), 0);
        const avgPercentage = teamStudents.length > 0 ? totalPercentage / teamStudents.length : 0;

        return {
          ...team,
          avgScore: parseFloat(avgScore.toFixed(2)),
          avgPercentage: parseFloat(avgPercentage.toFixed(1)),
          memberCount: teamStudents.length,
          scoresCount: teamScores.length
        };
      }) || [];

      // Sort by average score (descending)
      leaderboard.sort((a, b) => b.avgScore - a.avgScore);

      // Add rank
      leaderboard.forEach((team, index) => {
        team.rank = index + 1;
      });

      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-white/60';
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/40';
    if (rank === 2) return 'bg-gray-400/20 border-gray-400/40';
    if (rank === 3) return 'bg-orange-500/20 border-orange-500/40';
    return 'bg-white/5 border-white/10';
  };

  if (loading && leaderboardData.length === 0) {
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
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-brand/30">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShaderAnimation />
      </div>
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]/80"></div>

      <div className="relative z-10 flex flex-col min-h-screen p-4 md:p-8">

        {/* Nav Bar */}
        <header className="w-full px-6 py-5 md:py-6 mb-8 border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/student/dashboard" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">arrow_back</span>
              <span className="font-display text-lg text-white uppercase tracking-[0.3em]">Rebuild</span>
            </Link>

            <div className="flex items-center gap-6">
              {currentStudent && (
                <div className="hidden md:flex flex-col items-end border-r border-white/20 pr-6">
                  <span className="text-[10px] text-white/90 font-bold tracking-widest uppercase">{currentStudent.full_name}</span>
                  <span className="text-[8px] text-brand uppercase tracking-[0.3em] font-black">{team?.team_name}</span>
                </div>
              )}
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto w-full flex-1">
          
          {/* Header */}
          <div className="bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl mb-10">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-brand text-3xl">leaderboard</span>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wider">Leaderboard</h2>
                <p className="text-xs text-white/60 font-medium tracking-wide mt-1">Team rankings based on average member scores</p>
              </div>
            </div>

            {/* Round Selector */}
            <div className="flex flex-wrap gap-3">
              {rounds.map(round => (
                <button
                  key={round.id}
                  onClick={() => setSelectedRound(round)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedRound?.id === round.id
                      ? 'bg-brand text-white shadow-glow-brand'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {round.name}
                  {round.results_announced && (
                    <span className="ml-2 text-emerald-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard Table */}
          {selectedRound && (
            <div className="bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display text-white uppercase tracking-wider">
                  {selectedRound.name} Rankings
                </h3>
                {!selectedRound.results_announced && (
                  <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">
                      Results Not Announced Yet
                    </span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                  <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Loading Rankings...</span>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="py-20 text-center opacity-20 uppercase tracking-[0.3em] text-[10px] font-black">
                  No scores available for this round
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboardData.map((teamData) => {
                    const isMyTeam = team?.id === teamData.id;
                    
                    return (
                      <div
                        key={teamData.id}
                        className={`p-6 rounded-[2rem] border-2 transition-all ${
                          isMyTeam
                            ? 'bg-brand/10 border-brand shadow-glow-brand'
                            : getRankBg(teamData.rank)
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          {/* Rank */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                            <span className={`text-3xl font-display font-bold ${getRankColor(teamData.rank)}`}>
                              {teamData.rank === 1 ? '🥇' : teamData.rank === 2 ? '🥈' : teamData.rank === 3 ? '🥉' : `#${teamData.rank}`}
                            </span>
                          </div>

                          {/* Team Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-white">{teamData.team_name}</h4>
                              {isMyTeam && (
                                <span className="px-3 py-1 bg-brand text-white text-[9px] font-black uppercase tracking-wider rounded-full">
                                  Your Team
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-white/60">
                              <span className="font-mono">{teamData.team_code}</span>
                              <span>•</span>
                              <span>{teamData.memberCount} members</span>
                              {teamData.scoresCount < teamData.memberCount && (
                                <>
                                  <span>•</span>
                                  <span className="text-yellow-400">{teamData.scoresCount}/{teamData.memberCount} scored</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Scores */}
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Avg Score</p>
                              <p className="text-3xl font-display font-bold text-white">
                                {teamData.avgScore}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Accuracy</p>
                              <p className={`text-2xl font-bold ${
                                teamData.avgPercentage >= 80 ? 'text-emerald-400' :
                                teamData.avgPercentage >= 60 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {teamData.avgPercentage}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-center gap-4 opacity-50 px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.5em]">
            <span>DKTE MCA</span>
            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
            <span>LEADERBOARD</span>
          </div>
          <p className="text-[11px] font-bold text-white uppercase tracking-[0.3em]">
            LIVE RANKINGS · FAIR SCORING
          </p>
        </footer>

      </div>
    </div>
  );
};

export default Leaderboard;
