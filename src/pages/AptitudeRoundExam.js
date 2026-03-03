import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const AptitudeRoundExam = () => {
  const navigate = useNavigate();
  const { team, currentStudent, signOut } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes default
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roundInfo, setRoundInfo] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showPaletteOnMobile, setShowPaletteOnMobile] = useState(false);

  // SEB States (forced fullscreen + violation tracking)
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationBanner, setShowViolationBanner] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [isEliminated, setIsEliminated] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showSebModal, setShowSebModal] = useState(false);
  const [sebModalMessage, setSebModalMessage] = useState('');

  // ═══ REFS for SEB — avoids stale closure issues ═══
  const violationCountRef = useRef(0);
  const isEliminatedRef = useRef(false);
  const roundInfoRef = useRef(null);
  const lastViolationTimeRef = useRef(0);
  const maxWarningsRef = useRef(3);

  // Keep refs in sync with state
  useEffect(() => { violationCountRef.current = violationCount; }, [violationCount]);
  useEffect(() => { isEliminatedRef.current = isEliminated; }, [isEliminated]);
  useEffect(() => {
    roundInfoRef.current = roundInfo;
    if (roundInfo?.seb_max_warnings != null) {
      maxWarningsRef.current = roundInfo.seb_max_warnings;
    }
  }, [roundInfo]);

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
        roundInfoRef.current = round;
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
          violationCountRef.current = statusData.violation_count || 0;
          if (statusData.status === 'eliminated') {
            setIsEliminated(true);
            isEliminatedRef.current = true;
          }
        }

        // Also check localStorage for previous elimination
        const wasEliminated = localStorage.getItem(`eliminated_${team.id}_${round.id}`);
        if (wasEliminated) {
          setIsEliminated(true);
          isEliminatedRef.current = true;
        }

        // Check if already submitted — prevent re-taking
        const { data: existingAnswers } = await supabase
          .from('student_answers')
          .select('question_id, selected_answer, submitted')
          .eq('student_id', currentStudent.id)
          .eq('round_id', round.id);

        if (existingAnswers && existingAnswers.length > 0) {
          // Check if any answer has submitted=true or if there are answers at all
          const isSubmitted = existingAnswers.some(a => a.submitted === true) || existingAnswers.length >= (qs?.length || 0);

          // Check localStorage for submission flag as backup
          const localSubmitted = localStorage.getItem(`exam_submitted_${currentStudent.id}_${round.id}`);

          if (isSubmitted || localSubmitted) {
            setHasSubmitted(true);
          }

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

  // ═══ FULLSCREEN HELPERS ═══
  const enterFullScreen = () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(e => {
          console.log('Fullscreen request denied:', e);
          // Don't show error to user, just log it
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } catch (e) {
      console.error('Fullscreen request failed:', e);
    }
  };

  const exitFullScreen = () => {
    try {
      // Check if actually in fullscreen before trying to exit
      const isFullscreen = document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.mozFullScreenElement || 
                          document.msFullscreenElement;
      
      if (!isFullscreen) return; // Not in fullscreen, nothing to do
      
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(e => console.log('Exit fullscreen cancelled:', e));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } catch (e) {
      console.error('Exit fullscreen failed:', e);
    }
  };

  // Auto-enter fullscreen when exam loads
  useEffect(() => {
    if (!loading && !hasSubmitted && !isEliminated && questions.length > 0) {
      // Small delay to allow user interaction (browsers require user gesture)
      if (!document.fullscreenElement) {
        setShowSebModal(true);
        setSebModalMessage('This exam requires Full-Screen Secure Mode. Click below to begin.');
      }
    }
  }, [loading, hasSubmitted, isEliminated, questions.length]);

  // ═══ SEB VIOLATION HANDLER (uses refs to avoid stale closures) ═══
  const handleViolation = useCallback(async (reason) => {
    // Use refs for latest values — avoids stale closure from event listeners
    if (isEliminatedRef.current || !roundInfoRef.current) return;

    // Debounce: blur + visibilitychange fire together on tab switch
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 500) return;
    lastViolationTimeRef.current = now;

    const newCount = violationCountRef.current + 1;
    violationCountRef.current = newCount;
    setViolationCount(newCount);

    const maxWarnings = maxWarningsRef.current;

    if (newCount >= maxWarnings) {
      // ═══ ELIMINATION ═══
      isEliminatedRef.current = true;
      setIsEliminated(true);
      setViolationMessage("PROTOCOL TERMINATED: Maximum violations exceeded. You have been eliminated.");
      setShowViolationBanner(true);

      // Persist elimination to localStorage
      localStorage.setItem(`eliminated_${team.id}_${roundInfoRef.current.id}`, 'true');

      // Exit fullscreen on elimination (with safety check)
      setTimeout(() => exitFullScreen(), 500); // Small delay to ensure state is updated

      // ═══ AUTO-SUBMIT ANSWERS ON ELIMINATION ═══
      try {
        // Submit whatever answers they have so far
        const submissionData = Object.entries(answers).map(([qId, val]) => ({
          student_id: currentStudent.id,
          question_id: qId,
          round_id: roundInfoRef.current.id,
          selected_answer: val,
          submitted: true,
          is_eliminated: true // Mark as eliminated submission
        }));

        if (submissionData.length > 0) {
          await supabase
            .from('student_answers')
            .upsert(submissionData, { onConflict: 'student_id, question_id' });
        }

        // Mark as submitted in localStorage
        localStorage.setItem(`exam_submitted_${currentStudent.id}_${roundInfoRef.current.id}`, 'true');
        setHasSubmitted(true);
      } catch (submitError) {
        console.error('Error auto-submitting on elimination:', submitError);
      }

      // Update DB — mark team round status as eliminated
      try {
        await supabase
          .from('team_round_status')
          .upsert({
            team_id: team.id,
            round_id: roundInfoRef.current.id,
            status: 'eliminated',
            violation_count: newCount,
            message: `Eliminated: ${reason} (${newCount} violations)`
          }, { onConflict: 'team_id, round_id' });

        // Also update team table status to eliminated
        await supabase.from('teams').update({ status: 'eliminated' }).eq('id', team.id);
      } catch (dbError) {
        console.error('Error saving elimination:', dbError);
      }
    } else {
      // ═══ WARNING — show blocking modal + force fullscreen ═══
      setViolationMessage(`⚠ ${reason} — Warning ${newCount}/${maxWarnings}`);
      setShowViolationBanner(true);
      setSebModalMessage(`SECURITY ALERT: ${reason}. Warning ${newCount}/${maxWarnings}. Re-enter Secure Mode to continue.`);
      setShowSebModal(true);

      // Auto-hide banner after 4s
      setTimeout(() => setShowViolationBanner(false), 4000);

      // Update DB violation count
      try {
        await supabase
          .from('team_round_status')
          .upsert({
            team_id: team.id,
            round_id: roundInfoRef.current.id,
            violation_count: newCount
          }, { onConflict: 'team_id, round_id' });
      } catch (dbError) {
        console.error('Error saving violation:', dbError);
      }
    }
  }, [team, currentStudent, answers]); // Added answers and currentStudent to dependencies

  // ═══ SEB EVENT LISTENERS (Forced Fullscreen Mode) ═══
  useEffect(() => {
    if (loading || hasSubmitted) return;

    // Prevent page unload/refresh during exam
    const handleBeforeUnload = (e) => {
      if (!isEliminatedRef.current && !hasSubmitted) {
        e.preventDefault();
        e.returnValue = 'Your exam is in progress. Leaving this page will count as a violation.';
        return e.returnValue;
      }
    };

    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden && !isEliminatedRef.current) {
        handleViolation("Tab Switch Detected");
      }
    };

    // Window blur detection
    const handleBlur = () => {
      if (!isEliminatedRef.current) {
        handleViolation("Window Focus Lost");
      }
    };

    // Fullscreen exit detection — force back to fullscreen
    const handleFullScreenChange = () => {
      const isFullscreen = document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.mozFullScreenElement || 
                          document.msFullscreenElement;
      
      if (!isFullscreen && !isEliminatedRef.current && !hasSubmitted) {
        handleViolation("Fullscreen Mode Exited");
      }
    };

    // Block right-click
    const handleContextMenu = (e) => { e.preventDefault(); };

    // Block copy, cut, paste events
    const handleCopy = (e) => { e.preventDefault(); return false; };
    const handleCut = (e) => { e.preventDefault(); return false; };
    const handlePaste = (e) => { e.preventDefault(); return false; };
    const handleSelectStart = (e) => { e.preventDefault(); return false; };
    const handleDragStart = (e) => { e.preventDefault(); return false; };
    const handleDrop = (e) => { e.preventDefault(); return false; };
    
    // Block mouse selection
    const handleMouseDown = (e) => {
      // Allow clicking on buttons and inputs
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
        return;
      }
      // Prevent text selection on other elements
      if (e.detail > 1) {
        e.preventDefault();
        return false;
      }
    };

    // Block DevTools, copy shortcuts, Escape key, and Print Screen
    const handleKeyDown = (e) => {
      if (isEliminatedRef.current) return;
      
      // Block Escape key from exiting fullscreen
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Block F12 and DevTools shortcuts
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("DevTools Access Attempt");
        return false;
      }
      
      // Block Print Screen
      if (e.key === 'PrintScreen' || e.key === 'Print') {
        e.preventDefault();
        handleViolation("Screenshot Attempt Detected");
        return false;
      }
      
      // Block ALL copy/paste/select-all/view-source/save/print shortcuts
      if (e.ctrlKey || e.metaKey) {
        const blockedKeys = ['c', 'C', 'v', 'V', 'x', 'X', 'a', 'A', 'u', 'U', 's', 'S', 'p', 'P'];
        if (blockedKeys.includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      
      // Block Alt+Tab and Windows key
      if ((e.altKey && e.key === 'Tab') || e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Block F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('msfullscreenchange', handleFullScreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [loading, hasSubmitted, handleViolation]);

  const handleSubmit = useCallback(async () => {
    if (submitting || isEliminated || hasSubmitted) return;
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

      // Mark as submitted in localStorage
      localStorage.setItem(`exam_submitted_${currentStudent.id}_${roundInfo.id}`, 'true');
      setHasSubmitted(true);
      setShowConfirmSubmit(false);

      // Exit fullscreen after submission (with safety check)
      setTimeout(() => exitFullScreen(), 500); // Small delay to ensure state is updated
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, currentStudent, roundInfo, submitting, isEliminated, hasSubmitted]);

  // Timer logic
  useEffect(() => {
    if (hasSubmitted || isEliminated) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit, isEliminated, hasSubmitted]);

  const handleSelectOption = (option) => {
    if (isEliminated || hasSubmitted) return;
    const qId = questions[currentIdx].id;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const toggleMarkForReview = () => {
    if (isEliminated || hasSubmitted) return;
    const qId = questions[currentIdx].id;
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (qId, idx) => {
    if (idx === currentIdx) return 'current';
    if (markedForReview.has(qId)) return 'review';
    if (answers[qId]) return 'answered';
    return 'unanswered';
  };

  const answeredCount = questions.filter(q => answers[q.id]).length;
  const unansweredCount = questions.length - answeredCount;
  const reviewCount = markedForReview.size;
  const maxWarnings = maxWarningsRef.current;

  // ═══ LOADING SCREEN ═══
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Loading Exam Protocol...</span>
        </div>
      </div>
    );
  }

  // ═══ NO QUESTIONS ═══
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

  // ═══ ALREADY SUBMITTED ═══
  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-emerald-400">task_alt</span>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <span className="material-symbols-outlined text-white text-sm">check</span>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-display uppercase tracking-[0.2em] text-white mb-4">
          Test Submitted
        </h2>
        <p className="text-white/50 text-sm max-w-md leading-relaxed mb-3">
          Your responses have been recorded successfully. You cannot retake this assessment.
        </p>
        <p className="text-[10px] text-brand/80 uppercase tracking-[0.4em] font-black mb-10">
          Results will be visible after admin reveals scores
        </p>

        <div className="flex flex-wrap gap-6 mb-12">
          <div className="px-6 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-center">
            <p className="text-2xl font-display font-bold text-emerald-400">{answeredCount}</p>
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1">Answered</p>
          </div>
          <div className="px-6 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-center">
            <p className="text-2xl font-display font-bold text-white/40">{unansweredCount}</p>
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1">Skipped</p>
          </div>
          <div className="px-6 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-center">
            <p className="text-2xl font-display font-bold text-white/60">{questions.length}</p>
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1">Total</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/student/dashboard')}
          className="px-10 py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-glow-brand hover:scale-105 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ═══ ELIMINATION SCREEN ═══
  if (isEliminated) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
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
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div 
      className="bg-[#050505] text-white h-screen flex flex-col font-sans overflow-hidden" 
      style={{ 
        userSelect: 'none', 
        WebkitUserSelect: 'none', 
        MozUserSelect: 'none', 
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        KhtmlUserSelect: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      
      {/* Global CSS to disable text selection */}
      <style>{`
        * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        ::selection {
          background: transparent !important;
          color: inherit !important;
        }
        ::-moz-selection {
          background: transparent !important;
          color: inherit !important;
        }
      `}</style>

      {/* ═══ SEB FULLSCREEN ENFORCEMENT MODAL (blocking) ═══ */}
      {showSebModal && !isEliminated && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border-2 border-red-500/50 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-[0_0_80px_rgba(239,68,68,0.15)]">
            <div className="w-20 h-20 mx-auto mb-6 rounded-[1.5rem] bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-500 animate-pulse">shield_lock</span>
            </div>
            <h3 className="text-xl font-display text-white uppercase tracking-widest mb-4">Secure Exam Mode</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-3">{sebModalMessage}</p>
            {violationCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                <span className="material-symbols-outlined text-red-400 text-sm">warning</span>
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                  Violations: {violationCount}/{maxWarnings}
                </span>
              </div>
            )}
            <button
              onClick={() => { enterFullScreen(); setShowSebModal(false); }}
              className="w-full py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.4)] hover:scale-[1.02] transition-all"
            >
              Enter Secure Fullscreen Mode
            </button>
            <p className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-black mt-6">
              Switching tabs or exiting fullscreen will count as a violation
            </p>
          </div>
        </div>
      )}

      {/* ═══ VIOLATION BANNER (non-blocking toast on top) ═══ */}
      {showViolationBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-red-500/15 border border-red-500/40 rounded-xl backdrop-blur-xl shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-slideUp">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400 text-lg animate-pulse">warning</span>
            <span className="text-xs font-bold text-red-400">{violationMessage}</span>
            <button onClick={() => setShowViolationBanner(false)} className="text-red-400/40 hover:text-red-400 ml-3">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ CONFIRM SUBMIT MODAL ═══ */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border-2 border-white/20 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl">
            <span className="material-symbols-outlined text-5xl text-brand mb-6">assignment_turned_in</span>
            <h3 className="text-xl font-display text-white uppercase tracking-widest mb-4">Submit Assessment?</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-3">
              Once submitted, you <strong className="text-white">cannot retake</strong> this test.
            </p>

            <div className="flex justify-center gap-6 my-6">
              <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <p className="text-lg font-bold text-emerald-400">{answeredCount}</p>
                <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest">Answered</p>
              </div>
              <div className="px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                <p className="text-lg font-bold text-orange-400">{unansweredCount}</p>
                <p className="text-[8px] font-black text-orange-400/60 uppercase tracking-widest">Unanswered</p>
              </div>
              <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <p className="text-lg font-bold text-amber-400">{reviewCount}</p>
                <p className="text-[8px] font-black text-amber-400/60 uppercase tracking-widest">Marked</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-4 bg-white/5 border-2 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 rounded-xl transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-4 bg-brand hover:shadow-glow-brand text-[10px] font-black uppercase tracking-[0.2em] text-white rounded-xl transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TOP NAV BAR ═══ */}
      <header className="w-full px-4 md:px-8 py-3 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md z-50 shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/student/dashboard" className="flex items-center gap-2">
              <span className="font-display text-base md:text-lg tracking-[0.3em] uppercase text-white">Rebuild</span>
            </Link>
            <div className="h-4 w-px bg-white/20 hidden md:block"></div>
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-white font-bold tracking-widest uppercase">{roundInfo?.name}</span>
              <span className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-black">
                {currentStudent?.full_name} • {team?.team_name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Violation Counter */}
            {violationCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="material-symbols-outlined text-red-400 text-xs">warning</span>
                <span className="text-[9px] font-black text-red-400 uppercase">{violationCount}/{maxWarnings}</span>
              </div>
            )}

            {/* Timer */}
            <div className={`flex flex-col items-end px-4 md:px-6 border-r border-white/10 ${timeLeft < 300 ? 'animate-pulse' : ''}`}>
              <span className="text-[8px] text-white/30 uppercase font-black tracking-widest mb-0.5">Time Left</span>
              <span className={`text-lg md:text-xl font-mono font-bold tracking-tighter ${timeLeft < 300 ? 'text-red-500' : timeLeft < 600 ? 'text-amber-400' : 'text-brand'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Mobile palette toggle */}
            <button
              onClick={() => setShowPaletteOnMobile(!showPaletteOnMobile)}
              className="lg:hidden p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>

            {/* Submit */}
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="flex items-center gap-2 px-5 md:px-8 py-2.5 md:py-3 bg-brand/10 border border-brand/20 hover:bg-brand text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <span className="material-symbols-outlined text-sm hidden sm:inline">send</span>
              Submit
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT (SIDEBAR + QUESTION) ═══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ LEFT SIDEBAR: QUESTION PALETTE ═══ */}
        <aside className={`${showPaletteOnMobile ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 lg:w-64 xl:w-72 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 lg:shrink-0`}>

          {/* Palette Header */}
          <div className="p-4 md:p-5 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Question Palette</h3>
              <button
                onClick={() => setShowPaletteOnMobile(false)}
                className="lg:hidden text-white/30 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span className="text-emerald-400/70">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-white/10 border border-white/20"></div>
                <span className="text-white/30">Not Answered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span className="text-amber-400/70">Marked ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-brand ring-2 ring-brand/50"></div>
                <span className="text-brand/70">Current</span>
              </div>
            </div>
          </div>

          {/* Question Number Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const status = getQuestionStatus(q.id, i);
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIdx(i); setShowPaletteOnMobile(false); }}
                    className={`relative w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${status === 'current'
                      ? 'bg-brand text-white ring-2 ring-brand/50 shadow-[0_0_12px_rgba(var(--brand-rgb),0.3)]'
                      : status === 'answered'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : status === 'review'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-white/5 text-white/30 border border-white/10 hover:bg-white/10 hover:text-white/60'
                      }`}
                  >
                    {i + 1}
                    {status === 'review' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Footer Stats */}
          <div className="p-4 border-t border-white/10 shrink-0">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-3">
              <span className="text-white/30">Progress</span>
              <span className="text-brand">{answeredCount}/{questions.length}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </aside>

        {/* Mobile palette overlay */}
        {showPaletteOnMobile && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setShowPaletteOnMobile(false)}></div>
        )}

        {/* ═══ MAIN QUESTION AREA ═══ */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">

            {/* Question Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-brand/10 border-2 border-brand/20 flex items-center justify-center">
                  <span className="text-lg md:text-xl font-display font-bold text-brand">{currentIdx + 1}</span>
                </div>
                <div>
                  <h2 className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mb-0.5">
                    Question {currentIdx + 1} of {questions.length}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black text-brand/60 uppercase tracking-widest">
                      {currentQuestion.points || 1} {(currentQuestion.points || 1) > 1 ? 'Points' : 'Point'}
                    </span>
                    {markedForReview.has(currentQuestion.id) && (
                      <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[7px] font-black text-amber-400 uppercase tracking-widest">
                        Marked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mark for Review */}
              <button
                onClick={toggleMarkForReview}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${markedForReview.has(currentQuestion.id)
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  : 'bg-white/5 border border-white/10 text-white/30 hover:text-white/60'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {markedForReview.has(currentQuestion.id) ? 'bookmark_added' : 'bookmark_border'}
                </span>
                {markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
              </button>
            </div>

            {/* Question Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl mb-8 relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-brand/30 rounded-tl-[2rem]"></div>

              <div className="relative z-10">
                <p className="text-lg md:text-xl text-white leading-relaxed font-bold max-w-3xl">
                  {currentQuestion.question_text}
                </p>
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {['a', 'b', 'c', 'd'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  className={`flex items-center gap-4 md:gap-5 p-5 md:p-6 rounded-2xl border-2 transition-all text-left group shadow-lg ${answers[currentQuestion.id] === opt
                    ? 'bg-brand/15 border-brand shadow-[0_0_20px_rgba(var(--brand-rgb),0.15)]'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                    }`}
                >
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 uppercase transition-all ${answers[currentQuestion.id] === opt
                    ? 'bg-brand text-white shadow-[0_0_10px_rgba(var(--brand-rgb),0.3)]'
                    : 'bg-white/5 text-white/30 border border-white/10 group-hover:text-white/60 group-hover:border-white/20'
                    }`}>
                    {opt}
                  </div>
                  <span className={`text-sm md:text-base font-medium ${answers[currentQuestion.id] === opt
                    ? 'text-white'
                    : 'text-white/50 group-hover:text-white/80'
                    }`}>
                    {currentQuestion[`option_${opt}`]}
                  </span>
                </button>
              ))}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white border border-white/10 hover:border-white/25 transition-all disabled:opacity-0"
              >
                <span className="material-symbols-outlined text-sm">west</span>
                Previous
              </button>

              {/* Clear Response */}
              {answers[currentQuestion.id] && (
                <button
                  onClick={() => {
                    const qId = currentQuestion.id;
                    setAnswers(prev => {
                      const next = { ...prev };
                      delete next[qId];
                      return next;
                    });
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">backspace</span>
                  Clear
                </button>
              )}

              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-brand hover:shadow-glow-brand border border-brand rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                >
                  Submit
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-white/5 hover:bg-brand border border-white/10 hover:border-brand rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all group"
                >
                  Next
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">east</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ═══ BOTTOM STATUS BAR ═══ */}
      <footer className="w-full px-4 md:px-8 py-2.5 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
            <span className="hidden md:inline">Secure_Exam_Protocol</span>
            <span className="hidden md:inline w-1 h-1 bg-white/10 rounded-full"></span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Monitoring Active
            </span>
            <span className="hidden md:inline w-1 h-1 bg-white/10 rounded-full"></span>
            <span className="hidden md:inline">Violations: {violationCount}/{maxWarnings}</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
            <span className="hidden sm:inline">{answeredCount} Answered</span>
            <span className="hidden sm:inline w-1 h-1 bg-white/10 rounded-full"></span>
            <span>{unansweredCount} Remaining</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AptitudeRoundExam;
