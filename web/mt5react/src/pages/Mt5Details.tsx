import React, { useState, useEffect, useCallback } from 'react';
import {
    Key, Server, Save, RefreshCw, AlertCircle, CheckCircle2,
    Eye, EyeOff, Lock, Info, MessageCircle, BarChart3, Pencil, X,
    Crown, Sparkles, Zap, TrendingUp, Shield, ArrowRight, Star, Rocket,
} from 'lucide-react';
import { toast } from 'react-toastify';

const WHATSAPP_NUMBER = '254116081230';
const WHATSAPP_MESSAGE = encodeURIComponent(
    'Hello! I want lifetime premium access to PipTrader AI for $150. Please tell me how to get started.'
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const WHATSAPP_SUPPORT_MESSAGE = encodeURIComponent(
    'Hello! I need to update or remove my MT5 details on PipTrader AI.'
);
const WHATSAPP_SUPPORT_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_SUPPORT_MESSAGE}`;

const PREMIUM_PRICE = '$150';
const PREMIUM_ORIGINAL = '$400';

interface Mt5Details {
    id: number;
    label: string | null;
    mt5_login: string;
    mt5_password: string;
    mt5_server: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface ChartSymbol {
    symbol: string;
    chart_id?: number;
    period?: string;
}

export const Mt5DetailsPage: React.FC = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';
    const token = localStorage.getItem('token');

    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<Mt5Details | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [form, setForm] = useState({
        label: '',
        mt5_login: '',
        mt5_password: '',
        mt5_server: '',
        notes: '',
    });

    const [symbols, setSymbols] = useState<ChartSymbol[]>([]);
    const [symbolsLoading, setSymbolsLoading] = useState(false);
    const [symbolsError, setSymbolsError] = useState<string | null>(null);
    const [symbolsFetchedAt, setSymbolsFetchedAt] = useState<Date | null>(null);
    const [vpsAddress, setVpsAddress] = useState<string | null>(null);

    // ─── Premium badge rotation state ──────────────────────
    // Two phases: 'text' (shows "Premium Available") and 'advert' (shows mini ad).
    // Text: 2s → slide out → Advert: 5s → slide out → Text. Loops forever.
    const [badgeMode, setBadgeMode] = useState<'text' | 'advert'>('text');
    const [badgeHidden, setBadgeHidden] = useState(false);

    useEffect(() => {
        const SLIDE_MS = 400;      // time for slide out/in
        const TEXT_MS = 2000;      // how long text stays visible
        const ADVERT_MS = 5000;    // how long advert stays visible

        let t1: ReturnType<typeof setTimeout>;
        let t2: ReturnType<typeof setTimeout>;

        if (badgeMode === 'text') {
            // Show text for TEXT_MS, then slide out
            t1 = setTimeout(() => {
                setBadgeHidden(true);                       // slide out
                t2 = setTimeout(() => {
                    setBadgeMode('advert');
                    setBadgeHidden(false);                  // slide in
                }, SLIDE_MS);
            }, TEXT_MS);
        } else {
            // Show advert for ADVERT_MS, then slide out
            t1 = setTimeout(() => {
                setBadgeHidden(true);                       // slide out
                t2 = setTimeout(() => {
                    setBadgeMode('text');
                    setBadgeHidden(false);                  // slide in
                }, SLIDE_MS);
            }, ADVERT_MS);
        }

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [badgeMode]);

    // ─── Read VPS from localStorage (single source of truth) ────
    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            setVpsAddress(user.vps_address || null);
        } catch {
            setVpsAddress(null);
        }
    }, []);

    // ─── Load own details ────────────────────────────────────
    const loadDetails = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await fetch(`${API_URL}/mt5-details`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                setLoadError('Session expired — please log in again');
                setEditing(true);
                return;
            }

            if (!res.ok) {
                let serverMsg = `Server returned ${res.status}`;
                try {
                    const data = await res.json();
                    if (data.error) serverMsg = data.error;
                } catch { /* ignore */ }
                setLoadError(serverMsg);
                setDetails(null);
                setEditing(true);
                return;
            }

            const data = await res.json();
            if (data.details) {
                setDetails(data.details);
                setForm({
                    label: data.details.label || '',
                    mt5_login: data.details.mt5_login || '',
                    mt5_password: data.details.mt5_password || '',
                    mt5_server: data.details.mt5_server || '',
                    notes: data.details.notes || '',
                });
                setEditing(false);
            } else {
                setDetails(null);
                setEditing(true);
            }
        } catch (err: any) {
            setLoadError(err.message || 'Network error');
            setDetails(null);
            setEditing(true);
        } finally {
            setLoading(false);
        }
    }, [API_URL, token]);

    // ─── Load chart symbols from VPS (ONLY if VPS assigned) ──
    const loadSymbols = useCallback(async () => {
        if (!vpsAddress) {
            setSymbols([]);
            setSymbolsError(null);
            return;
        }
        setSymbolsLoading(true);
        setSymbolsError(null);
        try {
            const res = await fetch(`${API_URL}/mt5-details/symbols`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Bridge returned ${res.status}`);
            const data = await res.json();
            setSymbols(data.symbols || []);
            setSymbolsError(data.error || null);
            setSymbolsFetchedAt(new Date());
        } catch (err: any) {
            setSymbolsError(err.message);
            setSymbols([]);
        } finally {
            setSymbolsLoading(false);
        }
    }, [API_URL, token, vpsAddress]);

    useEffect(() => { loadDetails(); }, [loadDetails]);

    useEffect(() => {
        if (!vpsAddress) {
            setSymbols([]);
            setSymbolsError(null);
            return;
        }
        loadSymbols();
        const interval = setInterval(loadSymbols, 30000);
        return () => clearInterval(interval);
    }, [vpsAddress, loadSymbols]);

    const handleSave = async () => {
        if (!form.mt5_login || !form.mt5_password || !form.mt5_server) {
            toast.error('MT5 login, password and server are required');
            return;
        }
        setSaving(true);
        try {
            const isCreate = !details;
            const res = await fetch(`${API_URL}/mt5-details`, {
                method: isCreate ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');
            setDetails(data.details);
            setEditing(false);
            setLoadError(null);
            toast.success(isCreate ? 'MT5 details saved' : 'MT5 details updated');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        if (!details) return;
        setForm({
            label: details.label || '',
            mt5_login: details.mt5_login || '',
            mt5_password: details.mt5_password || '',
            mt5_server: details.mt5_server || '',
            notes: details.notes || '',
        });
        setEditing(false);
    };

    // ─── Render ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            {/* ═══════ Animation keyframes ═══════ */}
            <style>{`
                @keyframes bannerShimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                @keyframes bannerGradientShift {
                    0%   { background-position:   0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position:   0% 50%; }
                }
                @keyframes priceGlow {
                    0%, 100% {
                        text-shadow: 0 0 20px rgba(251, 191, 36, 0.55),
                                     0 0 40px rgba(251, 191, 36, 0.30),
                                     0 0 60px rgba(251, 191, 36, 0.15);
                    }
                    50% {
                        text-shadow: 0 0 30px rgba(251, 191, 36, 0.85),
                                     0 0 60px rgba(251, 191, 36, 0.55),
                                     0 0 90px rgba(251, 191, 36, 0.30);
                    }
                }
                @keyframes floatY {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(-6px); }
                }
                @keyframes spinSlow {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes pulseRing {
                    0%   { transform: scale(1);    opacity: 0.7; }
                    100% { transform: scale(1.8);  opacity: 0; }
                }
                @keyframes arrowSlide {
                    0%, 100% { transform: translateX(0); }
                    50%      { transform: translateX(4px); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(0.9); }
                    50%      { opacity: 1;   transform: scale(1.2); }
                }
                @keyframes badgePulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.5); }
                    50%      { box-shadow: 0 0 0 8px rgba(251, 191, 36, 0); }
                }
                @keyframes advertGlow {
                    0%, 100% { filter: drop-shadow(0 0 6px rgba(251,191,36,0.55)); }
                    50%      { filter: drop-shadow(0 0 14px rgba(251,191,36,0.95)); }
                }
                @keyframes advertScan {
                    0%   { transform: translateX(-120%); }
                    100% { transform: translateX(220%); }
                }
                .premium-banner-bg {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%);
                    background-size: 400% 400%;
                    animation: bannerGradientShift 15s ease infinite;
                }
                .premium-price {
                    animation: priceGlow 3s ease-in-out infinite;
                }
                .premium-float {
                    animation: floatY 3.5s ease-in-out infinite;
                }
                .premium-spin-slow {
                    animation: spinSlow 20s linear infinite;
                }
                .premium-arrow {
                    animation: arrowSlide 1.5s ease-in-out infinite;
                }
                .premium-badge {
                    animation: badgePulse 2s ease-in-out infinite;
                }
                .premium-twinkle {
                    animation: twinkle 2.5s ease-in-out infinite;
                }
            `}</style>

            <div className="max-w-4xl mx-auto space-y-5">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                        <Key className="text-white" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                            My MT5 Account
                        </h1>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Submit your MT5 credentials for VPS setup · Read-only once saved
                        </p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════ */}
                {/*  PREMIUM ACCESS BANNER — animated, premium feel   */}
                {/* ═══════════════════════════════════════════════════ */}
                <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="premium-banner-bg group relative block rounded-3xl border border-amber-400/30 shadow-2xl shadow-amber-500/10 overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:border-amber-300/60 hover:shadow-amber-500/30 active:scale-[0.995]"
                >
                    {/* Rotating conic glow (background) */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none">
                        <div className="premium-spin-slow absolute -inset-1/2 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(251,191,36,0.3)_60deg,transparent_120deg,transparent_180deg,rgba(251,191,36,0.3)_240deg,transparent_300deg)]" />
                    </div>

                    {/* Shimmer sweep */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                            style={{ animation: 'bannerShimmer 4s ease-in-out infinite' }}
                        />
                    </div>

                    {/* Twinkle stars */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[
                            { top: '12%', left: '8%',  size: 4, delay: '0s' },
                            { top: '22%', left: '22%', size: 3, delay: '0.4s' },
                            { top: '70%', left: '12%', size: 3, delay: '0.9s' },
                            { top: '18%', left: '78%', size: 4, delay: '1.3s' },
                            { top: '75%', left: '82%', size: 3, delay: '0.7s' },
                            { top: '45%', left: '92%', size: 2, delay: '1.6s' },
                        ].map((s, i) => (
                            <span
                                key={i}
                                className="absolute rounded-full bg-amber-200 premium-twinkle"
                                style={{
                                    top: s.top,
                                    left: s.left,
                                    width: s.size,
                                    height: s.size,
                                    animationDelay: s.delay,
                                }}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="relative p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">

                            {/* Left: copy */}
                            <div className="flex-1 min-w-0">
                                {/* ═══════ Auto-rotating badge ═══════ */}
                                <div className="relative inline-flex mb-3" style={{ minWidth: '190px', height: '28px' }}>
                                    {/* ── TEXT STATE: "Premium Available" ── */}
                                    <div
                                        className={`absolute inset-0 inline-flex items-center gap-2 rounded-full px-3 py-1 premium-badge transition-all duration-400 ease-in-out ${
                                            badgeHidden && badgeMode === 'text'
                                                ? 'opacity-0 -translate-y-6 scale-95'
                                                : badgeMode === 'text'
                                                    ? 'opacity-100 translate-y-0 scale-100'
                                                    : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
                                        }`}
                                        style={{
                                            background: 'rgba(251, 191, 36, 0.15)',
                                            border: '1px solid rgba(252, 211, 77, 0.4)',
                                            transitionDuration: '400ms',
                                        }}
                                    >
                                        <span className="relative flex h-2 w-2">
                                            <span
                                                className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"
                                                style={{ animation: 'pulseRing 1.6s ease-out infinite' }}
                                            />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
                                        </span>
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200">
                                            Premium Available
                                        </span>
                                    </div>

                                    {/* ── ADVERT STATE: animated mini ad ── */}
                                    <div
                                        className={`absolute inset-0 inline-flex items-center gap-2 rounded-full px-3 py-1 transition-all duration-400 ease-in-out overflow-hidden ${
                                            badgeHidden && badgeMode === 'advert'
                                                ? 'opacity-0 -translate-y-6 scale-95'
                                                : badgeMode === 'advert'
                                                    ? 'opacity-100 translate-y-0 scale-100'
                                                    : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
                                        }`}
                                        style={{
                                            background: 'linear-gradient(90deg, rgba(251,191,36,0.25) 0%, rgba(249,115,22,0.30) 50%, rgba(251,191,36,0.25) 100%)',
                                            border: '1px solid rgba(253, 224, 71, 0.55)',
                                            transitionDuration: '400ms',
                                        }}
                                    >
                                        {/* scan line */}
                                        <span
                                            className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                            style={{ animation: 'advertScan 2.2s ease-in-out infinite' }}
                                        />
                                        <span style={{ animation: 'advertGlow 1.8s ease-in-out infinite' }}>
                                            <Crown size={13} className="text-amber-100 drop-shadow" />
                                        </span>
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-50 whitespace-nowrap">
                                            PipTrader&nbsp;AI&nbsp;·&nbsp;$150
                                        </span>
                                        <Star size={10} className="text-yellow-100 premium-twinkle" />
                                    </div>
                                </div>

                                {/* Headline */}
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                                    Unlock{' '}
                                    <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
                                        Lifetime Access
                                    </span>
                                </h2>

                                {/* Subtitle */}
                                <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-md leading-relaxed">
                                    Run <span className="text-amber-200 font-semibold">PipNex</span>,{' '}
                                    <span className="text-amber-200 font-semibold">NOVA Edge AI</span> and{' '}
                                    <span className="text-amber-200 font-semibold">SMC Swing Trader</span> — all three algos,
                                    Risk Guard protection and Quantum AI advisor — from one dashboard. Live results, no monthly fees.
                                </p>

                                {/* Feature pills */}
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {[
                                        { icon: Zap,        label: '3 Algos' },
                                        { icon: Shield,     label: 'Risk Guard' },
                                        { icon: Sparkles,   label: 'Quantum AI' },
                                        { icon: TrendingUp, label: 'Live Results' },
                                    ].map(({ icon: Icon, label }, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 bg-white/5 border border-white/15 rounded-full px-2.5 py-1 text-[10px] font-semibold text-slate-200 backdrop-blur-sm"
                                        >
                                            <Icon size={10} className="text-amber-300" />
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Right: price + CTA */}
                            <div className="flex-shrink-0 flex flex-col items-end premium-float">
                                {/* Crown in glow ring */}
                                <div className="relative mb-3">
                                    <div className="absolute inset-0 bg-amber-400/40 blur-2xl rounded-full" />
                                    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 shadow-2xl shadow-amber-600/50 ring-1 ring-amber-200/60">
                                        <Crown size={26} className="text-white drop-shadow" />
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-2">
                                    <span className="premium-price text-3xl sm:text-4xl font-black bg-gradient-to-br from-amber-100 via-yellow-200 to-orange-300 bg-clip-text text-transparent">
                                        {PREMIUM_PRICE}
                                    </span>
                                    <span className="text-xs text-slate-400 line-through">{PREMIUM_ORIGINAL}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
                                    One-time · Forever
                                </div>
                            </div>
                        </div>

                        {/* CTA row */}
                        <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <Star size={11} className="text-amber-300" />
                                <span className="font-semibold">Trusted by traders · 24/7 support</span>
                            </div>

                            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 group-hover:from-emerald-400 group-hover:to-green-500 text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/40 border border-emerald-300/40 transition-all">
                                <Rocket size={13} />
                                Upgrade Now
                                <ArrowRight size={13} className="premium-arrow" />
                            </span>
                        </div>
                    </div>
                </a>

                {/* Soft warning if load failed */}
                {loadError && !details && (
                    <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-amber-200">
                                Could not load previous details ({loadError}). You can still submit below.
                            </p>
                        </div>
                    </div>
                )}

                {/* MT5 Details Card */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                                details
                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                                    : 'bg-gradient-to-br from-amber-500 to-orange-600'
                            }`}>
                                {details ? <CheckCircle2 size={18} className="text-white" /> : <AlertCircle size={18} className="text-white" />}
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Account Details
                                </h2>
                                <p className="text-slate-500 text-[10px] mt-0.5">
                                    {details
                                        ? `Submitted ${new Date(details.created_at).toLocaleDateString()} · Updated ${new Date(details.updated_at).toLocaleDateString()}`
                                        : 'Not yet submitted'}
                                </p>
                            </div>
                        </div>
                        {details && !editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30 transition"
                            >
                                <Pencil size={12} />
                                Edit
                            </button>
                        )}
                    </div>

                    <div className="p-5">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        ) : editing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">
                                        Label (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.label}
                                        onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                                        placeholder="e.g. Main, FTMO, Live"
                                        className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-rose-400 uppercase tracking-wider font-bold mb-1.5">
                                            MT5 Login *
                                        </label>
                                        <input
                                            type="text"
                                            value={form.mt5_login}
                                            onChange={(e) => setForm(prev => ({ ...prev, mt5_login: e.target.value }))}
                                            placeholder="Account number e.g. 51234567"
                                            className="w-full bg-slate-900/60 border border-rose-500/30 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-rose-400 uppercase tracking-wider font-bold mb-1.5">
                                            MT5 Password *
                                        </label>
                                        <input
                                            type="text"
                                            value={form.mt5_password}
                                            onChange={(e) => setForm(prev => ({ ...prev, mt5_password: e.target.value }))}
                                            placeholder="Your MT5 password"
                                            className="w-full bg-slate-900/60 border border-rose-500/30 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1.5">
                                        MT5 Server *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.mt5_server}
                                        onChange={(e) => setForm(prev => ({ ...prev, mt5_server: e.target.value }))}
                                        placeholder="e.g. ICMarketsSC-Live, FTMO-Server"
                                        className="w-full bg-slate-900/60 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        ⓘ Copy exactly from your MT5 login dialog — it's case-sensitive
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Anything the admin should know (e.g. prop firm rules, lot caps)"
                                        rows={3}
                                        className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>

                                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
                                    <Lock size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-200 leading-relaxed">
                                        Your password is stored on our server so the admin can set up MT5 on your VPS.
                                        Only you and the admin team can see it. It is never shared with anyone else.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={14} />
                                                {details ? 'Update Details' : 'Save Details'}
                                            </>
                                        )}
                                    </button>
                                    {details && (
                                        <button
                                            onClick={cancelEdit}
                                            className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-3 rounded-xl text-sm font-bold transition"
                                        >
                                            <X size={14} />
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : details ? (
                            <div className="space-y-4">
                                {details.label && (
                                    <div className="flex items-center gap-2 pb-3 border-b border-slate-700/40">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Label</span>
                                        <span className="text-white font-bold">{details.label}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">MT5 Login</div>
                                        <code className="text-white font-mono text-sm block">{details.mt5_login}</code>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-2">
                                            MT5 Password
                                            <button
                                                onClick={() => setShowPassword(s => !s)}
                                                className="text-slate-500 hover:text-blue-400 transition"
                                            >
                                                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                            </button>
                                        </div>
                                        <code className="text-white font-mono text-sm block">
                                            {showPassword ? details.mt5_password : '••••••••••••'}
                                        </code>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">MT5 Server</div>
                                    <code className="text-white font-mono text-sm block">{details.mt5_server}</code>
                                </div>
                                {details.notes && (
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Notes</div>
                                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{details.notes}</p>
                                    </div>
                                )}

                                <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 flex items-start gap-2">
                                    <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        To <strong className="text-slate-300">remove</strong> your MT5 details, contact support.
                                        Users cannot delete accounts directly — this protects you from accidental loss and prevents account sharing.
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Symbols on Chart Card */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                                vpsAddress
                                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                                    : 'bg-slate-700/60'
                            }`}>
                                <BarChart3 size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Symbols on Chart
                                </h2>
                                <p className="text-slate-500 text-[10px] mt-0.5">
                                    {vpsAddress
                                        ? `From VPS · ${vpsAddress}${symbolsFetchedAt ? ` · Refreshed ${symbolsFetchedAt.toLocaleTimeString()}` : ''}`
                                        : 'Waiting for VPS assignment'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={loadSymbols}
                            disabled={symbolsLoading || !vpsAddress}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={12} className={symbolsLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>

                    <div className="p-5">
                        {!vpsAddress ? (
                            <div className="text-center py-6">
                                <Server size={28} className="text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-500 text-xs">
                                    No VPS assigned yet. Ask admin to set up your VPS — symbols will appear here once connected.
                                </p>
                            </div>
                        ) : symbolsLoading && symbols.length === 0 ? (
                            <div className="flex justify-center py-6">
                                <div className="w-6 h-6 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        ) : symbolsError ? (
                            <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2">
                                <AlertCircle size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-rose-200 font-bold">Could not fetch symbols</p>
                                    <p className="text-[10px] text-rose-300/80 mt-0.5">{symbolsError}</p>
                                </div>
                            </div>
                        ) : symbols.length === 0 ? (
                            <div className="text-center py-6">
                                <BarChart3 size={28} className="text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-500 text-xs">
                                    No symbols found. The EA may not be attached to any chart yet.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {symbols.map((s, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 bg-slate-900/60 border border-emerald-500/30 rounded-lg px-3 py-2"
                                    >
                                        <Server size={12} className="text-emerald-400" />
                                        <span className="text-white font-mono text-xs font-bold">{s.symbol}</span>
                                        {s.period && (
                                            <span className="text-[9px] text-slate-500 uppercase">{s.period}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact admin */}
                <a
                    href={WHATSAPP_SUPPORT_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 rounded-2xl p-4 border border-emerald-400/40 shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <MessageCircle size={18} className="text-white" />
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">Need to change or remove details?</div>
                            <div className="text-emerald-100 text-[11px]">Contact admin on WhatsApp</div>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default Mt5DetailsPage;
