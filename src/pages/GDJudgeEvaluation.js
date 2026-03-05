import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const GDJudgeEvaluation = () => {
  const { profile, signOut } = useAuth();

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [students, setStudents] = useState([]);
  const [pastScores, setPastScores] = useState({}); // {student_id: [scores]}

  const [evaluation, setEvaluation] = useState({}); // {student_id: {criteria: score}}
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // CSV Upload state
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);

  const criteriaList = [
    { id: 'communication', label: 'Communication' },
    { id: 'confidence', label: 'Confidence' },
    { id: 'knowledge', label: 'Subject Knowledge' },
    { id: 'teamwork', label: 'Teamwork/Collaboration' }
  ];

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // Get teams for Round 3 (GD)
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('status', 'qualified')
        .order('team_name', { ascending: true });
      setTeams(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectTeam = async (team) => {
    setSelectedTeam(team);
    setLoading(true);
    try {
      // Get students in team
      const { data: members } = await supabase
        .from('students')
        .select('*')
        .eq('team_id', team.id);
      setStudents(members || []);

      // Get past scores for these students (Round 1 & 2)
      const studentIds = members.map(m => m.id);
      const { data: scores } = await supabase
        .from('student_scores')
        .select('*, rounds(name, round_number)')
        .in('student_id', studentIds);

      const scoreMap = {};
      scores?.forEach(s => {
        if (!scoreMap[s.student_id]) scoreMap[s.student_id] = [];
        scoreMap[s.student_id].push(s);
      });
      setPastScores(scoreMap);

      // Initialize evaluation state
      const initialEval = {};
      members.forEach(m => {
        initialEval[m.id] = { communication: 0, confidence: 0, knowledge: 0, teamwork: 0 };
      });
      setEvaluation(initialEval);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleScoreChange = (studentId, crit, val) => {
    setEvaluation(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [crit]: val }
    }));
  };

  const handleSubmitEvaluation = async (studentId) => {
    const scores = evaluation[studentId];
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const max = criteriaList.length * 10;
    const percentage = (total / max) * 100;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('student_scores')
        .upsert({
          student_id: studentId,
          round_id: (await supabase.from('rounds').select('id').eq('round_number', 3).single()).data.id,
          score: total,
          max_score: max,
          percentage: percentage,
          remarks: remarks[studentId] || '',
          evaluated_by: profile.id
        }, { onConflict: 'student_id, round_id' });

      if (error) throw error;
      alert('Evaluation saved successfully');
    } catch (e) {
      console.error(e);
      alert('Error saving evaluation');
    } finally {
      setSubmitting(false);
    }
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
        return { line: idx + 1, raw: line, parsed: parts };
      });
      
      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleUploadCsv = async () => {
    if (!csvFile) return;

    try {
      setSubmitting(true);
      setUploadProgress('Reading CSV file...');

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        setUploadProgress(`Processing ${lines.length} rows...`);

        // Expected format: team_name, student_email/roll, score
        const scores = [];
        let skippedRows = 0;
        let headerSkipped = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(',').map(p => p.trim());
          
          // Skip header
          if (!headerSkipped && (parts[2] === 'score' || parts[2] === 'Score' || isNaN(parseFloat(parts[2])))) {
            headerSkipped = true;
            continue;
          }

          if (parts.length < 3) {
            skippedRows++;
            continue;
          }

          const teamName = parts[0];
          const identifier = parts[1]; // email or roll_number
          const score = parseFloat(parts[2]);

          if (isNaN(score)) {
            skippedRows++;
            continue;
          }

          scores.push({ teamName, identifier, score });
        }

        setUploadProgress(`Mapping ${scores.length} students...`);

        // Get Round 3 (GD) ID
        const { data: roundData } = await supabase
          .from('rounds')
          .select('id')
          .eq('round_number', 3)
          .single();

        if (!roundData) {
          alert('GD Round not found in database');
          return;
        }

        const studentScores = [];
        let notFound = 0;

        for (const { identifier, score } of scores) {
          const { data: studentData } = await supabase
            .from('students')
            .select('id, full_name, email, roll_number')
            .or(`email.eq.${identifier},roll_number.eq.${identifier}`)
            .single();

          if (studentData) {
            studentScores.push({
              student_id: studentData.id,
              round_id: roundData.id,
              score: score,
              max_score: 40,
              percentage: (score / 40) * 100,
              evaluated_by: profile.id
            });
          } else {
            notFound++;
            console.warn(`Student not found: ${identifier}`);
          }
        }

        if (studentScores.length === 0) {
          alert('No matching students found');
          return;
        }

        setUploadProgress(`Saving ${studentScores.length} scores...`);

        // Delete existing scores for this round
        await supabase
          .from('student_scores')
          .delete()
          .eq('round_id', roundData.id);

        // Insert new scores
        const { error: insertError } = await supabase
          .from('student_scores')
          .insert(studentScores);

        if (insertError) throw insertError;

        alert(`Successfully imported ${studentScores.length} scores! ${notFound > 0 ? `(${notFound} not found)` : ''}`);
        
        setCsvFile(null);
        setCsvPreview([]);
        setShowCsvUpload(false);
        setUploadProgress(null);
        
        if (selectedTeam) {
          selectTeam(selectedTeam);
        }
      };

      reader.readAsText(csvFile);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Error: ' + error.message);
      setUploadProgress(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && teams.length === 0) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">

      {/* Sidebar: Team Queue */}
      <aside className="w-80 border-r border-white/5 bg-[#0a0a0a] flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h1 className="font-display text-lg tracking-widest uppercase text-brand">Rebuild</h1>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mt-1">GD Judge Panel</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="px-3 text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Qualified Teams</p>
          {teams.map(t => (
            <button
              key={t.id}
              onClick={() => selectTeam(t)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${selectedTeam?.id === t.id ? 'bg-brand/15 border-brand/30 text-white' : 'bg-transparent border-transparent text-white/40 hover:bg-white/5 hover:text-white/60'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.team_name}</span>
                <span className="text-[10px] font-mono opacity-50">{t.team_code}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setShowCsvUpload(!showCsvUpload)}
            className="w-full py-3 mb-2 text-xs text-white/60 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            {showCsvUpload ? 'Hide CSV Upload' : 'Upload CSV Scores'}
          </button>
          <button onClick={() => signOut()} className="w-full py-3 text-xs text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">logout</span>
            Exit Judge Portal
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {showCsvUpload ? (
          <div className="flex-1 overflow-y-auto p-8 bg-[#050505]">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/[0.04] border-2 border-orange-500/40 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-orange-500 text-3xl">upload_file</span>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Import GD Scores (CSV)</h3>
                    <p className="text-xs text-white/60 mt-1">Upload CSV with team and individual student scores</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">CSV Format</label>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 font-mono text-xs text-white/80">
                      <div className="text-emerald-400 mb-2">// Expected format (3 teams combined):</div>
                      <div>team_name, student_email_or_roll, score</div>
                      <div className="text-white/40 mt-2">// Example:</div>
                      <div>Team Alpha, student1@example.com, 35</div>
                      <div>Team Alpha, student2@example.com, 38</div>
                      <div>Team Beta, ROLL001, 32</div>
                      <div>Team Beta, ROLL002, 36</div>
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
                              <th className="text-left py-2 text-white/40">Team</th>
                              <th className="text-left py-2 text-white/40">Student</th>
                              <th className="text-left py-2 text-white/40">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((row) => (
                              <tr key={row.line} className="border-b border-white/5">
                                <td className="py-2 text-white/40">{row.line}</td>
                                <td className="py-2 text-white">{row.parsed[0]}</td>
                                <td className="py-2 text-white">{row.parsed[1]}</td>
                                <td className="py-2 text-emerald-400">{row.parsed[2]}</td>
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
                      disabled={!csvFile || submitting}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {submitting ? 'Uploading...' : 'Upload & Import Scores'}
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
                        <li>CSV can contain multiple teams (3 teams combined)</li>
                        <li>Each row: team_name, student_email/roll, score (0-40)</li>
                        <li>Header row will be automatically detected and skipped</li>
                        <li>Students not found in database will be skipped</li>
                        <li>Team scores calculated as average of member scores</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !selectedTeam ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <span className="material-symbols-outlined text-6xl mb-4">groups</span>
            <p className="text-sm uppercase tracking-widest font-display">Select a team to begin evaluation</p>
          </div>
        ) : (
          <>
            <header className="h-20 border-b border-white/5 bg-[#0a0a0a] px-8 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-display uppercase tracking-wider">{selectedTeam.team_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-brand">{selectedTeam.team_code}</span>
                  <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Evaluating: Round 03 GD</span>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Team Size</p>
                  <p className="text-lg font-bold">{students.length}</p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 bg-[#050505]">
              <div className="max-w-5xl mx-auto space-y-12">
                {students.map((student) => (
                  <div key={student.id} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 animate-slideUp">
                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                      <div className="flex items-start gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-display text-2xl">
                          {student.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{student.full_name}</h3>
                          <p className="text-xs text-white/30 font-mono mt-1">{student.roll_number}</p>

                          {/* Past Performance */}
                          {pastScores[student.id] && (
                            <div className="flex gap-2 mt-4">
                              {pastScores[student.id].map(ps => (
                                <div key={ps.id} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg">
                                  <p className="text-[8px] text-white/20 uppercase font-bold tracking-tighter">{ps.rounds.name}</p>
                                  <p className="text-xs font-bold text-brand">{ps.score}<span className="text-[10px] font-normal text-white/20">/{ps.max_score}</span></p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-1">Current GD Total</p>
                        <p className="text-3xl font-display text-white">
                          {Object.values(evaluation[student.id] || {}).reduce((a, b) => a + b, 0)}
                          <span className="text-sm font-normal text-white/20">/40</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      {criteriaList.map((crit) => (
                        <div key={crit.id} className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-white/40">{crit.label}</span>
                            <span className="text-brand">{evaluation[student.id]?.[crit.id] || 0}/10</span>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(10)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => handleScoreChange(student.id, crit.id, i + 1)}
                                className={`flex-1 h-8 rounded-md text-[10px] font-bold transition-all ${evaluation[student.id]?.[crit.id] === i + 1
                                    ? 'bg-brand text-white shadow-lg shadow-brand/20 scale-110 z-10'
                                    : 'bg-white/5 text-white/20 hover:bg-white/10 hover:text-white/40'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row items-end gap-6">
                      <div className="flex-1 w-full">
                        <label className="text-[10px] text-white/20 uppercase font-bold tracking-widest block mb-2">Observations / Remarks</label>
                        <textarea
                          placeholder="Note down strengths and weaknesses..."
                          value={remarks[student.id] || ''}
                          onChange={(e) => setRemarks({ ...remarks, [student.id]: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/10 transition-all resize-none h-20"
                        />
                      </div>
                      <button
                        onClick={() => handleSubmitEvaluation(student.id)}
                        disabled={submitting}
                        className="px-8 py-4 bg-white/5 hover:bg-brand hover:text-white border border-white/10 text-white/60 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : 'Save Evaluation'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default GDJudgeEvaluation;
