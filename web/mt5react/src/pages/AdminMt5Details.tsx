import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users, RefreshCw, Trash2, Eye, EyeOff, AlertCircle,
    Key, Copy, Search, X,
} from 'lucide-react';
import { toast } from 'react-toastify';

interface AdminMt5Row {
    id: number;
    user_id: number;
    user_email: string;
    label: string | null;
    mt5_login: string;
    mt5_password: string;
    mt5_server: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export const AdminMt5DetailsPage: React.FC = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';
    const token = localStorage.getItem('token');

    const [rows, setRows] = useState<AdminMt5Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});
    const [search, setSearch] = useState('');

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/mt5-details`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load');
            const data = await res.json();
            setRows(data.details || []);
        } catch (err: any) {
            toast.error('Failed to load: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL, token]);

    useEffect(() => { loadRows(); }, [loadRows]);

    // ─── Filter rows by search query ─────────────────────────
    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) =>
            row.user_email.toLowerCase().includes(q) ||
            (row.label || '').toLowerCase().includes(q) ||
            row.mt5_login.toLowerCase().includes(q) ||
            row.mt5_server.toLowerCase().includes(q) ||
            (row.notes || '').toLowerCase().includes(q) ||
            String(row.user_id).includes(q)
        );
    }, [rows, search]);

    const handleRemove = async (row: AdminMt5Row) => {
        if (!confirm(`Remove MT5 details for ${row.user_email}?\nLogin: ${row.mt5_login}\n\nThis cannot be undone.`)) return;
        setRemovingId(row.id);
        try {
            const res = await fetch(`${API_URL}/admin/mt5-details/${row.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: 'Removed by admin' }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to remove');
            toast.success(`Removed MT5 details for ${row.user_email}`);
            setRows(prev => prev.filter(r => r.id !== row.id));
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setRemovingId(null);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg shadow-purple-600/20">
                            <Users className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                                User MT5 Details
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                All submitted MT5 credentials · Admin view
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadRows}
                        disabled={loading}
                        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/*  SEARCH BAR                                     */}
                {/* ═══════════════════════════════════════════════ */}
                {rows.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                                <Search size={14} className="text-white" />
                            </div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                Find User
                            </h2>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                Search by email, login, server, or ID
                            </span>
                        </div>

                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Type an email, MT5 login, server, or user ID..."
                                className="w-full bg-slate-950/60 border-2 border-slate-700/60 rounded-xl pl-12 pr-32 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition font-mono"
                                autoComplete="off"
                                spellCheck={false}
                            />
                            {/* Live count */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span
                                    className={`text-xs font-bold px-2 py-1 rounded-md border ${
                                        search
                                            ? filteredRows.length > 0
                                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                            : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
                                    }`}
                                >
                                    {search
                                        ? `${filteredRows.length} match${filteredRows.length !== 1 ? 'es' : ''}`
                                        : `${rows.length} total`}
                                </span>
                            </div>
                            {/* Clear button */}
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-white bg-slate-800/60 hover:bg-rose-500/20 rounded-lg transition"
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Quick hints */}
                        {!search && (
                            <div className="mt-2.5 flex flex-wrap gap-2 text-[10px]">
                                <span className="text-slate-500 uppercase tracking-wider font-semibold">Try:</span>
                                {['@gmail.com', 'Main', 'ICMarkets', '5123'].map((hint) => (
                                    <button
                                        key={hint}
                                        onClick={() => setSearch(hint)}
                                        className="px-2 py-0.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 rounded-md font-mono transition"
                                    >
                                        {hint}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/*  RESULTS                                        */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={32} className="text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No MT5 details submitted yet.</p>
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-3">
                                <Search size={28} className="text-slate-500" />
                            </div>
                            <div className="text-slate-300 text-sm font-semibold mb-1">
                                No matches found
                            </div>
                            <div className="text-[11px] text-slate-500">
                                No matches for "<span className="text-white font-mono">{search}</span>"
                            </div>
                            <button
                                onClick={() => setSearch('')}
                                className="mt-4 inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                            >
                                <X size={12} />
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700/40">
                            {filteredRows.map((row) => {
                                const isRevealed = !!revealed[row.id];
                                return (
                                    <div key={row.id} className="p-5">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap mb-3">
                                                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                                                        <Key size={14} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-sm">
                                                            {row.user_email}
                                                        </div>
                                                        <div className="text-slate-500 text-[10px]">
                                                            User #{row.user_id}
                                                            {row.label && ` · ${row.label}`}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center justify-between">
                                                            MT5 Login
                                                            <button
                                                                onClick={() => copyToClipboard(row.mt5_login, 'Login')}
                                                                className="text-slate-500 hover:text-blue-400 transition"
                                                            >
                                                                <Copy size={11} />
                                                            </button>
                                                        </div>
                                                        <code className="text-white font-mono text-xs">{row.mt5_login}</code>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center justify-between">
                                                            Password
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => setRevealed(prev => ({ ...prev, [row.id]: !isRevealed }))}
                                                                    className="text-slate-500 hover:text-blue-400 transition"
                                                                >
                                                                    {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => copyToClipboard(row.mt5_password, 'Password')}
                                                                    className="text-slate-500 hover:text-blue-400 transition"
                                                                >
                                                                    <Copy size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <code className="text-white font-mono text-xs">
                                                            {isRevealed ? row.mt5_password : '••••••••••••'}
                                                        </code>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center justify-between">
                                                            Server
                                                            <button
                                                                onClick={() => copyToClipboard(row.mt5_server, 'Server')}
                                                                className="text-slate-500 hover:text-blue-400 transition"
                                                            >
                                                                <Copy size={11} />
                                                            </button>
                                                        </div>
                                                        <code className="text-white font-mono text-xs">{row.mt5_server}</code>
                                                    </div>
                                                </div>

                                                {row.notes && (
                                                    <div className="mt-3 bg-slate-900/60 border border-slate-700/40 rounded-lg p-2.5">
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Notes</div>
                                                        <p className="text-slate-300 text-xs whitespace-pre-wrap">{row.notes}</p>
                                                    </div>
                                                )}

                                                <div className="text-[10px] text-slate-500 mt-3">
                                                    Submitted {new Date(row.created_at).toLocaleString()}
                                                    {' · '}
                                                    Updated {new Date(row.updated_at).toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={() => handleRemove(row)}
                                                    disabled={removingId === row.id}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 px-3 py-2 rounded-lg border border-rose-500/40 transition disabled:opacity-50"
                                                >
                                                    {removingId === row.id ? (
                                                        <div className="w-3 h-3 border-2 border-rose-300/40 border-t-rose-300 rounded-full animate-spin" />
                                                    ) : (
                                                        <Trash2 size={12} />
                                                    )}
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400">
                        Users cannot delete their own MT5 details. Only admins can remove them. All removals are logged in <code className="text-slate-300">admin_audit_log</code>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminMt5DetailsPage;
