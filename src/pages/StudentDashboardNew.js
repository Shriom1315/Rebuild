import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamService } from '../services/teamService';
import { roundService } from '../services/roundService';
import { qualificationService } from '../services/qualificationService';

const StudentDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [team, setTeam] = useState(null);
  const [allRounds, setAllRounds] = useState([]);
  const [eligibility, setEligibility] = useState([]);
  const [individualPerformance, setIndividualPerformance] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, individual, team

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user's team
      const userTeam = await teamService.getUserTeam(user.id);
      setTeam(userTeam);

      if (userTeam) {
        // Load all rounds
        const rounds = await roundService.getAllRounds();
        setAllRounds(rounds);

        // Load team eligibility status
        const eligibilityStatus = await qualificationService.getTeamEligibilityStatus(userTeam.id);
        setEligibility(eligibilityStatus);

        // Load individual performance
        const indivPerf = await qualificationService.getIndividualPerformance(user.id);
        setIndividualPerformance(indivPerf);

        // Load team performance
        const teamPerf = await qualificationService.getTeamPerformance(userTeam.id);
        setTeamPerformance(teamPerf);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRoundAccessible = (roundId) => {
    const roundEligibility = eligibility.find(e => e.round_id === roundId);
    return roundEligibility?.is_eligible || false;
  };

  const getRoundStatus = (roundId) => {
    const roundEligibility = eligibility.find(e => e.round_id === roundId);
    if (!roundEligibility) return { status: 'locked', message: 'Not yet available', color: 'slate' };
    if (roundEligibility.is_eligible) return { status: 'qualified', message: 'Qualified ✓', color: 'green' };
    return { status: 'disqualified', message: 'Not qualified', color: 'red' };
  };

  const getAccessibleRounds = () => {
    return allRounds.filter(round => {
      const status = getRoundStatus(round.id);
      return status.status === 'qualified' || round.is_active;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center animate-slideUp">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <div className="text-center max-w-md animate-slideUp">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">group_off</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Team Assigned</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You need to be part of a team to access the dashboard.
          </p>
          <Link 
            to="/student/team"
            className="inline-block bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all"
          >
            Join or Create Team
          </Link>
        </div>
      </div>
    );
  }

  const accessibleRounds = getAccessibleRounds();
  const currentRound = accessibleRounds.find(r => r.is_active);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-72 h-screen bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-r border-primary/10 flex flex-col p-4 md:p-6 transition-transform duration-300`}>
        <div className="flex items-center justify-between mb-8 lg:mb-10">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl md:text-2xl">rocket_launch</span>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight">RecruitSim</h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider">Student Portal</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link to="/student/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-full transition-colors">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link to="/student/team" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined">group</span>
            <span className="font-medium">My Team</span>
          </Link>
        </nav>

        <button
          onClick={signOut}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
            </div>
            <span className="text-sm font-bold">RecruitSim</span>
          </div>
          <div className="w-8"></div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 lg:p-12">
          {/* Header */}
          <header className="flex flex-col gap-4 md:gap-6 mb-8 animate-slideUp">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Welcome back, <span className="text-primary">{team.name}!</span>
              </h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {profile?.full_name} • {team.code}
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Team Rank</p>
                <p className="text-2xl md:text-3xl font-black text-primary">#{team.total_score || 0}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{team.total_score || 0}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rounds Completed</p>
                <p className="text-2xl md:text-3xl font-black text-green-500">{individualPerformance.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white capitalize">{team.status}</p>
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            {['overview', 'individual', 'team'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-bold text-sm capitalize whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'overview' ? 'Rounds' : tab === 'individual' ? 'My Performance' : 'Team Performance'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Current Round */}
              {currentRound && isRoundAccessible(currentRound.id) && (
                <div className="bg-gradient-to-r from-primary to-blue-600 p-6 md:p-8 rounded-2xl text-white shadow-xl animate-slideUp">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider opacity-90 mb-1">Current Round</p>
                      <h3 className="text-2xl md:text-3xl font-black">{currentRound.name}</h3>
                      <p className="text-sm opacity-90 mt-2">{currentRound.description}</p>
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                  </div>
                  <Link
                    to={`/student/exam/${currentRound.type}`}
                    className="inline-flex items-center gap-2 bg-white text-primary font-bold py-3 px-6 rounded-full hover:shadow-lg transition-all"
                  >
                    Start Round
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
              )}

              {/* All Rounds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {allRounds.map((round, index) => {
                  const status = getRoundStatus(round.id);
                  const isAccessible = isRoundAccessible(round.id);
                  
                  return (
                    <div
                      key={round.id}
                      className={`p-6 rounded-xl border-2 transition-all animate-slideUp ${
                        isAccessible
                          ? 'bg-white dark:bg-slate-900 border-green-200 dark:border-green-800 hover:shadow-lg'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{round.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{round.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          status.status === 'qualified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          status.status === 'disqualified' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {status.message}
                        </span>
                      </div>
                      
                      {isAccessible && round.is_active && (
                        <Link
                          to={`/student/exam/${round.type}`}
                          className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-all text-sm"
                        >
                          Enter Round
                          <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </Link>
                      )}
                      
                      {!isAccessible && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined text-lg">lock</span>
                          <span>{status.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'individual' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">My Performance</h3>
              {individualPerformance.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">assessment</span>
                  <p className="text-slate-600 dark:text-slate-400">No performance data yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {individualPerformance.map((perf) => (
                    <div key={perf.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{perf.rounds?.name}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Score</span>
                          <span className="font-bold text-primary">{perf.score} / {perf.rounds?.max_score}</span>
                        </div>
                        {perf.metrics?.accuracy && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Accuracy</span>
                            <span className="font-bold">{perf.metrics.accuracy}%</span>
                          </div>
                        )}
                        {perf.metrics?.correct_answers && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Correct Answers</span>
                            <span className="font-bold">{perf.metrics.correct_answers} / {perf.metrics.total_questions}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Team Performance</h3>
              {teamPerformance.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">groups</span>
                  <p className="text-slate-600 dark:text-slate-400">No team performance data yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allRounds.map((round) => {
                    const roundPerformances = teamPerformance.filter(p => p.round_id === round.id);
                    if (roundPerformances.length === 0) return null;

                    return (
                      <div key={round.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4">{round.name}</h4>
                        <div className="space-y-3">
                          {roundPerformances.map((perf) => (
                            <div key={perf.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                  {perf.profiles?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{perf.profiles?.full_name}</p>
                                  {perf.metrics?.accuracy && (
                                    <p className="text-xs text-slate-500">Accuracy: {perf.metrics.accuracy}%</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary">{perf.score}</p>
                                <p className="text-xs text-slate-500">points</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
