import React, { useState, useEffect } from 'react';
import {
    Mail, AlertCircle, CheckCircle2, Loader2, Shield,
    MessageCircle, ArrowRight, Info, X, MailX,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

const WHATSAPP_NUMBER = '254116081230';
const WHATSAPP_MESSAGE = encodeURIComponent(
    'Hello! I accidentally unsubscribed from PipTrader AI emails and want to be re-subscribed.'
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

type Status = 'idle' | 'submitting' | 'success' | 'already' | 'error';

export const Unsubscribe: React.FC = () => {
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);

    // ─── Read email from URL: /unsubscribe?email=user@example.com ────
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlEmail = params.get('email') || params.get('e');
            if (urlEmail) {
                setEmail(urlEmail.trim().toLowerCase());
                checkStatus(urlEmail.trim().toLowerCase());
            }
        } catch { /* ignore */ }
    }, []);

    const checkStatus = async (emailToCheck: string) => {
        setChecking(true);
        try {
            const res = await fetch(
                `${API_URL}/unsubscribe/check?email=${encodeURIComponent(emailToCheck)}`
            );
            if (res.ok) {
                const data = await res.json();
                if (data.unsubscribed) {
                    setStatus('already');
                }
            }
        } catch { /* silent */ } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const clean = email.trim().toLowerCase();
        if (!clean) {
            setErrorMsg('Please enter your email address');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
            setErrorMsg('That doesn\'t look like a valid email');
            return;
        }

        setStatus('submitting');
        try {
            const res = await fetch(`${API_URL}/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: clean, reason: reason.trim() || null }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Something went wrong');
            }

            setStatus('success');
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to unsubscribe');
            setStatus('error');
        }
    };

    const resetForm = () => {
        setStatus('idle');
        setErrorMsg(null);
        setReason('');
    };

    return (
        <div
            className="min-h-screen w-full relative overflow-hidden bg-slate-950"
            style={{
                background:
                    'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.10) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.10) 0%, transparent 40%), #020617',
            }}
        >
            {/* Ambient glows */}
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-10">
                <div className="w-full max-w-lg">

                    {/* Card */}
                    <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/60 shadow-2xl p-6 sm:p-8 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                        {/* ═══════ STATE: ALREADY UNSUBSCRIBED ═══════ */}
                        {status === 'already' && (
                            <div className="text-center py-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/40 mb-4">
                                    <MailX size={28} className="text-blue-400" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white mb-2">
                                    You're already unsubscribed
                                </h1>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    <span className="text-slate-300 font-mono">{email}</span> is not receiving
                                    PipTrader AI emails. You won't get any marketing or notification emails from us.
                                </p>
                                <a
                                    href={WHATSAPP_LINK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                                >
                                    <MessageCircle size={16} />
                                    Contact us on WhatsApp
                                    <ArrowRight size={14} />
                                </a>
                                <button
                                    onClick={resetForm}
                                    className="block w-full mt-3 text-xs text-slate-500 hover:text-slate-300 transition underline"
                                >
                                    Use a different email
                                </button>
                            </div>
                        )}

                        {/* ═══════ STATE: SUCCESS ═══════ */}
                        {status === 'success' && (
                            <div className="text-center py-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/40 mb-4">
                                    <CheckCircle2 size={28} className="text-emerald-400" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white mb-2">
                                    You've been unsubscribed
                                </h1>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    <span className="text-slate-300 font-mono">{email}</span> has been removed
                                    from our mailing list. You won't receive any more emails from PipTrader AI.
                                </p>

                                <div className="bg-slate-950/60 border border-slate-700/40 rounded-xl p-3.5 text-left mb-5">
                                    <div className="flex items-start gap-2.5">
                                        <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-slate-400 leading-relaxed">
                                            You'll still get critical account emails (like password resets and
                                            security alerts). If you want to re-subscribe later, message us on WhatsApp.
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href={WHATSAPP_LINK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                                >
                                    <MessageCircle size={16} />
                                    Changed your mind?
                                    <ArrowRight size={14} />
                                </a>
                            </div>
                        )}

                        {/* ═══════ STATE: FORM / ERROR / SUBMITTING ═══════ */}
                        {(status === 'idle' || status === 'error' || status === 'submitting' || checking) && (
                            <>
                                {/* Icon */}
                                <div className="flex justify-center mb-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-600/30 ring-1 ring-blue-400/30">
                                        <Mail size={28} className="text-white" />
                                    </div>
                                </div>

                                {/* Heading */}
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                                        Unsubscribe from Emails
                                    </h1>
                                    <p className="text-slate-400 text-xs mt-2 leading-relaxed max-w-sm mx-auto">
                                        We're sorry to see you go. Enter your email below to stop receiving
                                        marketing and update emails from PipTrader AI.
                                    </p>
                                </div>

                                {checking ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                                    </div>
                                ) : (
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
                                                    readOnly={!!new URLSearchParams(window.location.search).get('email')}
                                                    className={`w-full bg-slate-800/60 border border-slate-600/60 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition ${
                                                        new URLSearchParams(window.location.search).get('email')
                                                            ? 'opacity-70 cursor-not-allowed'
                                                            : ''
                                                    }`}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                                Reason <span className="text-slate-600 normal-case tracking-normal">(optional)</span>
                                            </label>
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Help us improve — why are you leaving?"
                                                rows={3}
                                                maxLength={500}
                                                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition resize-none"
                                            />
                                            <div className="text-[10px] text-slate-600 mt-1 text-right">
                                                {reason.length}/500
                                            </div>
                                        </div>

                                        {/* Error */}
                                        {(errorMsg || status === 'error') && (
                                            <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-900/20 border border-rose-500/30 rounded-xl p-3">
                                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                                <span>{errorMsg || 'Something went wrong. Please try again.'}</span>
                                            </div>
                                        )}

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={status === 'submitting'}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                                        >
                                            {status === 'submitting' ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Unsubscribing...
                                                </>
                                            ) : (
                                                <>
                                                    Confirm Unsubscribe
                                                    <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>

                                        <p className="text-[10px] text-slate-500 text-center leading-relaxed pt-1">
                                            You'll still receive critical account emails like password resets
                                            and security alerts.
                                        </p>
                                    </form>
                                )}
                            </>
                        )}

                        {/* Footer badge */}
                        <div className="mt-6 pt-4 border-t border-slate-700/30 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                            <Shield size={10} className="text-emerald-400" />
                            <span>Secured · PipTrader AI</span>
                        </div>
                    </div>

                    {/* Bottom note */}
                    <div className="mt-4 text-center text-[10px] text-slate-600 leading-relaxed">
                        © {new Date().getFullYear()} CALEKYZ DIGITALISED SERVICE ENTERPRISES<br />
                        Registered under the Registrar of Companies, Republic of Kenya
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Unsubscribe;
