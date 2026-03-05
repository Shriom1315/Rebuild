import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { ShaderAnimation } from '../components/ui/shader-animation';

const AdminQuestionManagement = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const fileInputRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [rounds, setRounds] = useState([]);
    const [selectedRoundId, setSelectedRoundId] = useState('');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Manual form state
    const [showManualForm, setShowManualForm] = useState(false);
    const [formData, setFormData] = useState({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'a',
        points: 1,
        question_order: 0
    });

    useEffect(() => {
        fetchRounds();
    }, []);

    useEffect(() => {
        if (selectedRoundId) {
            fetchQuestions(selectedRoundId);
        } else {
            setQuestions([]);
        }
    }, [selectedRoundId]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchRounds = async () => {
        try {
            const { data, error } = await supabase
                .from('rounds')
                .select('*')
                .order('round_number', { ascending: true });
            if (error) throw error;
            setRounds(data || []);
            if (data && data.length > 0) setSelectedRoundId(data[0].id);
        } catch (error) {
            console.error('Error fetching rounds:', error);
        }
    };

    const fetchQuestions = async (roundId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('round_id', roundId)
                .order('question_order', { ascending: true });
            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRoundId) return showToast('Please select a round first', 'error');

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('questions')
                .insert([{ ...formData, round_id: selectedRoundId }]);

            if (error) throw error;
            showToast('Question added successfully');
            setShowManualForm(false);
            setFormData({
                question_text: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                correct_answer: 'a',
                points: 1,
                question_order: questions.length + 1
            });
            fetchQuestions(selectedRoundId);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if (error) throw error;
            showToast('Question deleted');
            fetchQuestions(selectedRoundId);
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // Enhanced CSV parser that handles quotes and commas properly
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote mode
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add last field
        result.push(current.trim());
        return result;
    };

    // Validate question data
    const validateQuestion = (q, rowNum) => {
        const errors = [];
        
        if (!q.question_text?.trim()) {
            errors.push(`Row ${rowNum}: Question text is required`);
        }
        
        ['a', 'b', 'c', 'd'].forEach(opt => {
            if (!q[`option_${opt}`]?.trim()) {
                errors.push(`Row ${rowNum}: Option ${opt.toUpperCase()} is required`);
            }
        });
        
        if (!['a', 'b', 'c', 'd'].includes(q.correct_answer?.toLowerCase())) {
            errors.push(`Row ${rowNum}: Correct answer must be a, b, c, or d (got: ${q.correct_answer})`);
        }
        
        const points = parseInt(q.points);
        if (isNaN(points) || points < 1) {
            errors.push(`Row ${rowNum}: Points must be a positive number (got: ${q.points})`);
        }
        
        return errors;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!selectedRoundId) {
            showToast('Please select a round first', 'error');
            e.target.value = '';
            return;
        }

        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (fileExt === 'json') {
            handleJsonUpload(file);
        } else if (fileExt === 'csv') {
            handleCsvUpload(file);
        } else {
            showToast('Please upload a CSV or JSON file', 'error');
        }
        
        e.target.value = '';
    };

    const handleJsonUpload = (file) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!Array.isArray(data)) {
                    throw new Error('JSON must be an array of questions');
                }
                
                const newQuestions = [];
                const allErrors = [];
                
                data.forEach((item, idx) => {
                    const rowNum = idx + 2; // +2 because row 1 is header
                    const errors = validateQuestion(item, rowNum);
                    
                    if (errors.length > 0) {
                        allErrors.push(...errors);
                    } else {
                        newQuestions.push({
                            round_id: selectedRoundId,
                            question_text: item.question_text.trim(),
                            option_a: item.option_a.trim(),
                            option_b: item.option_b.trim(),
                            option_c: item.option_c.trim(),
                            option_d: item.option_d.trim(),
                            correct_answer: item.correct_answer.toLowerCase(),
                            points: parseInt(item.points) || 1,
                            question_order: questions.length + idx + 1
                        });
                    }
                });
                
                if (allErrors.length > 0) {
                    const errorMsg = `Validation errors:\n${allErrors.slice(0, 5).join('\n')}${allErrors.length > 5 ? `\n...and ${allErrors.length - 5} more errors` : ''}`;
                    showToast(errorMsg, 'error');
                    console.error('All validation errors:', allErrors);
                    return;
                }
                
                if (newQuestions.length > 0) {
                    await saveQuestions(newQuestions);
                } else {
                    showToast('No valid questions found in file', 'error');
                }
                
            } catch (error) {
                showToast(`JSON parsing error: ${error.message}`, 'error');
                console.error('JSON upload error:', error);
            }
        };
        reader.readAsText(file);
    };

    const handleCsvUpload = (file) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                const lines = content.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    throw new Error('CSV file must have at least a header row and one data row');
                }
                
                const newQuestions = [];
                const allErrors = [];
                
                // Skip header row (index 0)
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const cols = parseCSVLine(line);
                    const rowNum = i + 1;
                    
                    if (cols.length < 7) {
                        allErrors.push(`Row ${rowNum}: Expected 7 columns, got ${cols.length}`);
                        continue;
                    }
                    
                    const questionData = {
                        question_text: cols[0],
                        option_a: cols[1],
                        option_b: cols[2],
                        option_c: cols[3],
                        option_d: cols[4],
                        correct_answer: cols[5],
                        points: cols[6]
                    };
                    
                    const errors = validateQuestion(questionData, rowNum);
                    
                    if (errors.length > 0) {
                        allErrors.push(...errors);
                    } else {
                        newQuestions.push({
                            round_id: selectedRoundId,
                            question_text: questionData.question_text.trim(),
                            option_a: questionData.option_a.trim(),
                            option_b: questionData.option_b.trim(),
                            option_c: questionData.option_c.trim(),
                            option_d: questionData.option_d.trim(),
                            correct_answer: questionData.correct_answer.toLowerCase(),
                            points: parseInt(questionData.points) || 1,
                            question_order: questions.length + newQuestions.length + 1
                        });
                    }
                }
                
                if (allErrors.length > 0) {
                    const errorMsg = `Validation errors:\n${allErrors.slice(0, 5).join('\n')}${allErrors.length > 5 ? `\n...and ${allErrors.length - 5} more errors` : ''}`;
                    showToast(errorMsg, 'error');
                    console.error('All validation errors:', allErrors);
                    return;
                }
                
                if (newQuestions.length > 0) {
                    await saveQuestions(newQuestions);
                } else {
                    showToast('No valid questions found in CSV', 'error');
                }
                
            } catch (error) {
                showToast(`CSV parsing error: ${error.message}`, 'error');
                console.error('CSV upload error:', error);
            }
        };
        reader.readAsText(file);
    };

    const saveQuestions = async (newQuestions) => {
        setActionLoading(true);
        try {
            const { error } = await supabase.from('questions').insert(newQuestions);
            if (error) throw error;
            showToast(`✅ Successfully imported ${newQuestions.length} questions!`);
            fetchQuestions(selectedRoundId);
        } catch (error) {
            showToast(`Database error: ${error.message}`, 'error');
            console.error('Save error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-brand/30">

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

            {/* Sidebar - Redesigned for Consistency */}
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
                            <span className="material-symbols-outlined text-base">quiz</span>
                            Questions
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

                {/* Mobile Nav Toggle */}
                <div className="lg:hidden sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 p-5 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="text-white">
                        <span className="material-symbols-outlined">menu_open</span>
                    </button>
                    <span className="font-display text-base text-white uppercase tracking-[0.2em]">REBUILD HQ</span>
                    <div className="w-6"></div>
                </div>

                <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/[0.04] border-2 border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                        <div className="flex-1">
                            <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wider mb-2 leading-tight">Question Bank</h2>
                            <p className="text-xs text-white/60 font-medium tracking-wide max-w-xl">Configure assessment protocols for simulation rounds.</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="relative">
                                <select
                                    value={selectedRoundId}
                                    onChange={(e) => setSelectedRoundId(e.target.value)}
                                    className="bg-white/5 border-2 border-white/10 rounded-xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest focus:border-brand outline-none transition-all appearance-none pr-10 min-w-[180px]"
                                >
                                    <option value="" disabled className="bg-[#0a0a0a]">Select Round</option>
                                    {rounds.map(r => (
                                        <option key={r.id} value={r.id} className="bg-[#0a0a0a]">Phase {r.round_number}: {r.name}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-sm">expand_more</span>
                            </div>

                            <a
                                href={`${process.env.PUBLIC_URL}/questions_template.csv`} download="questions_template.csv"
                                className="flex items-center gap-3 px-6 py-3 bg-white/5 border-2 border-white/10 hover:border-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                CSV Template
                            </a>

                            <a
                                href={`${process.env.PUBLIC_URL}/questions_template.json`} download="questions_template.json"
                                className="flex items-center gap-3 px-6 py-3 bg-white/5 border-2 border-white/10 hover:border-emerald-500/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                JSON Template
                            </a>

                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="flex items-center gap-3 px-6 py-3 bg-white/5 border-2 border-white/10 hover:border-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">upload_file</span>
                                Upload File
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.json" className="hidden" />
                            </button>

                            <button
                                onClick={() => setShowManualForm(true)}
                                className="flex items-center gap-2 px-6 py-3.5 bg-brand text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-glow-brand transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Create Manual
                            </button>
                        </div>
                    </div>

                    {/* Questions Table Style */}
                    <div className="bg-white/[0.02] border-2 border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-12 px-8 py-5 bg-white/5 border-b-2 border-white/10 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                            <div className="col-span-1">TAG</div>
                            <div className="col-span-6">CONTENT_STREAM</div>
                            <div className="col-span-2 text-center">ACCESS_KEY</div>
                            <div className="col-span-1 text-center">PTS</div>
                            <div className="col-span-2 text-right">ACTION</div>
                        </div>

                        {loading ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4 opacity-30">
                                <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest">Accessing mainframes...</span>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="p-24 text-center flex flex-col items-center gap-6 opacity-20">
                                <span className="material-symbols-outlined text-6xl">database_off</span>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Protocol Data Found</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y-2 divide-white/5">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="grid grid-cols-12 px-8 py-6 items-center hover:bg-white/[0.03] transition-colors group">
                                        <div className="col-span-1 font-mono text-[10px] text-brand font-black">#{idx + 1}</div>
                                        <div className="col-span-6 pr-8">
                                            <p className="text-sm font-bold text-white/80 line-clamp-1">{q.question_text}</p>
                                            <div className="flex gap-4 mt-2 opacity-30 text-[8px] font-black uppercase tracking-widest">
                                                <span>A: {q.option_a?.slice(0, 15)}...</span>
                                                <span className="w-1 h-1 bg-white/40 rounded-full my-auto"></span>
                                                <span>B: {q.option_b?.slice(0, 15)}...</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className="px-5 py-1.5 bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                KEY_{q.correct_answer.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="col-span-1 text-center font-display text-sm font-bold text-white/40">
                                            {q.points}
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <button
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* FILE FORMAT INSTRUCTIONS */}
                    <div className="p-8 border-2 border-dashed border-white/10 rounded-[2.5rem] opacity-30">
                        <div className="flex items-start gap-6">
                            <span className="material-symbols-outlined text-brand text-xl">info</span>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-2">CSV Format</h4>
                                    <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                                        <b>Header:</b> question_text,option_a,option_b,option_c,option_d,correct_answer,points<br/>
                                        <b>Example:</b> "What is 2+2?","3","4","5","6","b","1"<br/>
                                        <b>Important:</b> Wrap all text in double quotes to handle commas properly
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-2">JSON Format (Recommended)</h4>
                                    <p className="text-[10px] text-white/60 leading-relaxed font-medium font-mono">
                                        [&#123;"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"b","points":1&#125;]
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest">
                                        ✓ Validation checks all data before saving
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <footer className="mt-10 py-10 border-t border-white/10 flex items-center justify-center opacity-30">
                    <div className="flex items-center gap-6 text-[8px] font-black uppercase tracking-[0.4em]">
                        <span>DKTE COMMAND</span>
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        <span>QUESTION_GENERA_V1</span>
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        <span>2026_TAC_MOD</span>
                    </div>
                </footer>
            </main>

            {/* Manual Entry Modal - Fixed Scrolling and Redesigned */}
            {showManualForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-[#0a0a0a] border-2 border-white/20 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="px-10 py-8 border-b-2 border-white/10 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-display uppercase tracking-widest text-white">Establish Protocol</h3>
                            <button onClick={() => setShowManualForm(false)} className="text-white/20 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <form id="question-form" onSubmit={handleManualSubmit} className="space-y-10 pb-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Protocol Narrative</label>
                                    <textarea
                                        required
                                        value={formData.question_text}
                                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-6 text-sm font-bold text-white placeholder-white/10 focus:border-brand outline-none transition-all min-h-[140px] resize-none"
                                        placeholder="Describe the logic challenge..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['a', 'b', 'c', 'd'].map(opt => (
                                        <div key={opt} className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Response Node {opt.toUpperCase()}</label>
                                            <input
                                                type="text" required
                                                value={formData[`option_${opt}`]}
                                                onChange={(e) => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                                                className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white placeholder-white/10 focus:border-brand outline-none transition-all"
                                                placeholder={`Option ${opt.toUpperCase()} value...`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Primary Logic Key</label>
                                        <div className="relative">
                                            <select
                                                value={formData.correct_answer}
                                                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                                                className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-brand transition-all appearance-none"
                                            >
                                                <option value="a" className="bg-[#0a0a0a]">KEY_ALPHA</option>
                                                <option value="b" className="bg-[#0a0a0a]">KEY_BETA</option>
                                                <option value="c" className="bg-[#0a0a0a]">KEY_GAMMA</option>
                                                <option value="d" className="bg-[#0a0a0a]">KEY_DELTA</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-sm">expand_more</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Efficiency Credits (Points)</label>
                                        <input
                                            type="number" required
                                            value={formData.points}
                                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                            className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-brand transition-all"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-10 border-t-2 border-white/10 bg-[#0a0a0a]/50 shrink-0 flex gap-6">
                            <button
                                type="button"
                                onClick={() => setShowManualForm(false)}
                                className="flex-1 py-4 bg-white/5 border-2 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 transition-all rounded-xl"
                            >
                                ABORT
                            </button>
                            <button
                                type="submit"
                                form="question-form"
                                disabled={actionLoading}
                                className="flex-1 py-4 bg-brand hover:shadow-glow-brand text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all rounded-xl disabled:opacity-50"
                            >
                                {actionLoading ? 'INITIALIZING...' : 'COMMIT_PROTOCOL'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminQuestionManagement;
