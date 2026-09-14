import React, { useState } from 'react';
import {
    Eye, EyeOff, AlertCircle, Loader2, Mail, Lock,
    Sparkles, Shield, Zap, TrendingUp, MessageCircle,
    ArrowRight, Crown, CheckCircle2, Star
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

            // Login success
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
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-slate-950/90" />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* LEFT PANEL — Branding & Value Props                 */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <div className="hidden lg:flex flex-col space-y-6">

                        {/* Logo + Title */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl shadow-blue-600/30">
                                <img
                                    src={LOGO_URL}
                                    alt="PipTrader AI"
                                    className="h-12 w-12 object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                                    PipTrader AI
                                </h1>
                                <p className="text-slate-400 text-xs mt-1 tracking-wider uppercase font-semibold">
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
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
                                <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-lg border border-emerald-500/30 flex-shrink-0">
                                    <Shield size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white mb-0.5">Risk Guard Protection</div>
                                    <div className="text-[11px] text-slate-400">
                                        Auto stop-loss and take-profit closes all positions when targets are hit
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
                                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-lg border border-blue-500/30 flex-shrink-0">
                                    <Zap size={16} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white mb-0.5">Instant Execution</div>
                                    <div className="text-[11px] text-slate-400">
                                        Trades placed in milliseconds on your dedicated VPS
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
                                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-lg border border-purple-500/30 flex-shrink-0">
                                    <TrendingUp size={16} className="text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white mb-0.5">Live Performance Tracking</div>
                                    <div className="text-[11px] text-slate-400">
                                        Real-time balance, equity, orders, and trade history
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
                                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-lg border border-amber-500/30 flex-shrink-0">
                                    <Crown size={16} className="text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5">
                                        Lifetime Access
                                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase font-bold">
                                            One-time
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Pay once, trade forever. No monthly fees.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp CTA */}
                        <a
                            href={WHATSAPP_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 rounded-2xl p-4 border border-emerald-500/40 shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <MessageCircle size={20} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm">
                                        Get Lifetime Access
                                    </div>
                                    <div className="text-emerald-100 text-[11px]">
                                        Chat on WhatsApp · +254 116 081 230
                                    </div>
                                </div>
                            </div>
                            <ArrowRight
                                size={18}
                                className="text-white group-hover:translate-x-1 transition-transform"
                            />
                        </a>
                    </div>

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* RIGHT PANEL — Login/Signup Card                     */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/60 shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-blue-500/10">

                            {/* Mobile-only Logo */}
                            <div className="lg:hidden text-center mb-6">
                                <div className="flex justify-center mb-3">
                                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-600/30">
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

                            {/* Mode Title */}
                            <div className="text-center mb-6">
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

                            {/* Signup Success Message */}
                            {signupMessage && (
                                <div className="mb-5 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl flex items-start gap-3">
                                    <div className="p-1.5 bg-emerald-500/20 rounded-lg flex-shrink-0">
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

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
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

                                {/* Password */}
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

                                {/* Error */}
                                {(localError || error) && (
                                    <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-900/20 border border-rose-500/30 rounded-xl p-3">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>{localError || error}</span>
                                    </div>
                                )}

                                {/* Submit */}
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

                                {/* Toggle Mode */}
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

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px bg-slate-700/50" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                    Need access?
                                </span>
                                <div className="flex-1 h-px bg-slate-700/50" />
                            </div>

                            {/* WhatsApp CTA for mobile */}
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
                                <ArrowRight
                                    size={14}
                                    className="text-emerald-400 group-hover:translate-x-1 transition-transform"
                                />
                            </a>

                            {/* Footer */}
                            <div className="mt-5 text-center">
                                <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Shield size={10} className="text-emerald-400" />
                                    <span>Secured connection · v2.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
