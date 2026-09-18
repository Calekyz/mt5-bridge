import React, { useState, useEffect, useCallback } from 'react';
import {
    Key, Server, Save, RefreshCw, AlertCircle, CheckCircle2,
    Eye, EyeOff, Lock, Info, MessageCircle, BarChart3, Pencil, X,
} from 'lucide-react';
import { toast } from 'react-toastify';

const WHATSAPP_NUMBER = '254116081230';
const WHATSAPP_MESSAGE = encodeURIComponent(
    'Hello! I need to update or remove my MT5 details on PipTrader AI.'
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

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

    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<Mt5Details | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    const token = localStorage.getItem('token');

    // ─── Load own details ────────────────────────────────────
    const loadDetails = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/mt5-details`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load details');
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
            toast.error('Failed to load MT5 details: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL, token]);

    // ─── Load chart symbols from VPS ────────────────────────
    const loadSymbols = useCallback(async () => {
        setSymbolsLoading(true);
        setSymbolsError(null);
        try {
            const res = await fetch(`${API_URL}/mt5-details/symbols`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch symbols');
            const data = await res.json();
            setSymbols(data.symbols || []);
            setVpsAddress(data.vps || null);
            setSymbolsError(data.error || null);
            setSymbolsFetchedAt(new Date());
        } catch (err: any) {
            setSymbolsError(err.message);
            setSymbols([]);
        } finally {
            setSymbolsLoading(false);
        }
    }, [API_URL, token]);

    useEffect(() => {
        loadDetails();
        loadSymbols();
    }, [loadDetails, loadSymbols]);

    // ─── Save (create or update) ────────────────────────────
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
                            // ─── FORM (create or edit) ───
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
                            // ─── READ-ONLY VIEW ───
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
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700">
                                <BarChart3 size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Symbols on Chart
                                </h2>
                                <p className="text-slate-500 text-[10px] mt-0.5">
                                    {vpsAddress ? `From VPS · ${vpsAddress}` : 'Waiting for VPS assignment'}
                                    {symbolsFetchedAt && ` · Refreshed ${symbolsFetchedAt.toLocaleTimeString()}`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={loadSymbols}
                            disabled={symbolsLoading}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700/60 transition disabled:opacity-50"
                        >
                            <RefreshCw size={12} className={symbolsLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>

                    <div className="p-5">
                        {symbolsLoading && symbols.length === 0 ? (
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
                    href={WHATSAPP_LINK}
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
