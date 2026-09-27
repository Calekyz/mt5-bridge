import React, { useState } from 'react';
import { Scale, CheckCircle2, Loader2, AlertTriangle, FileText, Shield, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

interface TermsModalProps {
    onAccepted: () => void;
    onDeclined?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

export const TermsModal: React.FC<TermsModalProps> = ({ onAccepted, onDeclined }) => {
    const [checked, setChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showFull, setShowFull] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        if (!checked) { setError('You must check the box to continue'); return; }
        setSubmitting(true); setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/terms/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ accepted: true }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to record acceptance');
            }
            toast.success('Terms accepted — welcome aboard!');
            onAccepted();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecline = () => {
        if (onDeclined) onDeclined();
        else toast.error('You must accept the Terms to use PipTrader AI');
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-amber-500/40 shadow-2xl shadow-amber-500/10 overflow-hidden">
                <div className="relative px-6 py-5 border-b border-slate-700/60 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-600/40">
                            <Scale size={22} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-extrabold text-white">Terms & Conditions</h2>
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 uppercase font-bold tracking-wider">Required</span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-0.5">CALEKYZ DIGITALISED SERVICE ENTERPRISES · Kenya</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4">
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                        <Shield size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[12px] text-blue-200 leading-relaxed">
                            Before you can use PipTrader AI, you must read and accept our Terms & Conditions.
                            Your acceptance is recorded with a timestamp, IP address, and a cryptographic hash
                            for dispute-resolution purposes.
                        </p>
                    </div>
                    <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-amber-200 uppercase tracking-wider mb-1">Key point — Trading risk</div>
                            <p className="text-[11px] text-amber-200/80 leading-relaxed">
                                Trading Forex and CFDs carries a <strong className="text-amber-100">high risk of losing your capital</strong>. Algorithms may malfunction. Past performance does not guarantee future results.
                            </p>
                        </div>
                    </div>
                    {!showFull ? (
                        <button type="button" onClick={() => setShowFull(true)} className="w-full flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 transition group">
                            <div className="flex items-center gap-2">
                                <FileText size={14} className="text-blue-400" />
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition">Read the full Terms & Conditions</span>
                            </div>
                            <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400 transition" />
                        </button>
                    ) : (
                        <div className="bg-slate-950/60 border border-slate-700/40 rounded-xl p-4 max-h-[300px] overflow-y-auto">
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Full text available at <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">/terms</a>. By ticking the box below you agree to all 14 sections including Risk Disclosure and Limitation of Liability.
                            </p>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-slate-700/60 bg-slate-950/60 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="flex-shrink-0 mt-0.5">
                            <input type="checkbox" checked={checked} onChange={(e) => { setChecked(e.target.checked); setError(null); }} className="sr-only" />
                            <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${checked ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 shadow-lg shadow-emerald-500/40' : 'bg-slate-900 border-slate-600 group-hover:border-emerald-400'}`}>
                                {checked && <CheckCircle2 size={16} className="text-white" />}
                            </div>
                        </div>
                        <span className="text-xs text-slate-300 leading-relaxed select-none">
                            I confirm that I am at least <strong className="text-white">18 years old</strong>, that I have <strong className="text-white">read and understood</strong> the Terms & Conditions in full, and that I <strong className="text-white">accept all risks</strong> associated with automated trading.
                        </span>
                    </label>
                    {error && (
                        <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-900/20 border border-rose-500/30 rounded-lg p-2.5">
                            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button type="button" onClick={handleDecline} disabled={submitting} className="sm:flex-1 bg-slate-800/60 hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 font-bold py-3 px-4 rounded-xl text-sm transition disabled:opacity-50">Decline & Log Out</button>
                        <button type="button" onClick={handleAccept} disabled={!checked || submitting} className="sm:flex-[2] bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {submitting ? (<><Loader2 size={16} className="animate-spin" />Recording acceptance...</>) : (<><CheckCircle2 size={16} />I Accept the Terms & Conditions</>)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
