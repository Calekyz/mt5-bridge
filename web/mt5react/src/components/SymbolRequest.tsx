import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Clock, Shield, CheckCircle2, AlertCircle,
    Info, Search, X, MessageCircle, Zap, History, Trash2,
    Sparkles, ArrowRight, Globe, Activity, Bitcoin, Pencil
} from 'lucide-react';
import { getSymbols } from '../api/nodejsApiClient';
import { toast } from 'react-toastify';

const WHATSAPP_NUMBER = '254116081230';
const STORAGE_KEY = 'symbolRequestsHistory';

// ═══════════════════════════════════════════════════════════
//  POPULAR SYMBOL CATEGORIES
// ═══════════════════════════════════════════════════════════

const POPULAR_FOREX = [
    // Majors
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
    // Minors
    'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
    'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',
    'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD',
    'NZDJPY', 'NZDCHF', 'NZDCAD',
    'CADJPY', 'CADCHF', 'CHFJPY',
    // Exotics
    'USDTRY', 'USDZAR', 'USDMXN', 'USDSGD', 'USDHKD', 'USDNOK', 'USDSEK',
    'EURTRY', 'EURZAR', 'EURMXN', 'EURSGD', 'EURNOK', 'EURSEK',
    'GBPTRY', 'GBPZAR',
    // Metals (usually traded alongside FX)
    'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD',
];

const POPULAR_SYNTHETICS = [
    // Volatility Indices (Deriv / similar)
    'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
    'V10', 'V25', 'V50', 'V75', 'V100',
    'VOLATILITY10', 'VOLATILITY25', 'VOLATILITY50', 'VOLATILITY75', 'VOLATILITY100',
    'VOLATILITY150', 'VOLATILITY200', 'VOLATILITY250',
    // Boom & Crash
    'BOOM300', 'BOOM500', 'BOOM1000',
    'CRASH300', 'CRASH500', 'CRASH1000',
    'BOOM300N', 'BOOM500N', 'BOOM1000N',
    'CRASH300N', 'CRASH500N', 'CRASH1000N',
    // Jump Indices
    'JD10', 'JD25', 'JD50', 'JD75', 'JD100',
    'JUMP10', 'JUMP25', 'JUMP50', 'JUMP75', 'JUMP100',
    // Step Index
    'STPIDX', 'STEPIDX', 'STEPINDEX',
    // Range Break
    'RANGEBREAK100', 'RANGEBREAK200',
    // Others (common synthetic names)
    'PAINX', 'VIX', 'VIX75', 'DRILL',
];

const POPULAR_CRYPTO = [
    'BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BCHUSD',
    'ADAUSD', 'SOLUSD', 'DOGEUSD', 'DOTUSD', 'LINKUSD',
    'MATICUSD', 'AVAXUSD', 'ATOMUSD', 'UNIUSD', 'XLMUSD',
    'TRXUSD', 'ETCUSD', 'FILUSD', 'NEARUSD', 'ALGOUSD',
    'BUSDUSD', 'SHIBUSD', 'APEUSD', 'MANAUSD', 'SANDUSD',
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
];

type TabId = 'forex' | 'synthetics' | 'crypto' | 'custom';

interface TabDef {
    id: TabId;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    list: string[];
}

const TAB_DEFS: TabDef[] = [
    {
        id: 'forex',
        label: 'Forex',
        description: 'Currencies & metals',
        icon: <Globe size={14} />,
        color: 'blue',
        list: POPULAR_FOREX,
    },
    {
        id: 'synthetics',
        label: 'Synthetics',
        description: 'Volatility, Boom, Crash, Jump',
        icon: <Activity size={14} />,
        color: 'violet',
        list: POPULAR_SYNTHETICS,
    },
    {
        id: 'crypto',
        label: 'Crypto',
        description: 'Bitcoin, Ethereum, altcoins',
        icon: <Bitcoin size={14} />,
        color: 'amber',
        list: POPULAR_CRYPTO,
    },
    {
        id: 'custom',
        label: 'Custom',
        description: 'Any other symbol',
        icon: <Pencil size={14} />,
        color: 'slate',
        list: [],
    },
];

interface SymbolRequestEntry {
    id: string;
    symbol: string;
    notes: string;
    requestedAt: string;
    email: string;
    wasAlreadyAvailable?: boolean;
    category?: TabId;
}

const SymbolRequest: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('forex');
    const [symbol, setSymbol] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [symbols, setSymbols] = useState<string[]>([]);
    const [loadingSymbols, setLoadingSymbols] = useState(true);
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

    // ─── Load existing symbols ─────────────────────────────
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

    // ─── Load history ──────────────────────────────────────
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

    // ─── Symbol matching (handles .m suffix variants) ──────
    const symbolsUpperSet = useMemo(
        () => new Set(symbols.map((s) => s.toUpperCase())),
        [symbols]
    );

    const isSymbolOnAccount = (sym: string): boolean => {
        const upper = sym.trim().toUpperCase();
        if (!upper) return false;
        if (symbolsUpperSet.has(upper)) return true;
        // Check for suffix variants like XAUUSD.m, EURUSD.pro
        for (const s of symbolsUpperSet) {
            if (s.startsWith(upper + '.')) return true;
        }
        return false;
    };

    const normalizedInput = symbol.trim().toUpperCase();
    const isAlreadyAvailable = normalizedInput.length > 0 && isSymbolOnAccount(normalizedInput);
    const isValid = normalizedInput.length >= 2;

    // ─── Current tab config ────────────────────────────────
    const currentTab = TAB_DEFS.find((t) => t.id === activeTab) || TAB_DEFS[0];

    // ─── Filter popular symbols in the active tab ──────────
    const filteredPopular = useMemo(() => {
        if (activeTab === 'custom') return [];
        const list = currentTab.list;
        if (!normalizedInput) return list;
        return list.filter((s) => s.toUpperCase().includes(normalizedInput));
    }, [activeTab, currentTab, normalizedInput]);

    // ─── Build WhatsApp link ───────────────────────────────
    const buildWhatsAppLink = (
        reqSymbol: string,
        reqNotes: string,
        alreadyAvailable: boolean,
        category: string
    ) => {
        const timestamp = new Date().toLocaleString('en-KE', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });

        const lines = [
            '🔔 *NEW SYMBOL REQUEST*',
            '',
            `*Symbol:* ${reqSymbol}`,
            `*Category:* ${category}`,
            alreadyAvailable
                ? '*Status:* ⚠️ Already available on my account'
                : '*Status:* 🆕 New symbol',
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

    // ─── Submit ────────────────────────────────────────────
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

        const categoryLabel =
            activeTab === 'custom' ? 'Custom' : currentTab.label;

        const link = buildWhatsAppLink(
            normalizedInput,
            notes.trim(),
            isAlreadyAvailable,
            categoryLabel
        );

        const entry: SymbolRequestEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            symbol: normalizedInput,
            notes: notes.trim(),
            requestedAt: new Date().toISOString(),
            email: userEmail,
            wasAlreadyAvailable: isAlreadyAvailable,
            category: activeTab,
        };
        saveHistory([entry, ...history].slice(0, 20));

        window.open(link, '_blank', 'noopener,noreferrer');

        toast.success('WhatsApp opened — press Send in the app to submit your request.');

        setTimeout(() => {
            setSymbol('');
            setNotes('');
            setSubmitting(false);
        }, 800);
    };

    const handleSymbolInputChange = (value: string) => {
        setSymbol(value.toUpperCase().replace(/\s+/g, ''));
    };

    const pickSymbol = (s: string) => {
        setSymbol(s.toUpperCase());
        // Bring focus to the notes field so user sees the selection took effect
        setTimeout(() => {
            const notesEl = document.getElementById('symbol-notes');
            notesEl?.focus();
        }, 50);
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

    // ─── Tab button styling ────────────────────────────────
    const getTabStyles = (tab: TabDef) => {
        const isActive = activeTab === tab.id;
        if (!isActive) {
            return 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/50';
        }
        const map: Record<string, string> = {
            blue:   'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border border-blue-400/40 shadow-lg shadow-blue-600/30',
            violet: 'bg-gradient-to-r from-violet-600 to-purple-700 text-white border border-violet-400/40 shadow-lg shadow-violet-600/30',
            amber:  'bg-gradient-to-r from-amber-500 to-orange-600 text-white border border-amber-400/40 shadow-lg shadow-amber-600/30',
            slate:  'bg-gradient-to-r from-slate-600 to-slate-700 text-white border border-slate-500/40 shadow-lg shadow-slate-600/30',
        };
        return map[tab.color] || map.slate;
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
                            Browse by category or request any custom symbol · Delivered via WhatsApp
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
                            Most symbols are added within <strong className="text-white">5–30 minutes</strong>. Complex or exotic symbols may take longer.
                        </div>
                    </div>
                </div>

                {/* ─── REQUEST CARD ───────────────────────────────── */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden"
                >
                    {/* ─── TABS ───────────────────────────────────── */}
                    <div className="p-4 border-b border-slate-700/40 bg-slate-900/40">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {TAB_DEFS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setSymbol('');
                                    }}
                                    disabled={!vpsAddress}
                                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${getTabStyles(
                                        tab
                                    )} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {tab.icon}
                                        {tab.label}
                                    </span>
                                    <span className="text-[9px] opacity-70 font-normal normal-case tracking-normal truncate max-w-full">
                                        {tab.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── FORM BODY ──────────────────────────────── */}
                    <div className="p-5 space-y-5">

                        {/* Symbol input */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <span>
                                    {activeTab === 'custom' ? 'Symbol Name *' : `Search ${currentTab.label} Symbols *`}
                                </span>
                                {loadingSymbols && (
                                    <span className="text-[10px] text-blue-400 animate-pulse normal-case">
                                        Checking availability...
                                    </span>
                                )}
                            </label>

                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => handleSymbolInputChange(e.target.value)}
                                    placeholder={
                                        activeTab === 'custom'
                                            ? 'e.g. US500, GER40, SPX500, anything'
                                            : `Filter ${currentTab.label.toLowerCase()} symbols...`
                                    }
                                    required
                                    minLength={2}
                                    maxLength={20}
                                    disabled={!vpsAddress}
                                    className={`w-full pl-11 pr-10 py-3 rounded-xl border bg-slate-900/60 text-white placeholder-slate-500 font-mono uppercase text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
                            </div>

                            {/* Already-available hint */}
                            {isAlreadyAvailable && (
                                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                        <strong>{normalizedInput}</strong> already exists on your account — but you can still send this request. Admin will contact you if further setup is needed.
                                    </span>
                                </div>
                            )}

                            {/* New-symbol hint */}
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
                                    {activeTab === 'custom'
                                        ? 'Type any trading symbol — indices, commodities, anything.'
                                        : `Click a ${currentTab.label.toLowerCase()} symbol below or type to filter.`}
                                </p>
                            )}
                        </div>

                        {/* Popular symbol grid */}
                        {activeTab !== 'custom' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase tracking-wider font-bold text-${currentTab.color}-300`}>
                                            Popular in {currentTab.label}
                                        </span>
                                        <span className="text-[10px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded font-mono">
                                            {filteredPopular.length}
                                        </span>
                                    </div>
                                    {normalizedInput && filteredPopular.length === 0 && (
                                        <span className="text-[10px] text-amber-400">
                                            No matches — you can still submit
                                        </span>
                                    )}
                                </div>

                                {filteredPopular.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                        {filteredPopular.map((s) => {
                                            const onAccount = isSymbolOnAccount(s);
                                            const isSelected = normalizedInput === s.toUpperCase();
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => pickSymbol(s)}
                                                    disabled={!vpsAddress}
                                                    title={onAccount ? 'Already on your account' : 'Request this symbol'}
                                                    className={`relative flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-mono font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        isSelected
                                                            ? 'bg-emerald-500/25 text-emerald-200 border-2 border-emerald-500/60 scale-105 shadow-lg shadow-emerald-600/30'
                                                            : onAccount
                                                                ? 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-500/60 hover:scale-105'
                                                                : 'bg-slate-900/60 text-slate-400 border border-slate-700/40 hover:bg-slate-800/80 hover:border-violet-500/50 hover:text-white hover:scale-105'
                                                    }`}
                                                >
                                                    {onAccount && (
                                                        <CheckCircle2
                                                            size={9}
                                                            className={isSelected ? 'text-emerald-300' : 'text-emerald-500/70'}
                                                        />
                                                    )}
                                                    <span className="truncate">{s}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Legend */}
                                <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 size={10} className="text-emerald-500/70" />
                                        On your account
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-sm bg-slate-900/60 border border-slate-700/40" />
                                        Requestable
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/25 border border-emerald-500/60" />
                                        Selected
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Custom tab empty-state hint */}
                        {activeTab === 'custom' && (
                            <div className="bg-violet-900/15 border border-violet-500/30 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-1.5 bg-violet-500/20 rounded-lg border border-violet-500/40 flex-shrink-0">
                                    <Pencil size={14} className="text-violet-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-violet-200 uppercase tracking-wider mb-1">
                                        Custom Symbol
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Type any symbol — indices like <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-300 font-mono">US500</code>, commodities like <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-300 font-mono">COCOA</code>, or anything your broker offers. Admin will add it to your EA.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Notes <span className="text-slate-600 normal-case tracking-normal">(optional)</span>
                            </label>
                            <textarea
                                id="symbol-notes"
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

                        {/* Submit */}
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
                    </div>
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
                                            {entry.category && (
                                                <span className="text-[9px] bg-slate-700/60 text-slate-300 border border-slate-600/40 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    {entry.category}
                                                </span>
                                            )}
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
