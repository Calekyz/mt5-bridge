import React, { useEffect, useState } from 'react';
import { Scale, Loader2, AlertTriangle, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

interface Section {
    number: string;
    title: string;
    body: string;
}

export const TermsPage: React.FC = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [version, setVersion] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}/terms/content`);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const data = await res.json();
                setSections(data.sections || []);
                setVersion(data.version || '1.0');
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-600/30">
                        <Scale className="text-white" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">Terms & Conditions</h1>
                        <p className="text-slate-400 text-xs mt-0.5">Version {version} · CALEKYZ DIGITALISED SERVICE ENTERPRISES · Kenya</p>
                    </div>
                </div>
                <div className="bg-amber-900/20 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-200 leading-relaxed">By using PipTrader AI, you agree to be bound by these Terms. Trading carries significant risk of capital loss. Read Section 4 (Risk Disclosure) carefully.</p>
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-6 md:p-8">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
                    ) : error ? (
                        <div className="text-center py-8"><div className="text-rose-400 text-sm">Failed to load Terms: {error}</div></div>
                    ) : (
                        <div className="space-y-6">
                            {sections.map((section) => (
                                <div key={section.number}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-blue-500/15 border border-blue-500/30 rounded-lg"><FileText size={12} className="text-blue-400" /></div>
                                        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">{section.number}. {section.title}</h2>
                                    </div>
                                    <p className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-line pl-9">{section.body}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="text-center text-[10px] text-slate-500">
                    © {new Date().getFullYear()} CALEKYZ DIGITALISED SERVICE ENTERPRISES · Registered under the Registrar of Companies, Republic of Kenya
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
