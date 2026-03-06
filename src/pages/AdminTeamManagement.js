import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { ShaderAnimation } from '../components/ui/shader-animation';

const AdminTeamManagement = () => {
  const navigate = useNavigate();
  const { signOut, createJudgeAccount } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');

  // Teams state
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Create team modal
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCode, setNewTeamCode] = useState('');

  // Add student modal
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  // Create judge modal
  const [showCreateJudge, setShowCreateJudge] = useState(false);
  const [judgeName, setJudgeName] = useState('');
  const [judgeEmail, setJudgeEmail] = useState('');
  const [judgePassword, setJudgePassword] = useState('');
  const [judgeRole, setJudgeRole] = useState('judge_gd');

  // CSV Upload state
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Rounds state
  const [rounds, setRounds] = useState([]);

  // Judges state
  const [judges, setJudges] = useState([]);
  const [loadingJudges, setLoadingJudges] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, qualified: 0, eliminated: 0, students: 0 });

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchTeams();
    fetchRounds();
    if (activeTab === 'judges') {
      fetchJudges();
    }
  }, [activeTab]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`*, students(id, full_name, roll_number, email)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);

      const total = data?.length || 0;
      const active = data?.filter(t => t.status === 'active').length || 0;
      const qualified = data?.filter(t => t.status === 'qualified').length || 0;
      const eliminated = data?.filter(t => t.status === 'eliminated').length || 0;
      const students = data?.reduce((sum, t) => sum + (t.students?.length || 0), 0) || 0;
      setStats({ total, active, qualified, eliminated, students });
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchRounds = async () => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true});
      if (error) throw error;
      setRounds(data || []);
    } catch (error) {
      console.error('Error fetching rounds:', error);
    }
  };

  const fetchJudges = async () => {
    setLoadingJudges(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['judge_gd', 'judge_hr'])
        .order('full_name', { ascending: true });
      if (error) throw error;
      setJudges(data || []);
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoadingJudges(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'RB-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewTeamCode(code);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('teams')
        .insert([{ team_code: newTeamCode.toUpperCase(), team_name: newTeamName }]);

      if (error) throw error;
      showToast(`Team "${newTeamName}" created`);
      setShowCreateTeam(false);
      setNewTeamName('');
      setNewTeamCode('');
      fetchTeams();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .insert([{ team_id: selectedTeamId, full_name: studentName, roll_number: studentRoll, email: studentEmail }]);

      if (error) throw error;
      showToast(`Added "${studentName}" to team`);
      setShowAddStudent(false);
      setStudentName('');
      setStudentRoll('');
      setStudentEmail('');
      fetchTeams();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateJudge = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { error } = await createJudgeAccount(judgeEmail, judgePassword, judgeName, judgeRole);
      if (error) throw error;
      showToast(`Judge account created for ${judgeName}`);
      setShowCreateJudge(false);
      setJudgeName('');
      setJudgeEmail('');
      setJudgePassword('');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team and all its members?')) return;
    try {
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
      showToast('Team deleted');
      fetchTeams();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDisqualifyTeam = async (teamId, teamName) => {
    if (!window.confirm(`Disqualify "${teamName}" from ALL rounds? This will block them from accessing any future rounds.`)) return;
    
    setActionLoading(true);
    try {
      // Get all rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('id, round_number');
      
      if (roundsError) throw roundsError;

      // Delete existing records first to avoid conflicts
      await supabase
        .from('team_round_status')
        .delete()
        .eq('team_id', teamId);

      // Insert elimination status for all rounds
      const eliminationRecords = roundsData.map(round => ({
        team_id: teamId,
        round_id: round.id,
        status: 'eliminated',
        message: 'Team disqualified by admin'
      }));

      const { error: insertError } = await supabase
        .from('team_round_status')
        .insert(eliminationRecords);

      if (insertError) throw insertError;

      // Update team status
      const { error: updateError } = await supabase
        .from('teams')
        .update({ status: 'eliminated' })
        .eq('id', teamId);

      if (updateError) throw updateError;

      showToast(`Team "${teamName}" has been disqualified from all rounds`);
      fetchTeams();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRound = async (round) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({
          is_active: !round.is_active,
          start_time: !round.is_active ? new Date().toISOString() : round.start_time,
        })
        .eq('id', round.id);
      if (error) throw error;
      showToast(`Round "${round.name}" ${!round.is_active ? 'activated' : 'paused'}`);
      fetchRounds();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleAnnounceResults = async (round) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ results_announced: true, is_completed: true, is_active: false, end_time: new Date().toISOString() })
        .eq('id', round.id);
      if (error) throw error;
      showToast(`Results announced for "${round.name}"`);
      fetchRounds();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      const preview = lines.slice(0, 10).map((line, idx) => {
        const parts = line.split(',').map(p => p.trim());
        return {
          line: idx + 1,
          raw: line,
          parsed: parts
        };
      });
      
      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleUploadCsv = async () => {
    if (!csvFile) return;

    try {
      setActionLoading(true);
      setUploadProgress('Reading CSV file...');

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        setUploadProgress(`Processing ${lines.length} rows...`);

        const teamsMap = new Map();
        let headerSkipped = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(',').map(p => p.trim());
          
          if (!headerSkipped && (parts[0] === 'Event' || parts[1] === 'Team Name')) {
            headerSkipped = true;
            continue;
          }

          if (parts.length < 5) {
            continue;
          }

          const teamName = parts[1];
          const role = parts[2];
          const studentName = parts[3];
          const studentEmail = parts[4];

          if (!teamName || !studentName || !studentEmail) {
            continue;
          }

          if (!teamsMap.has(teamName)) {
            teamsMap.set(teamName, {
              teamName,
              teamLeader: null,
              members: []
            });
          }

          const teamData = teamsMap.get(teamName);
          const studentData = {
            name: studentName,
            email: studentEmail,
            role: role
          };

          if (role === 'Team Leader') {
            teamData.teamLeader = studentData;
          } else {
            teamData.members.push(studentData);
          }
        }

        setUploadProgress(`Creating ${teamsMap.size} teams...`);

        let teamsCreated = 0;
        let studentsCreated = 0;
        let errors = [];

        for (const [teamName, teamData] of teamsMap) {
          try {
            const teamCode = `RB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            
            const { data: teamRecord, error: teamError } = await supabase
              .from('teams')
              .insert([{ 
                team_name: teamName, 
                team_code: teamCode,
                status: 'active'
              }])
              .select()
              .single();

            if (teamError) {
              errors.push(`Team "${teamName}": ${teamError.message}`);
              continue;
            }

            teamsCreated++;

            const allStudents = [];
            if (teamData.teamLeader) {
              allStudents.push({
                team_id: teamRecord.id,
                full_name: teamData.teamLeader.name,
                email: teamData.teamLeader.email,
                roll_number: `TL-${teamRecord.team_code}`
              });
            }

            teamData.members.forEach((member, idx) => {
              allStudents.push({
                team_id: teamRecord.id,
                full_name: member.name,
                email: member.email,
                roll_number: `${teamRecord.team_code}-M${idx + 1}`
              });
            });

            if (allStudents.length > 0) {
              const { error: studentsError } = await supabase
                .from('students')
                .insert(allStudents);

              if (studentsError) {
                errors.push(`Students for "${teamName}": ${studentsError.message}`);
              } else {
                studentsCreated += allStudents.length;
              }
            }
          } catch (error) {
            errors.push(`Team "${teamName}": ${error.message}`);
          }
        }

        if (errors.length > 0) {
          console.error('CSV Upload Errors:', errors);
          showToast(`Imported ${teamsCreated} teams, ${studentsCreated} students. ${errors.length} errors occurred.`, 'error');
        } else {
          showToast(`Successfully imported ${teamsCreated} teams and ${studentsCreated} students!`);
        }
        
        setCsvFile(null);
        setCsvPreview([]);
        setShowCsvUpload(false);
        setUploadProgress(null);
        
        await fetchTeams();
      };

      reader.readAsText(csvFile);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      showToast(error.message, 'error');
      setUploadProgress(null);
    } finally {
      setActionLoading(false);
    }
  };

  const navItems = [
    { id: 'teams', icon: 'groups', label: 'Teams' },
    { id: 'rounds', icon: 'timer', label: 'Rounds' },
    { id: 'judges', icon: 'gavel', label: 'Judges' },
  ];

  const statusColors = {
    registered: 'bg-white/10 text-white border-white/20',
    active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    qualified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    eliminated: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-brand/30">

      {/* ─── IMMERSIVE BACKGROUND ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShaderAnimation />
      </div>

      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]/80"></div>

      {toast && (
        <div className={`fixed top-5 right-5 z-[200] px-6 py-4 rounded-2xl text-sm font-bold border backdrop-blur-md animate-slideUp shadow-2xl ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
          }`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">{toast.type === 'error' ? 'report' : 'check_circle'}</span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Sidebar - Compact Spacing */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-[#0a0a0a]/90 backdrop-blur-3xl border-r border-white/10 flex flex-col transition-all duration-300`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl text-white uppercase tracking-[0.2em]">Rebuild</h1>
              <p className="text-[9px] text-brand font-black tracking-[0.3em] uppercase mt-0.5">Admin HQ</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand text-white shadow-glow-brand ring-1 ring-white/10">
            <span className="material-symbols-outlined text-base">groups</span>
            Teams
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 space-y-1.5">
            <Link to="/admin/scores" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined text-base">grade</span>
              Scores
            </Link>
            <Link to="/admin/questions" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined text-base">quiz</span>
              Questions
            </Link>
            <Link to="/admin/lobby" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined text-base">monitor_heart</span>
              Live Lobby
            </Link>
          </div>
        </nav>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10">

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 p-5 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <span className="material-symbols-outlined">menu_open</span>
          </button>
          <span className="font-display text-base text-white uppercase tracking-[0.2em]">REBUILD HQ</span>
          <div className="w-6"></div>
        </div>

        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 focus:outline-none">

          {/* Tab Navigation */}
          <div className="flex gap-3 bg-white/[0.04] border-2 border-white/20 rounded-[2rem] p-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id
                  ? 'bg-brand text-white shadow-glow-brand'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* ════════ TEAMS TAB ════════ */}
          {activeTab === 'teams' && (
            <div className="animate-slideUp space-y-10">

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wider mb-2 leading-tight">Unit Management</h2>
                  <p className="text-xs text-white/60 font-medium tracking-wide max-w-xl">Configure and deploy simulation squads into the operational environment.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCsvUpload(true)}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-lg"
                  >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Bulk Import CSV
                  </button>
                  <button
                    onClick={() => { setShowCreateTeam(true); generateCode(); }}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-brand hover:shadow-glow-brand text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Initialize New Unit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Units', value: stats.total, icon: 'groups', color: 'text-white' },
                  { label: 'Live Sessions', value: stats.active, icon: 'sensors', color: 'text-blue-400' },
                  { label: 'Qualified', value: stats.qualified, icon: 'verified', color: 'text-emerald-400' },
                  { label: 'Eliminated', value: stats.eliminated, icon: 'warning', color: 'text-red-400' },
                  { label: 'Personnel', value: stats.students, icon: 'fingerprint', color: 'text-brand' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/[0.04] border-2 border-white/20 rounded-[1.5rem] p-6 shadow-xl hover:border-brand/40 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
                    </div>
                    <p className={`text-2xl font-display font-bold mb-0.5 ${stat.color}`}>{stat.value}</p>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em]">Deployed Units Matrix</h3>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {loadingTeams ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                    <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Scanning Network...</span>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[2.5rem] opacity-30">
                    <span className="material-symbols-outlined text-5xl mb-4">database_off</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">No Active Units Established</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teams.map(team => (
                      <div key={team.id} className="bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 hover:border-brand/40 transition-all shadow-2xl group relative overflow-hidden">
                        <div className="flex justify-between items-start gap-4relative z-10">
                          <div className="flex items-start gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-brand/10 border-2 border-brand/20 flex items-center justify-center text-brand shadow-glow-brand/5">
                              <span className="material-symbols-outlined text-xl font-black">hub</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{team.team_name}</h3>
                                <span className={`text-[8px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border-2 ${statusColors[team.status]}`}>
                                  {team.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-mono text-brand font-black tracking-widest">{team.team_code}</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">{team.students?.length || 0} MEMBERS</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => { setSelectedTeamId(team.id); setShowAddStudent(true); }}
                              className="p-2.5 bg-white/5 border border-white/20 text-white/40 hover:text-white hover:bg-brand hover:border-brand rounded-xl transition-all"
                              title="Add Member"
                            >
                              <span className="material-symbols-outlined text-base">person_add</span>
                            </button>
                            <button
                              onClick={() => handleDisqualifyTeam(team.id, team.team_name)}
                              className="p-2.5 bg-white/5 border border-white/20 text-white/40 hover:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/30 rounded-xl transition-all"
                              title="Disqualify Team"
                              disabled={actionLoading}
                            >
                              <span className="material-symbols-outlined text-base">block</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-2.5 bg-white/5 border border-white/20 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              title="Delete Team"
                            >
                              <span className="material-symbols-outlined text-base">delete_forever</span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-2 relative z-10">
                          {team.students && team.students.length > 0 ? team.students.map(s => (
                            <div key={s.id} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                              <div className="w-3.5 h-3.5 rounded-full bg-brand/40 text-[7px] font-black text-white flex items-center justify-center">
                                {s.full_name?.charAt(0)}
                              </div>
                              <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{s.full_name}</span>
                            </div>
                          )) : (
                            <span className="text-[9px] text-white/20 uppercase font-black tracking-widest italic">Awaiting personnel deployment...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ ROUNDS TAB ════════ */}
          {activeTab === 'rounds' && (
            <div className="animate-slideUp space-y-10">
              <div className="bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wider mb-2">Event Roadmap</h2>
                <p className="text-xs text-white/60 font-medium tracking-wide">Orchestrate simulation phases and calculate result thresholds.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {rounds.map(round => (
                  <div key={round.id} className={`bg-white/[0.04] border-2 rounded-[2.5rem] p-8 md:p-10 transition-all shadow-2xl relative overflow-hidden ${round.is_active ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/20'
                    }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-center gap-8">
                        <div className={`w-20 h-20 rounded-3xl border-2 flex flex-col items-center justify-center font-display shadow-2xl transition-all ${round.is_active ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-glow-emerald' :
                          round.is_completed ? 'border-white/20 bg-white/5 text-white/20' :
                            'border-brand/40 bg-brand/10 text-brand'
                          }`}>
                          <span className="text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-60">Phase</span>
                          <span className="text-3xl font-bold">{round.round_number}</span>
                        </div>

                        <div>
                          <h3 className="text-xl md:text-2xl font-display text-white uppercase tracking-widest mb-1.5">{round.name}</h3>
                          <p className="text-xs text-white/60 font-medium max-w-md line-clamp-2 mb-4">{round.description}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest border-2 ${round.is_active ? 'bg-emerald-500 text-white border-white/20 animate-pulse' :
                              round.is_completed ? 'bg-white/10 text-white/40 border-white/10' :
                                'bg-white/5 text-white/30 border-white/10'
                              }`}>
                              {round.is_active ? '● LIVE' : round.is_completed ? 'COMPLETED' : 'STANDBY'}
                            </span>
                            <span className="text-[8px] font-mono text-white/20 font-black uppercase">{round.duration_minutes} MINS</span>
                            {round.round_number === 1 && (
                              <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">SEB WARNINGS:</span>
                                <input
                                  type="number"
                                  key={`seb-${round.id}-${round.seb_max_warnings}`}
                                  defaultValue={round.seb_max_warnings ?? 3}
                                  min={1}
                                  max={20}
                                  onBlur={async (e) => {
                                    const val = parseInt(e.target.value);
                                    if (!val || val < 1) return;
                                    try {
                                      const { error } = await supabase.from('rounds').update({ seb_max_warnings: val }).eq('id', round.id);
                                      if (error) {
                                        if (error.message?.includes('column')) {
                                          showToast('Column "seb_max_warnings" not found. Run: ALTER TABLE rounds ADD COLUMN seb_max_warnings INT DEFAULT 3;', 'error');
                                        } else {
                                          throw error;
                                        }
                                      } else {
                                        showToast(`Warning threshold saved: ${val}`);
                                        fetchRounds(); // Re-fetch to sync the value
                                      }
                                    } catch (err) {
                                      showToast(err.message, 'error');
                                    }
                                  }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                  className="w-12 bg-transparent text-[10px] font-bold text-brand outline-none border-b border-brand/20 focus:border-brand transition-all text-center"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {!round.is_completed && (
                          <button
                            onClick={() => handleToggleRound(round)}
                            className={`flex items-center gap-3 px-8 py-4 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border-2 ${round.is_active
                              ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                              : 'bg-emerald-500 text-white border-white/10 hover:shadow-glow-emerald'
                              }`}
                          >
                            <span className="material-symbols-outlined text-sm">{round.is_active ? 'pause_circle' : 'play_circle'}</span>
                            {round.is_active ? 'STOP' : 'START'}
                          </button>
                        )}
                        {!round.results_announced ? (
                          <button
                            onClick={() => handleAnnounceResults(round)}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-brand hover:text-white border-2 border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            REVEAL SCORES
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-xl">
                            <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Scores Revealed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════ JUDGES TAB ════════ */}
          {activeTab === 'judges' && (
            <div className="animate-slideUp space-y-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <div>
                  <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wider mb-2">Authority Hub</h2>
                  <p className="text-xs text-white/60 font-medium tracking-wide">Establish and monitor judicial oversight accounts.</p>
                </div>
                <button
                  onClick={() => setShowCreateJudge(true)}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-brand hover:shadow-glow-brand text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  <span className="material-symbols-outlined text-sm">person_add_alt</span>
                  Authorize Judge
                </button>
              </div>

              {/* Judges List */}
              {loadingJudges ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                </div>
              ) : judges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {judges.map((judge) => (
                    <div key={judge.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-brand text-xl">gavel</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white mb-1">{judge.full_name}</h3>
                          <p className="text-xs text-white/40 font-mono">{judge.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          judge.role === 'judge_gd' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                        }`}>
                          {judge.role === 'judge_gd' ? 'GD Judge' : 'HR Judge'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0a0a0a]/40 backdrop-blur-3xl border-2 border-dashed border-white/10 rounded-[3rem] p-16 text-center">
                  <div className="w-16 h-16 bg-white/5 border-2 border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-white/20">
                    <span className="material-symbols-outlined text-3xl">gavel</span>
                  </div>
                  <h3 className="text-xl font-display text-white uppercase tracking-widest mb-3">No Judges Authorized</h3>
                  <p className="text-white/30 text-xs max-w-sm mx-auto leading-relaxed">
                    Click "Authorize Judge" to create judicial oversight accounts.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        <footer className="mt-10 py-10 border-t border-white/10 flex items-center justify-center opacity-30">
          <div className="flex items-center gap-6 text-[8px] font-black uppercase tracking-[0.4em]">
            <span>DKTE COMMAND</span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span>SIM_ENGINE_V2</span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span>2026_TAC_MON</span>
          </div>
        </footer>

      </main>

      {/* ════════ MODALS ════════ */}

      {showCreateTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0a0a0a] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="font-display text-xl text-white uppercase tracking-widest mb-8 text-center">Establish Unit</h3>
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Squad Designation</label>
                <input
                  type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-xs font-bold text-white placeholder-white/10 focus:border-brand outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Tactical ID</label>
                <div className="flex gap-3">
                  <input
                    type="text" value={newTeamCode} onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())} required
                    className="flex-1 bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-xs font-mono font-bold text-brand uppercase tracking-widest focus:border-brand outline-none transition-all"
                  />
                  <button type="button" onClick={generateCode} className="px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white/40 hover:text-white transition-all">
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCreateTeam(false)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 border-2 border-white/10 rounded-xl hover:bg-white/5 transition-all">Abort</button>
                <button type="submit" disabled={actionLoading} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-brand text-white rounded-xl shadow-glow-brand disabled:opacity-50 transition-all">
                  COMMIT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0a0a0a] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="font-display text-xl text-white uppercase tracking-widest mb-8 text-center">Deploy Personnel</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Full Name</label>
                <input
                  type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} required
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-xs font-bold text-white focus:border-brand outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Roll No</label>
                <input
                  type="text" value={studentRoll} onChange={(e) => setStudentRoll(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-xs font-mono font-bold text-white focus:border-brand outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Email</label>
                <input
                  type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-xs font-bold text-white focus:border-brand outline-none transition-all"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 border-2 border-white/10 rounded-xl hover:bg-white/5 transition-all">Abort</button>
                <button type="submit" disabled={actionLoading} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-brand text-white rounded-xl shadow-glow-brand transition-all">
                  DEPLOY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateJudge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0a0a0a] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="font-display text-xl text-white uppercase tracking-widest mb-8 text-center">Judicial Authorization</h3>
            <form onSubmit={handleCreateJudge} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Name</label>
                <input
                  type="text" value={judgeName} onChange={(e) => setJudgeName(e.target.value)} required
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-xs font-bold text-white focus:border-brand outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Email</label>
                <input
                  type="email" value={judgeEmail} onChange={(e) => setJudgeEmail(e.target.value)} required
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-xs font-bold text-white focus:border-brand outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Password</label>
                <input
                  type="text" value={judgePassword} onChange={(e) => setJudgePassword(e.target.value)} required
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-xs font-mono font-bold text-white focus:border-brand outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Role</label>
                <select
                  value={judgeRole} onChange={(e) => setJudgeRole(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-[9px] font-black uppercase tracking-widest text-white focus:border-brand outline-none transition-all appearance-none"
                >
                  <option value="judge_gd" className="bg-[#0a0a0a]">GD_JUDGE</option>
                  <option value="judge_hr" className="bg-[#0a0a0a]">HR_JUDGE</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCreateJudge(false)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 border-2 border-white/10 rounded-xl hover:bg-white/5 transition-all">Abort</button>
                <button type="submit" disabled={actionLoading} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-brand text-white rounded-xl shadow-glow-brand transition-all">
                  AUTHORIZE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCsvUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fadeIn overflow-y-auto">
          <div className="bg-[#0a0a0a] border-2 border-orange-500/40 rounded-[2.5rem] p-8 md:p-10 w-full max-w-4xl shadow-2xl animate-scaleIn my-8">
            <div className="flex items-center gap-4 mb-8">
              <span className="material-symbols-outlined text-orange-500 text-3xl">upload_file</span>
              <div>
                <h3 className="font-display text-xl text-white uppercase tracking-widest">Bulk Import Teams & Students</h3>
                <p className="text-xs text-white/60 mt-1">Upload CSV file with team and student data</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">CSV Format (Comma-Separated)</label>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 font-mono text-xs text-white/80 overflow-x-auto">
                  <div className="text-emerald-400 mb-2">{'// Expected format (comma-separated columns):'}</div>
                  <div className="whitespace-nowrap">Event, Team Name, Role, Name, Email</div>
                  <div className="text-white/40 mt-2">{'// Example:'}</div>
                  <div className="whitespace-nowrap">REBUILD : The Simulation, Code Commandos, Team Leader, John Doe, john@example.com</div>
                  <div className="whitespace-nowrap">REBUILD : The Simulation, Code Commandos, Member, Jane Smith, jane@example.com</div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand file:text-white file:font-bold file:text-xs file:uppercase file:tracking-wider hover:file:bg-blue-600 file:cursor-pointer"
                />
              </div>

              {csvPreview.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">Preview (First 10 rows)</label>
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 max-h-64 overflow-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 text-white/40 px-2">Line</th>
                          <th className="text-left py-2 text-white/40 px-2">Event</th>
                          <th className="text-left py-2 text-white/40 px-2">Team</th>
                          <th className="text-left py-2 text-white/40 px-2">Role</th>
                          <th className="text-left py-2 text-white/40 px-2">Name</th>
                          <th className="text-left py-2 text-white/40 px-2">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row) => (
                          <tr key={row.line} className="border-b border-white/5">
                            <td className="py-2 text-white/40 px-2">{row.line}</td>
                            <td className="py-2 text-white/60 px-2 truncate max-w-[100px]">{row.parsed[0]}</td>
                            <td className="py-2 text-white px-2">{row.parsed[1]}</td>
                            <td className="py-2 text-emerald-400 px-2">{row.parsed[2]}</td>
                            <td className="py-2 text-white px-2">{row.parsed[3]}</td>
                            <td className="py-2 text-blue-400 px-2">{row.parsed[4]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploadProgress && (
                <div className="flex items-center gap-3 px-4 py-3 bg-brand/10 border border-brand/30 rounded-lg">
                  <div className="w-5 h-5 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                  <span className="text-sm text-brand font-bold">{uploadProgress}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUploadCsv}
                  disabled={!csvFile || actionLoading}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {actionLoading ? 'Processing...' : 'Upload & Import'}
                </button>
                <button
                  onClick={() => {
                    setCsvFile(null);
                    setCsvPreview([]);
                    setShowCsvUpload(false);
                  }}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-400 text-lg">info</span>
                <div className="text-xs text-blue-400/90 space-y-1">
                  <p className="font-bold">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-400/70">
                    <li>CSV must be comma-separated (standard CSV format)</li>
                    <li>Columns: Event, Team Name, Role, Name, Email</li>
                    <li>Role should be either "Team Leader" or "Member"</li>
                    <li>Header row will be automatically detected and skipped</li>
                    <li>Teams will be created automatically with generated codes</li>
                    <li>Roll numbers will be auto-generated based on team code</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeamManagement;
