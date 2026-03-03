import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roundService } from '../services/roundService';
import { qualificationService } from '../services/qualificationService';
import { teamService } from '../services/teamService';

const AdminQualificationManagement = () => {
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [qualificationCriteria, setQualificationCriteria] = useState({
    minScore: 0,
    maxTeams: null,
    type: 'score',
  });
  const [eligibleTeams, setEligibleTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadRoundData(selectedRound.id);
    }
  }, [selectedRound]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roundsData, teamsData] = await Promise.all([
        roundService.getAllRounds(),
        teamService.getAllTeams(),
      ]);
      setRounds(roundsData);
      setAllTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoundData = async (roundId) => {
    try {
      const [criteria, eligible] = await Promise.all([
        qualificationService.getRoundQualification(roundId),
        qualificationService.getEligibleTeams(roundId),
      ]);

      if (criteria) {
        setQualificationCriteria({
          minScore: criteria.min_score,
          maxTeams: criteria.max_teams,
          type: criteria.qualification_type,
        });
      }
      setEligibleTeams(eligible);
    } catch (error) {
      console.error('Error loading round data:', error);
    }
  };

  const handleSaveCriteria = async () => {
    if (!selectedRound) return;

    try {
      setSaving(true);
      await qualificationService.setRoundQualification(selectedRound.id, qualificationCriteria);
      alert('Qualification criteria saved successfully!');
    } catch (error) {
      console.error('Error saving criteria:', error);
      alert('Failed to save criteria');
    } finally {
      setSaving(false);
    }
  };

  const handleQualifyTeams = async () => {
    if (!selectedRound || rounds.length < 2) return;

    const currentIndex = rounds.findIndex(r => r.id === selectedRound.id);
    if (currentIndex === 0) {
      alert('Cannot qualify teams for the first round');
      return;
    }

    const previousRound = rounds[currentIndex - 1];

    try {
      setSaving(true);
      const results = await qualificationService.qualifyTeamsForNextRound(
        previousRound.id,
        selectedRound.id
      );
      
      alert(`Qualification complete!\nQualified: ${results.filter(r => r.qualified).length}\nDisqualified: ${results.filter(r => !r.qualified).length}`);
      
      // Reload eligible teams
      await loadRoundData(selectedRound.id);
    } catch (error) {
      console.error('Error qualifying teams:', error);
      alert('Failed to qualify teams');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEligibility = async (teamId, currentStatus) => {
    if (!selectedRound) return;

    try {
      await qualificationService.setTeamEligibility(
        teamId,
        selectedRound.id,
        !currentStatus,
        'Manually toggled by admin'
      );
      await loadRoundData(selectedRound.id);
    } catch (error) {
      console.error('Error toggling eligibility:', error);
      alert('Failed to update eligibility');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">RecruitSim</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Admin Console</p>
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
          <Link to="/admin/teams" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary rounded-full transition-colors">
            <span className="material-symbols-outlined">group</span>
            <span className="font-medium">Teams</span>
          </Link>
          <Link to="/admin/qualifications" className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-full">
            <span className="material-symbols-outlined">verified</span>
            <span className="font-medium">Qualifications</span>
          </Link>
          <Link to="/admin/lobby" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary rounded-full transition-colors">
            <span className="material-symbols-outlined">monitor</span>
            <span className="font-medium">Live Monitor</span>
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
          <span className="text-sm font-bold">Qualification Management</span>
          <div className="w-8"></div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 lg:p-12">
          <header className="mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
              Qualification Management
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Set criteria and manage team qualifications for each round
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Round Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-bold text-lg mb-4">Select Round</h3>
                <div className="space-y-2">
                  {rounds.map((round) => (
                    <button
                      key={round.id}
                      onClick={() => setSelectedRound(round)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedRound?.id === round.id
                          ? 'bg-primary text-white'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <p className="font-bold">{round.name}</p>
                      <p className="text-xs opacity-75">{round.type}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Qualification Criteria */}
            <div className="lg:col-span-2">
              {selectedRound ? (
                <div className="space-y-6">
                  {/* Criteria Form */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-lg mb-4">Qualification Criteria for {selectedRound.name}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Minimum Score Required
                        </label>
                        <input
                          type="number"
                          value={qualificationCriteria.minScore}
                          onChange={(e) => setQualificationCriteria({
                            ...qualificationCriteria,
                            minScore: parseInt(e.target.value) || 0
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Maximum Teams (Optional)
                        </label>
                        <input
                          type="number"
                          value={qualificationCriteria.maxTeams || ''}
                          onChange={(e) => setQualificationCriteria({
                            ...qualificationCriteria,
                            maxTeams: e.target.value ? parseInt(e.target.value) : null
                          })}
                          placeholder="Leave empty for no limit"
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveCriteria}
                          disabled={saving}
                          className="flex-1 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-bold py-3 px-6 rounded-full transition-all"
                        >
                          {saving ? 'Saving...' : 'Save Criteria'}
                        </button>
                        <button
                          onClick={handleQualifyTeams}
                          disabled={saving}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-bold py-3 px-6 rounded-full transition-all"
                        >
                          {saving ? 'Processing...' : 'Run Qualification'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Eligible Teams */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-lg mb-4">
                      Eligible Teams ({eligibleTeams.length})
                    </h3>
                    
                    {eligibleTeams.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        No teams qualified yet. Run qualification to see results.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {eligibleTeams.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                          >
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {item.teams.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.teams.code} • Score: {item.teams.total_score}
                              </p>
                            </div>
                            <button
                              onClick={() => handleToggleEligibility(item.team_id, item.is_eligible)}
                              className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            >
                              Qualified ✓
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">
                    verified
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Select a round to manage qualifications
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminQualificationManagement;
