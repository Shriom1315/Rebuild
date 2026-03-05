import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { ShaderAnimation } from '../components/ui/shader-animation';

const AdminScoreManagement = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [editingScore, setEditingScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Qualification settings
  const [qualifyTopN, setQualifyTopN] = useState(10);
  const [minScore, setMinScore] = useState(0);
  
  // CSV Upload state
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadRoundScores();
    }
  }, [selectedRound]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true });
      
      setRounds(roundsData || []);
      if (roundsData && roundsData.length > 0) {
        setSelectedRound(roundsData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoundScores = async () => {
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
            roll_number,
            email
          )
        `)
        .order('team_name', { ascending: true });

      setTeams(teamsData || []);

      // Get all students
      const allStudents = teamsData?.flatMap(t => t.students || []) || [];
      setStudents(allStudents);

      // Get existing scores for this round
      const { data: scoresData } = await supabase
        .from('student_scores')
        .select('*')
        .eq('round_id', selectedRound.id);

      const scoresMap = {};
      scoresData?.forEach(s => {
        scoresMap[s.student_id] = s;
      });
      setScores(scoresMap);

    } catch (error) {
      console.error('Error loading round scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScore = async (studentId, score, maxScore, remarks = '') => {
    try {
      setSaving(true);
      
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      const { error } = await supabase
        .from('student_scores')
        .upsert({
          student_id: studentId,
          round_id: selectedRound.id,
          score: parseFloat(score),
          max_score: parseFloat(maxScore),
          percentage: parseFloat(percentage.toFixed(2)),
          remarks: remarks || null,
        }, { onConflict: 'student_id, round_id' });

      if (error) throw error;

      showToast('Score saved successfully');
      setEditingScore(null);
      await loadRoundScores();
      await updateTeamScores();
    } catch (error) {
      console.error('Error saving score:', error);
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateTeamScores = async () => {
    // Recalculate team scores for this round
    for (const team of teams) {
      try {
        await supabase.rpc('calculate_team_round_score', {
          p_team_id: team.id,
          p_round_id: selectedRound.id
        });
      } catch (error) {
        console.error('Error updating team score:', error);
      }
    }
  };

  const handleQualifyTeams = async () => {
    if (!selectedRound) return;
    
    try {
      setSaving(true);
      
      // Get team scores (average of member scores)
      const teamScoresArray = teams.map(team => ({
        team,
        avgScore: getTeamScore(team.id)
      })).sort((a, b) => b.avgScore - a.avgScore);

      // Qualify top N teams with minimum score
      for (let i = 0; i < teamScoresArray.length; i++) {
        const { team, avgScore } = teamScoresArray[i];
        const isQualified = i < qualifyTopN && avgScore >= minScore;
        
        await supabase
          .from('team_round_status')
          .upsert({
            team_id: team.id,
            round_id: selectedRound.id,
            status: isQualified ? 'qualified' : 'eliminated',
            message: isQualified 
              ? `Qualified with average score ${avgScore.toFixed(2)}` 
              : `Not qualified (rank ${i + 1}, score ${avgScore.toFixed(2)})`
          }, { onConflict: 'team_id,round_id' });
      }

      showToast(`Qualification complete for ${selectedRound.name}`);
      await loadRoundScores();
    } catch (error) {
      console.error('Error qualifying teams:', error);
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateScores = async () => {
    if (!selectedRound) return;
    
    if (!window.confirm(`Calculate scores for all students in ${selectedRound.name}? This will read from student_answers and calculate scores automatically.`)) {
      return;
    }
    
    try {
      setSaving(true);
      showToast('Calculating scores...', 'info');
      
      // Get all student answers for this round
      const { data: answersData, error: answersError } = await supabase
        .from('student_answers')
        .select(`
          student_id,
          round_id,
          question_id,
          is_correct,
          questions (points)
        `)
        .eq('round_id', selectedRound.id);
      
      if (answersError) throw answersError;
      
      if (!answersData || answersData.length === 0) {
        showToast('No answers found for this round', 'error');
        return;
      }
      
      // Group by student
      const studentScoresMap = {};
      answersData.forEach(answer => {
        if (!studentScoresMap[answer.student_id]) {
          studentScoresMap[answer.student_id] = {
            student_id: answer.student_id,
            round_id: answer.round_id,
            correct_count: 0,
            wrong_count: 0,
            total_questions: 0,
            score: 0
          };
        }
        
        const points = answer.questions?.points || 1;
        studentScoresMap[answer.student_id].total_questions++;
        
        if (answer.is_correct) {
          studentScoresMap[answer.student_id].correct_count++;
          studentScoresMap[answer.student_id].score += points;
        } else {
          studentScoresMap[answer.student_id].wrong_count++;
        }
      });
      
      // Calculate percentages and insert scores
      const scoresArray = Object.values(studentScoresMap).map(s => ({
        ...s,
        percentage: s.total_questions > 0 
          ? parseFloat(((s.correct_count / s.total_questions) * 100).toFixed(1))
          : 0
      }));
      
      // Delete existing scores for this round first
      await supabase
        .from('student_scores')
        .delete()
        .eq('round_id', selectedRound.id);
      
      // Insert new scores
      const { error: insertError } = await supabase
        .from('student_scores')
        .insert(scoresArray);
      
      if (insertError) throw insertError;
      
      showToast(`Successfully calculated scores for ${scoresArray.length} students!`);
      await loadRoundScores();
    } catch (error) {
      console.error('Error calculating scores:', error);
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAnnounceResults = async () => {
    if (!selectedRound || !window.confirm('Announce results to students? They will be able to see their scores.')) return;

    try {
      setSaving(true);

      // Mark round as results announced
      await supabase
        .from('rounds')
        .update({ results_announced: true })
        .eq('id', selectedRound.id);

      // Mark all team statuses as announced
      await supabase
        .from('team_round_status')
        .update({ announced: true })
        .eq('round_id', selectedRound.id);

      showToast('Results announced successfully!');
      await loadData();
    } catch (error) {
      console.error('Error announcing results:', error);
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    
    // Read and preview CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse CSV (skip header if present)
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
    if (!csvFile || !selectedRound) return;

    try {
      setSaving(true);
      setUploadProgress('Reading CSV file...');

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        setUploadProgress(`Processing ${lines.length} rows...`);

        // Parse CSV - Expected format: email/roll_number, score
        const scores = [];
        let skippedRows = 0;
        let headerSkipped = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(',').map(p => p.trim());
          
          // Skip header row if it contains non-numeric score
          if (!headerSkipped && (parts[1] === 'score' || parts[1] === 'Score' || isNaN(parseFloat(parts[1])))) {
            headerSkipped = true;
            continue;
          }

          if (parts.length < 2) {
            skippedRows++;
            continue;
          }

          const identifier = parts[0]; // email or roll_number
          const score = parseFloat(parts[1]);

          if (isNaN(score)) {
            skippedRows++;
            continue;
          }

          scores.push({ identifier, score });
        }

        setUploadProgress(`Mapping ${scores.length} students to database...`);

        // Find students by email or roll_number
        const studentScores = [];
        let notFound = 0;

        for (const { identifier, score } of scores) {
          // Try to find student by email or roll_number
          const { data: studentData } = await supabase
            .from('students')
            .select('id, full_name, email, roll_number')
            .or(`email.eq.${identifier},roll_number.eq.${identifier}`)
            .single();

          if (studentData) {
            studentScores.push({
              student_id: studentData.id,
              round_id: selectedRound.id,
              score: score,
              max_score: 100, // Default max score for technical rounds
              percentage: score,
              correct_count: null,
              wrong_count: null,
              total_questions: null
            });
          } else {
            notFound++;
            console.warn(`Student not found: ${identifier}`);
          }
        }

        if (studentScores.length === 0) {
          showToast('No matching students found in database', 'error');
          return;
        }

        setUploadProgress(`Saving ${studentScores.length} scores...`);

        // Delete existing scores for this round
        await supabase
          .from('student_scores')
          .delete()
          .eq('round_id', selectedRound.id);

        // Insert new scores
        const { error: insertError } = await supabase
          .from('student_scores')
          .insert(studentScores);

        if (insertError) throw insertError;

        showToast(`Successfully imported ${studentScores.length} scores! ${notFound > 0 ? `(${notFound} not found)` : ''}`);
        
        // Reset upload state
        setCsvFile(null);
        setCsvPreview([]);
        setShowCsvUpload(false);
        setUploadProgress(null);
        
        await loadRoundScores();
      };

      reader.readAsText(csvFile);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      showToast(error.message, 'error');
      setUploadProgress(null);
    } finally {
      setSaving(false);
    }
  };

  const getTeamScore = (teamId) => {
    const teamStudents = students.filter(s => teams.find(t => t.id === teamId)?.students?.some(ts => ts.id === s.id));
    if (teamStudents.length === 0) return 0;
    
    // Use AVERAGE score to be fair for all team sizes
    const totalScore = teamStudents.reduce((sum, s) => sum + (scores[s.id]?.score || 0), 0);
    const avgScore = totalScore / teamStudents.length;
    return avgScore;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-brand/30">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShaderAnimation />
      </div>
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]/80"></div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] px-6 py-4 rounded-2xl text-sm font-bold border backdrop-blur-md animate-slideUp shadow-2xl ${
          toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
        }`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">{toast.type === 'error' ? 'report' : 'check_circle'}</span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-[#0a0a0a]/90 backdrop-blur-3xl border-r border-white/10 flex flex-col transition-all duration-300`}>
        <div className="p-6 border-b border-white/10">
          <h1 className="font-display text-xl text-white uppercase tracking-[0.2em]">Rebuild</h1>
          <p className="text-[9px] text-brand font-black tracking-[0.3em] uppercase mt-0.5">Admin HQ</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <Link to="/admin/teams" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined text-base">groups</span>
            Teams
          </Link>

          <div className="pt-4 mt-4 border-t border-white/5 space-y-1.5">
            <div className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand text-white shadow-glow-brand ring-1 ring-white/10">
              <span className="material-symbols-outlined text-base">grade</span>
              Scores
            </div>
            <Link to="/admin/lobby" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined text-base">monitor_heart</span>
              Live Lobby
            </Link>
          </div>
        </nav>

        <div className="p-6 border-t border-white/10">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all">
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 p-5 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <span className="material-symbols-outlined">menu_open</span>
          </button>
          <span className="font-display text-base text-white uppercase tracking-[0.2em]">SCORE MANAGEMENT</span>
          <div className="w-6"></div>
        </div>

        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">

          {/* Header */}
          <div className="bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wider mb-2">Score Management</h2>
            <p className="text-xs text-white/60 font-medium tracking-wide">Manage individual scores, calculate team totals, and qualify teams for next rounds.</p>
          </div>

          {/* Round Selection & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Round Selector */}
            <div className="bg-white/[0.04] border-2 border-white/20 rounded-[2rem] p-6">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Select Round</h3>
              <div className="space-y-2">
                {rounds.map(round => (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRound(round)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedRound?.id === round.id
                        ? 'bg-brand text-white shadow-glow-brand'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <p className="font-bold text-sm">{round.name}</p>
                    <p className="text-[9px] uppercase tracking-widest mt-1 opacity-60">Round {round.round_number}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Qualification Settings */}
            <div className="bg-white/[0.04] border-2 border-white/20 rounded-[2rem] p-6">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Qualification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-white/60 uppercase tracking-widest mb-2">Top N Teams</label>
                  <input
                    type="number"
                    value={qualifyTopN}
                    onChange={(e) => setQualifyTopN(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-mono"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-white/60 uppercase tracking-widest mb-2">Min Average Score</label>
                  <input
                    type="number"
                    value={minScore}
                    onChange={(e) => setMinScore(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-mono"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-[8px] text-white/30 mt-2 uppercase tracking-wider">Fair for all team sizes (2-4 members)</p>
                </div>
                <button
                  onClick={handleQualifyTeams}
                  disabled={saving || !selectedRound}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {saving ? 'Processing...' : 'Qualify Teams'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/[0.04] border-2 border-white/20 rounded-[2rem] p-6">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleCalculateScores}
                  disabled={saving || !selectedRound}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-500/50 disabled:to-pink-500/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">calculate</span>
                  {saving ? 'Calculating...' : 'Calculate Scores'}
                </button>
                <button
                  onClick={() => setShowCsvUpload(!showCsvUpload)}
                  disabled={!selectedRound}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-orange-500/50 disabled:to-red-500/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  {showCsvUpload ? 'Hide CSV Upload' : 'Import CSV Scores'}
                </button>
                <button
                  onClick={handleAnnounceResults}
                  disabled={saving || !selectedRound || selectedRound.results_announced}
                  className="w-full py-3 bg-brand hover:bg-blue-600 disabled:bg-brand/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {selectedRound?.results_announced ? 'Results Announced' : 'Announce Results'}
                </button>
                <button
                  onClick={loadRoundScores}
                  disabled={loading}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* CSV Upload Panel */}
          {showCsvUpload && selectedRound && (
            <div className="bg-white/[0.04] border-2 border-orange-500/40 rounded-[2rem] p-8 space-y-6 animate-slideUp">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-orange-500 text-3xl">upload_file</span>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Import HackerRank Scores</h3>
                  <p className="text-xs text-white/60 mt-1">Upload CSV file with student scores from external assessment</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/20 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">CSV Format</label>
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 font-mono text-xs text-white/80">
                    <div className="text-emerald-400 mb-2">// Expected CSV format (with or without header):</div>
                    <div>email_or_roll_number, score</div>
                    <div className="text-white/40 mt-2">// Example:</div>
                    <div>student@example.com, 85</div>
                    <div>ROLL001, 92</div>
                    <div>student2@example.com, 78</div>
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
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 text-white/40">Line</th>
                            <th className="text-left py-2 text-white/40">Identifier</th>
                            <th className="text-left py-2 text-white/40">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((row) => (
                            <tr key={row.line} className="border-b border-white/5">
                              <td className="py-2 text-white/40">{row.line}</td>
                              <td className="py-2 text-white">{row.parsed[0]}</td>
                              <td className="py-2 text-emerald-400">{row.parsed[1]}</td>
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

                <div className="flex gap-3">
                  <button
                    onClick={handleUploadCsv}
                    disabled={!csvFile || saving}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {saving ? 'Uploading...' : 'Upload & Import Scores'}
                  </button>
                  <button
                    onClick={() => {
                      setCsvFile(null);
                      setCsvPreview([]);
                      setShowCsvUpload(false);
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-400 text-lg">info</span>
                  <div className="text-xs text-blue-400/90 space-y-1">
                    <p className="font-bold">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-400/70">
                      <li>CSV must contain student email or roll number in first column</li>
                      <li>Score should be in second column (0-100)</li>
                      <li>Header row will be automatically detected and skipped</li>
                      <li>Students not found in database will be skipped</li>
                      <li>Existing scores for this round will be replaced</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scores Table */}
          {selectedRound && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em]">Individual Scores - {selectedRound.name}</h3>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                  <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Loading Scores...</span>
                </div>
              ) : teams.length === 0 ? (
                <div className="py-20 text-center opacity-20 uppercase tracking-[0.3em] text-[10px] font-black">No teams found</div>
              ) : (
                <div className="space-y-6">
                  {teams.map(team => (
                    <div key={team.id} className="bg-white/[0.04] border-2 border-white/20 rounded-[2rem] p-6 md:p-8">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="text-lg font-bold text-white uppercase tracking-wider">{team.team_name}</h4>
                          <p className="text-[9px] font-mono text-brand font-black uppercase tracking-widest mt-1">{team.team_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Team Average</p>
                          <p className="text-2xl font-display font-bold text-brand">{getTeamScore(team.id).toFixed(1)}</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">{team.students?.length || 0} members</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {team.students?.map(student => {
                          const studentScore = scores[student.id];
                          const isEditing = editingScore === student.id;

                          return (
                            <div key={student.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                              <div className="flex-1">
                                <p className="font-bold text-white text-sm">{student.full_name}</p>
                                <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{student.roll_number}</p>
                              </div>

                              {isEditing ? (
                                <div className="flex items-center gap-3">
                                  <input
                                    type="number"
                                    defaultValue={studentScore?.score || 0}
                                    id={`score-${student.id}`}
                                    className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
                                    step="0.1"
                                    min="0"
                                  />
                                  <span className="text-white/40">/</span>
                                  <input
                                    type="number"
                                    defaultValue={studentScore?.max_score || 100}
                                    id={`max-${student.id}`}
                                    className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
                                    step="0.1"
                                    min="0"
                                  />
                                  <button
                                    onClick={() => {
                                      const score = document.getElementById(`score-${student.id}`).value;
                                      const maxScore = document.getElementById(`max-${student.id}`).value;
                                      handleSaveScore(student.id, score, maxScore);
                                    }}
                                    disabled={saving}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingScore(null)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-white">
                                      {studentScore?.correct_count || 0}/{studentScore?.total_questions || 0} correct
                                    </p>
                                    <p className="text-sm text-white/40">
                                      {studentScore?.wrong_count || 0} wrong • {studentScore?.percentage?.toFixed(1) || 0}%
                                    </p>
                                    <p className="text-xs text-brand font-bold">
                                      {studentScore?.score?.toFixed(1) || 0} points
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => setEditingScore(student.id)}
                                    className="p-2 bg-white/10 hover:bg-brand text-white rounded-lg transition-all"
                                  >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        <footer className="mt-10 py-10 border-t border-white/10 flex items-center justify-center opacity-30">
          <div className="flex items-center gap-6 text-[8px] font-black uppercase tracking-[0.4em]">
            <span>DKTE COMMAND</span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span>SCORE_MANAGEMENT</span>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default AdminScoreManagement;
