import React, { useState, useEffect } from 'react';
import {
    Eye, EyeOff, AlertCircle, Loader2, Mail, Lock,
    Sparkles, Shield, Zap, TrendingUp, MessageCircle,
    ArrowRight, Crown, CheckCircle2, Star,
    ExternalLink, Building2, Send, X, DollarSign,
    ChevronDown, ChevronUp, Scale, FileText,
} from 'lucide-react';

interface LoginPageProps {
    onLogin: (data: { token: string; user: any }) => void;
    isLoading?: boolean;
    error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

const WHATSAPP_NUMBER = '254116081230';
const WHATSAPP_MESSAGE = encodeURIComponent(
    'Hello! I want to get lifetime access to PipTrader AI. Can you help me configure my account?'
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const BROKER_LINK = 'https://ma.valetax.com/p/2083506';
const TELEGRAM_LINK = 'https://t.me/calekyz';

const BOT_PRICE = '$150';

const LOGO_URL = 'https://i.postimg.cc/4ygqTvHz/Chat-GPT-Image-Sep-7-2026-02-38-09-AM.png';
const BG_URL = 'https://i.postimg.cc/DwvhGhZM/Chat-GPT-Image-Sep-7-2026-02-36-16-AM.png';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading, error }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [signupMessage, setSignupMessage] = useState<string | null>(null);

    // ─── Telegram popup state (persisted dismissal) ─────────
    const [showTelegramPopup, setShowTelegramPopup] = useState(false);

    // ─── Risk disclaimer dropdown ────────────────────────────
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // ─── Rotating tagline (welcome ↔ advert) ─────────────────
    const [taglineMode, setTaglineMode] = useState<'welcome' | 'advert'>('welcome');
    const [taglineHidden, setTaglineHidden] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('telegramPopupDismissed');
        if (!dismissed) {
            const t = setTimeout(() => setShowTelegramPopup(true), 1200);
            return () => clearTimeout(t);
        }
    }, []);

    useEffect(() => {
        const SLIDE_MS = 400;      // slide transition time
        const WELCOME_MS = 3000;   // welcome stays visible 3s
        const ADVERT_MS = 4500;    // advert stays visible 4.5s

        let t1: ReturnType<typeof setTimeout>;
        let t2: ReturnType<typeof setTimeout>;

        if (taglineMode === 'welcome') {
            t1 = setTimeout(() => {
                setTaglineHidden(true);
                t2 = setTimeout(() => {
                    setTaglineMode('advert');
                    setTaglineHidden(false);
                }, SLIDE_MS);
            }, WELCOME_MS);
        } else {
            t1 = setTimeout(() => {
                setTaglineHidden(true);
                t2 = setTimeout(() => {
                    setTaglineMode('welcome');
                    setTaglineHidden(false);
                }, SLIDE_MS);
            }, ADVERT_MS);
        }

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [taglineMode]);

    const dismissTelegramPopup = () => {
        setShowTelegramPopup(false);
        localStorage.setItem('telegramPopupDismissed', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);
        setSignupMessage(null);

        try {
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
            const payload: any = { email, password };

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || (mode === 'login' ? 'Login failed' : 'Registration failed'));
            }

            const data = await res.json();
            if (mode === 'signup') {
                setSignupMessage(data.message || 'Account created. Please contact admin for an access key to log in.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user.access_key) {
                localStorage.setItem('accessKey', data.user.access_key);
            }
            if (data.user.mt5) {
                localStorage.setItem('mt5Account', JSON.stringify(data.user.mt5));
            }

            onLogin({ token: data.token, user: data.user });
        } catch (err: any) {
            setLocalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setLocalError(null);
        setSignupMessage(null);
    };

    return (
        <div
            className="min-h-screen w-full relative overflow-hidden"
            style={{
                backgroundImage: `url('${BG_URL}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >
            {/* ═══════ Animation keyframes ═══════ */}
            <style>{`
                @keyframes taglineShimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(220%); }
                }
                @keyframes taglinePriceGlow {
                    0%, 100% {
                        text-shadow: 0 0 12px rgba(251, 191, 36, 0.55),
                                     0 0 24px rgba(251, 191, 36, 0.30);
                    }
                    50% {
                        text-shadow: 0 0 18px rgba(251, 191, 36, 0.85),
                                     0 0 36px rgba(251, 191, 36, 0.55);
                    }
                }
                @keyframes taglineArrowSlide {
                    0%, 100% { transform: translateX(0); }
                    50%      { transform: translateX(5px); }
                }
                @keyframes taglinePulseRing {
                    0%   { transform: scale(1);    opacity: 0.7; }
                    100% { transform: scale(1.9);  opacity: 0; }
                }
                @keyframes taglineTwinkle {
                    0%, 100% { opacity: 0.25; transform: scale(0.9); }
                    50%      { opacity: 1;    transform: scale(1.2); }
                }
                .tagline-price-glow {
                    animation: taglinePriceGlow 3s ease-in-out infinite;
                }
                .tagline-arrow {
                    animation: taglineArrowSlide 1.6s ease-in-out infinite;
                }
                .tagline-twinkle {
                    animation: taglineTwinkle 2.4s ease-in-out infinite;
                }
            `}</style>

            {/* ─── Dark overlay ───────────────────────────────── */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/95" />

            {/* ─── Ambient glows ─────────────────────────────── */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* LEFT PANEL — Branding & Value Props                 */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <div className="hidden lg:flex flex-col space-y-5">

                        {/* Logo + Title */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-purple-500/40 blur-xl rounded-2xl" />
                                <div className="relative p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl shadow-blue-600/30 ring-1 ring-blue-400/30">
                                    <img
                                        src={LOGO_URL}
                                        alt="PipTrader AI"
                                        className="h-12 w-12 object-contain"
                                    />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                                    PipTrader AI
                                </h1>
                                <p className="text-slate-400 text-[10px] mt-1 tracking-[0.25em] uppercase font-bold">
                                    Automated Trading Platform
                                </p>
                            </div>
                        </div>

                        {/* Headline */}
                        <div>
                            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                                Trade <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">24/7</span> with
                                <br />
                                AI-powered algorithms
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Cloud-based MT5 trading bots that run on our dedicated servers — no
                                computer needed. Just set your risk, click start, and let the algorithms work.
                            </p>
                        </div>

                        {/* Feature List */}
                        <div className="space-y-2.5">
                            {[
                                {
                                    icon: <Shield size={16} className="text-emerald-400" />,
                                    bg: 'from-emerald-500/20 to-teal-600/20',
                                    border: 'border-emerald-500/30',
                                    title: 'Risk Guard Protection',
                                    desc: 'Auto stop-loss and take-profit closes all positions when targets are hit',
                                },
                                {
                                    icon: <Zap size={16} className="text-blue-400" />,
                                    bg: 'from-blue-500/20 to-indigo-600/20',
                                    border: 'border-blue-500/30',
                                    title: 'Instant Execution',
                                    desc: 'Trades placed in milliseconds on your dedicated VPS',
                                },
                                {
                                    icon: <TrendingUp size={16} className="text-purple-400" />,
                                    bg: 'from-purple-500/20 to-pink-600/20',
                                    border: 'border-purple-500/30',
                                    title: 'Live Performance Tracking',
                                    desc: 'Real-time balance, equity, orders, and trade history',
                                },
                                {
                                    icon: <Crown size={16} className="text-amber-400" />,
                                    bg: 'from-amber-500/20 to-orange-600/20',
                                    border: 'border-amber-500/30',
                                    title: 'Lifetime Access',
                                    badge: `One-time · ${BOT_PRICE}`,
                                    desc: `Pay once ${BOT_PRICE}, trade forever. No monthly fees.`,
                                },
                            ].map((f, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50 hover:border-slate-600/70 transition-all"
                                >
                                    <div className={`p-2 bg-gradient-to-br ${f.bg} rounded-lg border ${f.border} flex-shrink-0`}>
                                        {f.icon}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5 flex-wrap">
                                            {f.title}
                                            {f.badge && (
                                                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase font-bold">
                                                    {f.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-400">{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ─── Broker Signup CTA ───────────────────── */}
                        <a
                            href={BROKER_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-2xl p-4 border border-blue-400/40 shadow-lg shadow-blue-600/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="relative flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                                    <Building2 size={20} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm flex items-center gap-1.5">
                                        Open Broker Account
                                        <span className="text-[9px] bg-amber-400/30 text-amber-100 px-1.5 py-0.5 rounded border border-amber-300/40 uppercase font-bold">
                                            Recommended
                                        </span>
                                    </div>
                                    <div className="text-blue-100 text-[11px]">
                                        Sign up with our partner broker · MT5 supported
                                    </div>
                                </div>
                            </div>
                            <ExternalLink
                                size={18}
                                className="relative text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0"
                            />
                        </a>

                        {/* ─── WhatsApp CTA ─────────────────────────── */}
                        <a
                            href={WHATSAPP_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 rounded-2xl p-4 border border-emerald-500/40 shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="relative flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                                    <MessageCircle size={20} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm flex items-center gap-2">
                                        Get Lifetime Access
                                        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30 font-extrabold">
                                            {BOT_PRICE}
                                        </span>
                                    </div>
                                    <div className="text-emerald-100 text-[11px]">
                                        Chat on WhatsApp · +254 116 081 230
                                    </div>
                                </div>
                            </div>
                            <ArrowRight
                                size={18}
                                className="relative text-white group-hover:translate-x-1 transition-transform flex-shrink-0"
                            />
                        </a>
                    </div>

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* RIGHT PANEL — Login/Signup Card                     */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/60 shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-blue-500/10 overflow-hidden">

                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                            {/* ─── Mobile-only Logo ──────────────────── */}
                            <div className="lg:hidden text-center mb-6">
                                <div className="flex justify-center mb-3">
                                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-600/30 ring-1 ring-blue-400/30">
                                        <img
                                            src={LOGO_URL}
                                            alt="PipTrader AI Logo"
                                            className="h-12 w-12 object-contain"
                                        />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    PipTrader AI
                                </h1>
                                <p className="text-slate-500 text-xs mt-1">
                                    Automated MT5 Trading Platform
                                </p>
                            </div>

                            {/* ─── Price badge ──────────────────────── */}
                            <div className="flex justify-center mb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/40 shadow-lg shadow-amber-500/10">
                                    <DollarSign size={12} className="text-amber-400" />
                                    <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                                        Lifetime Access · {BOT_PRICE}
                                    </span>
                                    <Crown size={12} className="text-amber-400" />
                                </div>
                            </div>

                            {/* ═══════════════════════════════════════════════ */}
                            {/*  ROTATING TAGLINE — Welcome ↔ Advert            */}
                            {/* ═══════════════════════════════════════════════ */}
                            <div className="relative h-[110px] mb-5 flex items-center justify-center">

                                {/* ── STATE 1: Welcome text ── */}
                                <div
                                    className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all ease-in-out ${
                                        taglineHidden && taglineMode === 'welcome'
                                            ? 'opacity-0 -translate-y-6 scale-95'
                                            : taglineMode === 'welcome'
                                                ? 'opacity-100 translate-y-0 scale-100'
                                                : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
                                    }`}
                                    style={{ transitionDuration: '400ms' }}
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-full border border-slate-700/50 mb-3">
                                        {mode === 'login' ? (
                                            <>
                                                <Sparkles size={12} className="text-blue-400" />
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                    Welcome Back
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Star size={12} className="text-amber-400" />
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                    Create Account
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-white">
                                        {mode === 'login' ? 'Sign in to your dashboard' : 'Create your account'}
                                    </h2>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {mode === 'login'
                                            ? 'Enter your credentials to continue'
                                            : 'Sign up to get started with trading'}
                                    </p>
                                </div>

                                {/* ── STATE 2: Advert ── */}
                                <div
                                    className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all ease-in-out ${
                                        taglineHidden && taglineMode === 'advert'
                                            ? 'opacity-0 -translate-y-6 scale-95'
                                            : taglineMode === 'advert'
                                                ? 'opacity-100 translate-y-0 scale-100'
                                                : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
                                    }`}
                                    style={{ transitionDuration: '400ms' }}
                                >
                                    {/* Pulsing "limited offer" badge */}
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/50 shadow-lg shadow-amber-500/20 relative overflow-hidden"
                                         style={{
                                             background: 'linear-gradient(90deg, rgba(251,191,36,0.20) 0%, rgba(249,115,22,0.25) 100%)',
                                         }}
                                    >
                                        {/* shimmer */}
                                        <span
                                            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                            style={{ animation: 'taglineShimmer 2.5s ease-in-out infinite' }}
                                        />
                                        <span className="relative flex h-2 w-2">
                                            <span
                                                className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"
                                                style={{ animation: 'taglinePulseRing 1.6s ease-out infinite' }}
                                            />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
                                        </span>
                                        <span className="relative text-[10px] font-extrabold uppercase tracking-widest text-amber-100">
                                            Limited Offer
                                        </span>
                                        <Star size={10} className="relative text-amber-100 tagline-twinkle" />
                                    </div>

                                    {/* Headline with glowing price */}
                                    <h2 className="text-xl font-black text-white mt-3 leading-tight">
                                        Unlock <span className="tagline-price-glow bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent">Lifetime Access</span>
                                    </h2>

                                    {/* Subtitle */}
                                    <p className="text-slate-300 text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap justify-center">
                                        <span className="text-emerald-400 font-bold">3 Algos</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="text-blue-400 font-bold">Risk Guard</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="text-purple-400 font-bold">Quantum AI</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="text-amber-300 font-bold">{BOT_PRICE}</span>
                                    </p>

                                    {/* CTA hint */}
                                    <a
                                        href={WHATSAPP_LINK}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                                    >
                                        Get started today
                                        <ArrowRight size={11} className="tagline-arrow" />
                                    </a>
                                </div>
                            </div>

                            {/* ─── Broker Hint (signup only) ──────────── */}
                            {mode === 'signup' && !signupMessage && (
                                <div className="mb-5 p-3.5 bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/30 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30 flex-shrink-0">
                                            <Building2 size={14} className="text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-blue-200 font-bold text-[11px] mb-0.5">
                                                Need a broker first?
                                            </div>
                                            <p className="text-blue-300/70 text-[11px] leading-relaxed mb-2">
                                                Open a MetaTrader 5 account with our partner broker to get started.
                                            </p>
                                            <a
                                                href={BROKER_LINK}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 hover:text-white underline transition"
                                            >
                                                Open Broker Account
                                                <ExternalLink size={11} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── Signup Success Message ─────────────── */}
                            {signupMessage && (
                                <div className="mb-5 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl flex items-start gap-3">
                                    <div className="p-1.5 bg-emerald-500/20 rounded-lg flex-shrink-0 border border-emerald-500/30">
                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-emerald-300 font-bold text-xs mb-0.5">
                                            Account Created Successfully
                                        </div>
                                        <div className="text-emerald-400/80 text-[11px] leading-relaxed">
                                            {signupMessage}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── Form ──────────────────────────────── */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            size={16}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                        />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full bg-slate-800/60 border border-slate-600/60 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            size={16}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                        />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-800/60 border border-slate-600/60 rounded-xl pl-11 pr-12 py-3.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {(localError || error) && (
                                    <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-900/20 border border-rose-500/30 rounded-xl p-3">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>{localError || error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {loading || isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                                        </>
                                    ) : (
                                        <>
                                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>

                                <div className="text-center text-xs text-slate-400 pt-2">
                                    {mode === 'login' ? (
                                        <>
                                            Don't have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={toggleMode}
                                                className="text-blue-400 hover:text-blue-300 underline transition font-bold"
                                            >
                                                Sign Up
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            Already have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={toggleMode}
                                                className="text-blue-400 hover:text-blue-300 underline transition font-bold"
                                            >
                                                Sign In
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>

                            {/* ─── Divider ────────────────────────────── */}
                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px bg-slate-700/50" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                    Get Started
                                </span>
                                <div className="flex-1 h-px bg-slate-700/50" />
                            </div>

                            {/* ─── Mobile / Small Stack: Broker + WhatsApp ── */}
                            <div className="space-y-2.5">
                                <a
                                    href={BROKER_LINK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="lg:hidden group flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600/20 to-indigo-700/20 hover:from-blue-600/30 hover:to-indigo-700/30 rounded-xl p-3 border border-blue-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                                            <Building2 size={14} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-blue-300 font-bold text-[11px]">
                                                Open Broker Account
                                            </div>
                                            <div className="text-slate-500 text-[10px]">
                                                Partner broker · MT5 supported
                                            </div>
                                        </div>
                                    </div>
                                    <ExternalLink
                                        size={14}
                                        className="text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                                    />
                                </a>

                                <a
                                    href={WHATSAPP_LINK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-600/20 to-green-700/20 hover:from-emerald-600/30 hover:to-green-700/30 rounded-xl p-3 border border-emerald-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                                            <MessageCircle size={14} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-emerald-300 font-bold text-[11px]">
                                                Get Lifetime Access
                                            </div>
                                            <div className="text-slate-500 text-[10px]">
                                                +254 116 081 230
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-extrabold">
                                            {BOT_PRICE}
                                        </span>
                                        <ArrowRight
                                            size={14}
                                            className="text-emerald-400 group-hover:translate-x-1 transition-transform"
                                        />
                                    </div>
                                </a>
                            </div>

                            {/* ═══════════════════════════════════════════════ */}
                            {/*  RISK DISCLAIMER — collapsible dropdown        */}
                            {/* ═══════════════════════════════════════════════ */}
                            <div className="mt-5 border border-slate-700/40 rounded-xl overflow-hidden bg-slate-950/40">
                                <button
                                    type="button"
                                    onClick={() => setShowDisclaimer(!showDisclaimer)}
                                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 hover:bg-slate-800/40 transition text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <Scale size={13} className="text-amber-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Risk Disclaimer
                                        </span>
                                    </div>
                                    {showDisclaimer ? (
                                        <ChevronUp size={14} className="text-slate-500" />
                                    ) : (
                                        <ChevronDown size={14} className="text-slate-500" />
                                    )}
                                </button>
                                {showDisclaimer && (
                                    <div className="px-3.5 pb-3 pt-1 border-t border-slate-700/40">
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            Trading foreign exchange (Forex) and Contracts for Difference (CFDs) on margin
                                            carries a high level of risk and may not be suitable for all investors. The high
                                            degree of leverage can work against you as well as for you. Before deciding to trade,
                                            you should carefully consider your investment objectives, level of experience, and
                                            risk appetite. The possibility exists that you could sustain a loss of some or all
                                            of your initial investment. You should be aware of all risks associated with Forex
                                            and CFD trading. Past performance is not indicative of future results.
                                        </p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-700/30">
                                            <span className="text-slate-400 font-bold">PipTrader AI</span> provides automation
                                            software only and does not offer financial advice, portfolio management, or
                                            guaranteed returns. You are solely responsible for your trading decisions.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* ═══════════════════════════════════════════════ */}
                            {/*  COMPANY FOOTER                                 */}
                            {/* ═══════════════════════════════════════════════ */}
                            <div className="mt-5 pt-4 border-t border-slate-700/30">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="p-1 bg-emerald-500/15 rounded-md border border-emerald-500/30">
                                        <Shield size={10} className="text-emerald-400" />
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                        Secured Connection · v2.0
                                    </span>
                                </div>
                                <div className="text-center space-y-1">
                                    <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <FileText size={9} className="text-slate-600" />
                                        <span className="font-semibold text-slate-400 uppercase tracking-wider">
                                            © {new Date().getFullYear()} CALEKYZ DIGITALISED SERVICE ENTERPRISES
                                        </span>
                                    </div>
                                    <div className="text-[9px] text-slate-600 leading-relaxed max-w-[280px] mx-auto">
                                        Registered under the Registrar of Companies, Republic of Kenya
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════ */}
            {/*  FLOATING TELEGRAM POPUP (dismissible)                */}
            {/* ═════════════════════════════════════════════════════ */}
            {showTelegramPopup && (
                <div className="fixed bottom-5 right-5 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-600 blur-xl opacity-40 rounded-2xl pointer-events-none" />

                        <div className="relative flex items-center gap-3 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-3 pr-10 shadow-2xl shadow-blue-600/40 border border-sky-300/40 max-w-[280px]">

                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 flex-shrink-0">
                                <Send size={18} className="text-white" />
                            </div>

                            <div className="min-w-0">
                                <div className="text-white font-bold text-xs leading-tight">
                                    Join our Telegram
                                </div>
                                <div className="text-sky-100 text-[10px] font-mono mt-0.5">
                                    t.me/calekyz
                                </div>
                            </div>

                            <a
                                href={TELEGRAM_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto flex-shrink-0 bg-white/25 hover:bg-white/35 text-white p-2 rounded-xl backdrop-blur-sm border border-white/30 transition-all hover:scale-110 active:scale-95"
                                aria-label="Open Telegram"
                            >
                                <ArrowRight size={14} />
                            </a>

                            <button
                                onClick={dismissTelegramPopup}
                                className="absolute top-1 right-1 p-1 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition"
                                aria-label="Dismiss"
                                title="Dismiss"
                            >
                                <X size={12} strokeWidth={3} />
                            </button>
                        </div>

                        <span className="absolute -top-1 -left-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
