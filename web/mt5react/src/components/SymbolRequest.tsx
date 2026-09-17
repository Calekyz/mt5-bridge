import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Clock, Shield, CheckCircle2, AlertCircle,
    Info, Search, X, MessageCircle, Zap, History, Trash2,
    Sparkles, ArrowRight
} from 'lucide-react';
import { getSymbols } from '../api/nodejsApiClient';
import { toast } from 'react-toastify';

const WHATSAPP_NUMBER = '254116081230';

interface SymbolRequestEntry {
    id: string;
    symbol: string;
    notes: string;
    requestedAt: string;
    email: string;
    wasAlreadyAvailable?: boolean;
}

const STORAGE_KEY = 'symbolRequestsHistory';

const SymbolRequest: React.FC = () => {
    const [symbol, setSymbol] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [symbols, setSymbols] = useState<string[]>([]);
    const [loadingSymbols, setLoadingSymbols] = useState(true);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [history, setHistory] = useState<SymbolRequestEntry[]>([]);

    // ─── Load user context ─────────────────────────────────
    const userStr = localStorage.getItem('user');
    let user: any = null;
    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch { /* ignore */ }

    const vpsAddress = user?.vps_address;
    const userEmail = user?.email || 'unknown';
    const accessKey = localStorage.getItem('accessKey') || '';

    // ─── Load existing symbols for duplicate detection ─────
    useEffect(() => {
        if (!vpsAddress) return;
        const loadSymbols = async () => {
            try {
                const data = await getSymbols();
                setSymbols(data || []);
            } catch (err) {
                console.error('Failed to load symbols:', err);
            } finally {
                setLoadingSymbols(false);
            }
        };
        loadSymbols();
    }, [vpsAddress]);

    // ─── Load request history ──────────────────────────────
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setHistory(parsed);
            }
        } catch { /* ignore */ }
    }, []);

    const saveHistory = (entries: SymbolRequestEntry[]) => {
        setHistory(entries);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch { /* ignore */ }
    };

    // ─── Symbol state ──────────────────────────────────────
    const normalizedInput = symbol.trim().toUpperCase();
    const symbolsUpperSet = useMemo(
        () => new Set(symbols.map((s) => s.toUpperCase())),
        [symbols]
    );
    // Informational only — no longer blocks submission
    const isAlreadyAvailable = normalizedInput.length > 0 && symbolsUpperSet.has(normalizedInput);
    const isValid = normalizedInput.length >= 2;

    // ─── Filter suggestions ────────────────────────────────
    const filteredSymbols = useMemo(() => {
        if (!normalizedInput) return [];
        return symbols
            .filter((s) => s.toUpperCase().includes(normalizedInput))
            .slice(0, 8);
    }, [normalizedInput, symbols]);

    // ─── Build WhatsApp link ───────────────────────────────
    const buildWhatsAppLink = (
        reqSymbol: string,
        reqNotes: string,
        alreadyAvailable: boolean
    ) => {
        const timestamp = new Date().toLocaleString('en-KE', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });

        const lines = [
            '🔔 *NEW SYMBOL REQUEST*',
            '',
            `*Symbol:* ${reqSymbol}`,
            alreadyAvailable ? '*Status:* ⚠️ Already available on my account' : '*Status:* 🆕 New symbol',
            `*Email:* ${userEmail}`,
            accessKey ? `*Access Key:* ${accessKey}` : '',
            vpsAddress ? `*VPS:* ${vpsAddress}` : '',
            reqNotes ? `*Notes:* ${reqNotes}` : '',
            '',
            `*Requested at:* ${timestamp}`,
            '',
            alreadyAvailable
                ? 'I know this symbol is available — I still need help with it. Please advise.'
                : 'Please add this symbol to my EA. Thank you!',
        ].filter(Boolean);

        const message = lines.join('\n');
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    // ─── Submit — ALWAYS allowed for any symbol ────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!vpsAddress) {
            toast.error('EA not configured. Contact admin first.');
            return;
        }

        if (normalizedInput.length < 2) {
            toast.error('Symbol must be at least 2 characters.');
            return;
        }

        setSubmitting(true);

        // Build WhatsApp link and open it
        const link = buildWhatsAppLink(normalizedInput, notes.trim(), isAlreadyAvailable);

        // Save to history
        const entry: SymbolRequestEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            symbol: normalizedInput,
            notes: notes.trim(),
            requestedAt: new Date().toISOString(),
            email: userEmail,
            wasAlreadyAvailable: isAlreadyAvailable,
        };
        saveHistory([entry, ...history].slice(0, 20));

        // Open WhatsApp
        window.open(link, '_blank', 'noopener,noreferrer');

        toast.success('WhatsApp opened — press Send in the app to submit your request.');

        // Reset after a delay so user sees the confirmation
        setTimeout(() => {
            setSymbol('');
            setNotes('');
            setSubmitting(false);
        }, 800);
    };

    const handleSymbolInputChange = (value: string) => {
        // Force uppercase, remove spaces
        setSymbol(value.toUpperCase().replace(/\s+/g, ''));
        setShowSuggestions(true);
    };

    const pickSuggestion = (s: string) => {
        setSymbol(s.toUpperCase());
        setShowSuggestions(false);
    };

    const clearHistory = () => {
        if (!window.confirm('Clear all your symbol request history?')) return;
        saveHistory([]);
        toast.success('History cleared');
    };

    const removeHistoryEntry = (id: string) => {
        saveHistory(history.filter((h) => h.id !== id));
    };

    const formatRelativeTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl shadow-lg shadow-purple-600/20">
                        <Plus className="text-white" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-violet-100 to-purple-200 bg-clip-text text-transparent">
                            Request a Symbol
                        </h1>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Add any trading symbol to your EA · Delivered via WhatsApp
                        </p>
                    </div>
                </div>

                {/* ─── EA Not Configured Warning ──────────────────── */}
                {!vpsAddress && (
                    <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="text-amber-200 font-bold text-sm uppercase tracking-wider">
                                EA Not Configured
                            </div>
                            <div className="text-xs text-amber-300/80 mt-1">
                                Your account isn't fully activated yet. Contact admin first to configure your VPS, then come back to request symbols.
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── HOW IT WORKS ───────────────────────────────── */}
                <div className="bg-gradient-to-br from-violet-900/20 via-slate-900/60 to-purple-900/20 backdrop-blur rounded-2xl border border-violet-500/30 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-violet-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            How it works
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            {
                                step: '1',
                                title: 'Request',
                                desc: 'Type any symbol (e.g. BTCUSD, XAUUSD, US30)',
                                icon: <Search size={14} className="text-blue-400" />,
                                bg: 'from-blue-500/15 to-blue-600/10',
                                border: 'border-blue-500/30',
                            },
                            {
                                step: '2',
                                title: 'WhatsApp',
                                desc: 'Your request opens WhatsApp with all details ready to send',
                                icon: <MessageCircle size={14} className="text-emerald-400" />,
                                bg: 'from-emerald-500/15 to-emerald-600/10',
                                border: 'border-emerald-500/30',
                            },
                            {
                                step: '3',
                                title: 'Activation',
                                desc: 'Admin adds your symbol — usually within 5–30 minutes',
                                icon: <Zap size={14} className="text-amber-400" />,
                                bg: 'from-amber-500/15 to-amber-600/10',
                                border: 'border-amber-500/30',
                            },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-xl p-4 relative`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-900/60 border border-slate-700/50 flex items-center justify-center text-[10px] font-bold text-white">
                                        {s.step}
                                    </div>
                                    {s.icon}
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        {s.title}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    {s.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── ETA STRIP ──────────────────────────────────── */}
                <div className="bg-gradient-to-r from-emerald-900/30 via-slate-900/60 to-emerald-900/20 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex-shrink-0">
                        <Clock size={18} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-emerald-200 font-bold text-sm uppercase tracking-wider">
                            Activation Time
                        </div>
                        <div className="text-xs text-emerald-300/80 mt-0.5">
                            Most symbols are added within <strong className="text-white">5–30 minutes</strong> during active hours. Complex or exotic symbols may take longer.
                        </div>
                    </div>
                </div>

                {/* ─── REQUEST FORM ───────────────────────────────── */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-5 space-y-5"
                >
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg">
                            <Plus size={14} className="text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Symbol Request
                        </h3>
                    </div>

                    {/* Symbol input */}
                    <div className="space-y-2 relative">
                        <label className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <span>Symbol Name *</span>
                            {loadingSymbols && (
                                <span className="text-[10px] text-blue-400 animate-pulse normal-case">
                                    Checking availability...
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => handleSymbolInputChange(e.target.value)}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="e.g. BTCUSD, US30, XAUUSD, NAS100"
                                required
                                minLength={2}
                                maxLength={20}
                                disabled={!vpsAddress}
                                className={`w-full px-4 py-3 rounded-xl border bg-slate-900/60 text-white placeholder-slate-500 font-mono uppercase text-sm transition-all pr-10 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isAlreadyAvailable
                                        ? 'border-amber-500/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                                        : normalizedInput.length >= 2
                                            ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                                            : 'border-slate-600/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30'
                                }`}
                            />
                            {symbol && (
                                <button
                                    type="button"
                                    onClick={() => setSymbol('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            {showSuggestions && filteredSymbols.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700/60 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                                    <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-700/40">
                                        Matches on your account (info only)
                                    </div>
                                    {filteredSymbols.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => pickSuggestion(s)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-slate-700/60 text-slate-300 text-sm font-mono transition-colors flex items-center gap-2 border-b border-slate-700/30 last:border-0"
                                        >
                                            <CheckCircle2 className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                            <span className="flex-1">{s}</span>
                                            <span className="text-[9px] text-slate-500 uppercase">
                                                exists
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Already-available hint — informational only, still requestable */}
                        {isAlreadyAvailable && (
                            <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                                <Info size={14} className="flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong>{normalizedInput}</strong> already exists on your account — but you can still send this request. Admin will contact you if further setup is needed.
                                </span>
                            </div>
                        )}

                        {/* Valid hint — new symbol */}
                        {!isAlreadyAvailable && normalizedInput.length >= 2 && (
                            <div className="flex items-start gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
                                <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong>{normalizedInput}</strong> will be requested from admin.
                                </span>
                            </div>
                        )}

                        {/* Info hint */}
                        {normalizedInput.length < 2 && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                <Info size={10} />
                                Type any trading symbol — forex, metals, indices, crypto, anything.
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Notes <span className="text-slate-600 normal-case tracking-normal">(optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any details to help admin? e.g. preferred timeframe, urgency, reason..."
                            maxLength={200}
                            rows={3}
                            disabled={!vpsAddress}
                            className="w-full px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-[10px] text-slate-500">
                            {notes.length}/200 characters
                        </p>
                    </div>

                    {/* Submit — ENABLED for any valid symbol */}
                    <button
                        type="submit"
                        disabled={!isValid || submitting || !vpsAddress}
                        className={`w-full font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 ${
                            isValid && !submitting && vpsAddress
                                ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-xl shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99]'
                                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-700/40'
                        }`}
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Opening WhatsApp...
                            </>
                        ) : (
                            <>
                                <MessageCircle size={20} />
                                Send Request via WhatsApp
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {!vpsAddress && (
                        <p className="text-xs text-amber-400 text-center">
                            Configure your EA first before requesting symbols.
                        </p>
                    )}
                </form>

                {/* ─── WHAT HAPPENS NEXT ──────────────────────────── */}
                <div className="bg-slate-900/40 border border-slate-700/40 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-blue-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            What happens next
                        </h3>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400 flex-shrink-0">✓</span>
                            <span>WhatsApp opens with your request pre-filled. <strong className="text-white">Tap Send</strong> to submit.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400 flex-shrink-0">✓</span>
                            <span>Admin receives it instantly and adds the symbol to your MT5 account.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400 flex-shrink-0">✓</span>
                            <span>You'll receive a WhatsApp confirmation when it's ready (5–30 min).</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400 flex-shrink-0">✓</span>
                            <span>The symbol then appears in your Chart page and Trade page symbol dropdown.</span>
                        </li>
                    </ul>
                </div>

                {/* ─── REQUEST HISTORY ────────────────────────────── */}
                {history.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-700/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History size={14} className="text-violet-400" />
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Your Recent Requests
                                </h3>
                                <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                                    {history.length}
                                </span>
                            </div>
                            <button
                                onClick={clearHistory}
                                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-lg font-semibold transition"
                            >
                                <Trash2 size={11} />
                                Clear all
                            </button>
                        </div>
                        <div className="divide-y divide-slate-700/40">
                            {history.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="px-5 py-3 flex items-center gap-3 hover:bg-slate-800/40 transition"
                                >
                                    <div className={`p-2 rounded-lg flex-shrink-0 border ${
                                        entry.wasAlreadyAvailable
                                            ? 'bg-amber-500/15 border-amber-500/30'
                                            : 'bg-violet-500/15 border-violet-500/30'
                                    }`}>
                                        <Sparkles size={12} className={
                                            entry.wasAlreadyAvailable ? 'text-amber-400' : 'text-violet-400'
                                        } />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono font-bold text-white text-sm">
                                                {entry.symbol}
                                            </span>
                                            {entry.wasAlreadyAvailable && (
                                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Existed
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-500">
                                                · {formatRelativeTime(entry.requestedAt)}
                                            </span>
                                        </div>
                                        {entry.notes && (
                                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                                {entry.notes}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeHistoryEntry(entry.id)}
                                        className="p-1.5 text-slate-500 hover:text-rose-400 transition flex-shrink-0"
                                        title="Remove from history"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 py-2.5 bg-slate-900/40 border-t border-slate-700/40 text-[10px] text-slate-500 flex items-center gap-2">
                            <Info size={10} />
                            History is stored locally on this device only
                        </div>
                    </div>
                )}

                {/* ─── SUPPORT FOOTER ─────────────────────────────── */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-2">
                    <MessageCircle size={10} className="text-emerald-400" />
                    <span>Questions? Message admin directly on WhatsApp</span>
                </div>
            </div>
        </div>
    );
};

export default SymbolRequest;
