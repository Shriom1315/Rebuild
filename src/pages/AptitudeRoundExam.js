import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const AptitudeRoundExam = () => {
  const navigate = useNavigate();
  const { team, currentStudent, signOut } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes default
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roundInfo, setRoundInfo] = useState(null);

  // SEB States
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isEliminated, setIsEliminated] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    setLoading(true);
    try {
      // Get Round 1 (Aptitude)
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('round_number', 1)
        .single();

      if (round) {
        setRoundInfo(round);
        if (round.duration_minutes) setTimeLeft(round.duration_minutes * 60);

        // Get questions
        const { data: qs } = await supabase
          .from('questions')
          .select('*')
          .eq('round_id', round.id)
          .order('question_order', { ascending: true });

        setQuestions(qs || []);

        // Get existing team-round status (for violations)
        const { data: statusData } = await supabase
          .from('team_round_status')
          .select('violation_count, status')
          .eq('team_id', team.id)
          .eq('round_id', round.id)
          .single();

        if (statusData) {
          setViolationCount(statusData.violation_count || 0);
          if (statusData.status === 'eliminated') {
            setIsEliminated(true);
          }
        }

        // Also check if already submitted
        const { data: existingAnswers } = await supabase
          .from('student_answers')
          .select('question_id, selected_answer')
          .eq('student_id', currentStudent.id)
          .eq('round_id', round.id);

        if (existingAnswers && existingAnswers.length > 0) {
          const ansMap = {};
          existingAnswers.forEach(a => ansMap[a.question_id] = a.selected_answer);
          setAnswers(ansMap);
        }
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViolation = useCallback(async (reason) => {
    if (isEliminated || loading) return;

    const newCount = violationCount + 1;
    setViolationCount(newCount);

    const maxWarnings = roundInfo?.seb_max_warnings || 3;

    if (newCount >= maxWarnings) {
      setIsEliminated(true);
      setWarningMessage("PROTOCOL TERMINATED: Maximum violations exceeded. You have been eliminated.");
      setShowWarning(true);

      // Update DB
      await supabase
        .from('team_round_status')
        .upsert({
          team_id: team.id,
          round_id: roundInfo.id,
          status: 'eliminated',
          violation_count: newCount,
          message: `Eliminated due to SEB violations (${reason})`
        }, { onConflict: 'team_id, round_id' });

      // Also update team table
      await supabase.from('teams').update({ status: 'eliminated' }).eq('id', team.id);
    } else {
      setWarningMessage(`SECURITY ALERT: ${reason}. Warning ${newCount}/${maxWarnings}.`);
      setShowWarning(true);

      // Update DB violation count
      await supabase
        .from('team_round_status')
        .upsert({
          team_id: team.id,
          round_id: roundInfo.id,
          violation_count: newCount
        }, { onConflict: 'team_id, round_id' });
    }
  }, [violationCount, isEliminated, loading, roundInfo, team]);

  // SEB Monitoring
  useEffect(() => {
    if (loading || isEliminated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Window Focus Lost");
      }
    };

    const handleBlur = () => {
      handleViolation("Navigation Detected");
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation("Restricted Window Mode Exit");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [loading, isEliminated, handleViolation]);

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || isEliminated) return;
    setSubmitting(true);
    try {
      const submissionData = Object.entries(answers).map(([qId, val]) => ({
        student_id: currentStudent.id,
        question_id: qId,
        round_id: roundInfo.id,
        selected_answer: val,
      }));

      if (submissionData.length > 0) {
        const { error } = await supabase
          .from('student_answers')
          .upsert(submissionData, { onConflict: 'student_id, question_id' });
        if (error) throw error;
      }

      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, currentStudent, roundInfo, navigate, submitting, isEliminated]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    if (isEliminated) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit, isEliminated]);

  const handleSelectOption = (option) => {
    if (isEliminated) return;
    const qId = questions[currentIdx].id;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-white/20 mb-6">quiz</span>
        <h2 className="text-2xl font-display uppercase tracking-widest text-white">No Questions Found</h2>
        <p className="text-white/60 text-sm mt-3 max-w-sm">Simulation data for this round has not been uploaded to the mainframe.</p>
        <button onClick={() => navigate('/student/dashboard')} className="mt-10 px-8 py-3 bg-brand text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-glow-brand">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="bg-[#050505] text-white min-h-screen flex flex-col font-sans selection:bg-brand/30">

      {/* SEB WARNING MODAL */}
      {(showWarning || !document.fullscreenElement) && !isEliminated && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border-2 border-red-500/50 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-6 animate-pulse">report</span>
            <h3 className="text-xl font-display text-white uppercase tracking-widest mb-4">Integrity Violation</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              {document.fullscreenElement ? warningMessage : "Protocol requires Full-Screen surveillance. Re-establish connection to proceed."}
            </p>
            <button
              onClick={() => { enterFullScreen(); setShowWarning(false); }}
              className="w-full py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105 transition-all"
            >
              Establish Secure Link
            </button>
          </div>
        </div>
      )}

      {/* ELIMINATION MODAL */}
      {isEliminated && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-black">
          <div className="text-center">
            <span className="material-symbols-outlined text-8xl text-red-600 mb-8 animate-ping">dangerous</span>
            <h2 className="text-4xl font-display text-white uppercase tracking-[0.3em] mb-4">Unit Terminated</h2>
            <p className="text-red-500/60 text-xs font-black uppercase tracking-[0.5em] mb-12">Security Protocol Violation Threshold Reached</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-12 py-4 border-2 border-white/20 text-white hover:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all"
            >
              Exit Simulation
            </button>
          </div>
        </div>
      )}

      {/* CONSISTENT NAV BAR */}
      <header className="w-full px-8 py-4 border-b border-white/20 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/student/dashboard" className="flex items-center gap-2">
              <span className="font-display text-lg tracking-[0.3em] uppercase text-white">Rebuild</span>
            </Link>
            <div className="h-4 w-px bg-white/30 hidden md:block"></div>
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-white font-bold tracking-widest uppercase">{roundInfo?.name}</span>
              <span className="text-[8px] text-brand/80 uppercase tracking-[0.4em] font-black">SURVEILLANCE ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className={`flex flex-col items-end px-6 border-r border-white/10 ${timeLeft < 300 ? 'animate-pulse' : ''}`}>
              <span className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-1">WINDOW</span>
              <span className={`text-xl font-mono font-bold tracking-tighter ${timeLeft < 300 ? 'text-red-500' : 'text-brand'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              className="hidden sm:flex items-center gap-3 px-8 py-3 bg-brand/10 border border-brand/20 hover:bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Submit
            </button>
          </div>
        </div>
      </header>

      {/* Main Exam Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 md:py-16 relative">
        <div className="flex flex-col h-full">

          {/* Progress Controller */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mb-1">OBJECTIVE {currentIdx + 1} OF {questions.length}</span>
              <div className="h-1 w-64 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-500 shadow-glow-brand"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 overflow-hidden">
              <span className="text-[8px] font-black text-brand uppercase tracking-widest mr-4">Protocol_Index:</span>
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentIdx ? 'bg-brand scale-125' :
                    answers[questions[i].id] ? 'bg-white/40' : 'bg-white/5'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Question Interface */}
          <div className="bg-white/[0.02] border-2 border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xl md:text-2xl text-white leading-relaxed font-bold mb-14 max-w-3xl">
                {currentQuestion.question_text}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['a', 'b', 'c', 'd'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all text-left group shadow-xl ${answers[currentQuestion.id] === opt
                      ? 'bg-brand border-brand shadow-glow-brand'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 uppercase transition-all ${answers[currentQuestion.id] === opt ? 'bg-white text-brand' : 'bg-white/10 text-white/40 group-hover:text-white'
                      }`}>
                      {opt}
                    </div>
                    <span className={`text-sm md:text-base font-bold ${answers[currentQuestion.id] === opt ? 'text-white' : 'text-white/60 group-hover:text-white'
                      }`}>
                      {currentQuestion[`option_${opt}`]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-12 gap-8">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-4 px-8 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-white/20 hover:text-white border-2 border-white/10 hover:border-white/30 transition-all disabled:opacity-0"
            >
              <span className="material-symbols-outlined text-sm">west</span>
              Previous
            </button>

            <button
              onClick={() => { if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1); }}
              disabled={currentIdx === questions.length - 1}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-4 px-8 py-5 bg-white/5 hover:bg-brand border-2 border-white/10 hover:border-brand rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-0 group"
            >
              Next
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">east</span>
            </button>
          </div>
        </div>
      </main>

      {/* SYSTEM INTEGRITY FOOTER */}
      <footer className="px-8 py-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-20">
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em]">
            <span>SURVEILLANCE_ACTIVE</span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span>VIOLATIONS: {violationCount}/{roundInfo?.seb_max_warnings || 3}</span>
          </div>
          <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">
            SECURE_EXAM_BROWSER_EMULATION_V2
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AptitudeRoundExam;
