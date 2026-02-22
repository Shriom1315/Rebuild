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

    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result;
            const lines = content.split('\n');
            const newQuestions = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length >= 6) {
                    newQuestions.push({
                        round_id: selectedRoundId,
                        question_text: cols[0],
                        option_a: cols[1],
                        option_b: cols[2],
                        option_c: cols[3],
                        option_d: cols[4],
                        correct_answer: cols[5].toLowerCase(),
                        points: parseInt(cols[6]) || 1,
                        question_order: questions.length + i
                    });
                }
            }

            if (newQuestions.length > 0) {
                setActionLoading(true);
                try {
                    const { error } = await supabase.from('questions').insert(newQuestions);
                    if (error) throw error;
                    showToast(`Imported ${newQuestions.length} questions`);
                    fetchQuestions(selectedRoundId);
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        };
        reader.readAsText(file);
        e.target.value = '';
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
                    <Link to="/admin/teams" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-base">groups</span>
                        Teams
                    </Link>
                    <div className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand text-white shadow-glow-brand ring-1 ring-white/10">
                        <span className="material-symbols-outlined text-base">quiz</span>
                        Questions
                    </div>
                    <Link to="/admin/lobby" className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-base">monitor_heart</span>
                        Live Lobby
                    </Link>
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
                                href="/questions_template.csv" download
                                className="flex items-center gap-3 px-6 py-3 bg-white/5 border-2 border-white/10 hover:border-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Template
                            </a>

                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="flex items-center gap-3 px-6 py-3 bg-white/5 border-2 border-white/10 hover:border-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">upload_file</span>
                                Upload CSV
                                <input type="file" ref={fileInputRef} onChange={handleCsvUpload} accept=".csv" className="hidden" />
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

                    {/* CSV TEMPLATE INSTRUCTIONS */}
                    <div className="p-8 border-2 border-dashed border-white/10 rounded-[2.5rem] opacity-30">
                        <div className="flex items-start gap-6">
                            <span className="material-symbols-outlined text-brand text-xl">info</span>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-2">CSV Formatting Protocol</h4>
                                <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                                    Format: <b>text, a, b, c, d, correct_key (a/b/c/d), points</b>.
                                    Wrap strings containing commas in double quotes.
                                </p>
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
