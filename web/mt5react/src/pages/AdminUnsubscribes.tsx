import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    MailX, RefreshCw, Trash2, AlertCircle, Search, X, Mail,
    MessageSquare, UserCheck, Users,
} from 'lucide-react';
import { toast } from 'react-toastify';

interface UnsubRow {
    id: number;
    email: string;
    reason: string | null;
    unsubscribed_at: string;
    user_id: number | null;
    user_account_email: string | null;
}

export const AdminUnsubscribes: React.FC = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';
    const token = localStorage.getItem('token');

    const [rows, setRows] = useState<UnsubRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/unsubscribes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load');
            const data = await res.json();
            setRows(data.unsubscribes || []);
        } catch (err: any) {
            toast.error('Failed to load: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL, token]);

    useEffect(() => { loadRows(); }, [loadRows]);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) =>
            r.email.toLowerCase().includes(q) ||
            (r.reason || '').toLowerCase().includes(q) ||
            (r.user_account_email || '').toLowerCase().includes(q) ||
            String(r.user_id || '').includes(q)
        );
    }, [rows, search]);

    const handleRestore = async (row: UnsubRow) => {
        if (!confirm(`Restore email subscription for ${row.email}?\n\nThey will start receiving emails again.`)) return;
        setRestoringId(row.id);
        try {
            const res = await fetch(`${API_URL}/admin/unsubscribes/${row.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to restore');
            toast.success(`Restored ${row.email}`);
            setRows(prev => prev.filter(r => r.id !== row.id));
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setRestoringId(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Email copied');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-rose-600 to-pink-700 rounded-xl shadow-lg shadow-rose-600/20">
                            <MailX className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-rose-100 to-pink-200 bg-clip-text text-transparent">
                                Unsubscribed Emails
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Users who opted out of marketing emails · Admin view
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

                {/* Stats bar */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-4">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Total Unsubscribed
                        </div>
                        <div className="text-2xl font-bold text-rose-400">{rows.length}</div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-4">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Linked to Accounts
                        </div>
                        <div className="text-2xl font-bold text-blue-400">
                            {rows.filter(r => r.user_id).length}
                        </div>
                    </div>
                </div>

                {/* Search */}
                {rows.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-4">
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by email, reason, or user ID..."
                                className="w-full bg-slate-950/60 border-2 border-slate-700/60 rounded-xl pl-12 pr-32 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition font-mono"
                                autoComplete="off"
                                spellCheck={false}
                            />
                            <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                                    search
                                        ? filteredRows.length > 0
                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                        : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
                                }`}>
                                    {search ? `${filteredRows.length} match${filteredRows.length !== 1 ? 'es' : ''}` : `${rows.length} total`}
                                </span>
                            </div>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-white bg-slate-800/60 hover:bg-rose-500/20 rounded-lg transition"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-4">
                                <MailX size={28} className="text-slate-500" />
                            </div>
                            <div className="text-slate-300 font-semibold text-sm mb-1">
                                No unsubscribes yet
                            </div>
                            <div className="text-[11px] text-slate-500">
                                Everyone is still opted in to receive emails
                            </div>
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-16">
                            <Search size={28} className="text-slate-500 mx-auto mb-3" />
                            <div className="text-slate-300 font-semibold text-sm mb-1">
                                No matches found
                            </div>
                            <button
                                onClick={() => setSearch('')}
                                className="mt-3 inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                            >
                                <X size={12} />
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700/40">
                            {filteredRows.map((row) => (
                                <div key={row.id} className="p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap mb-3">
                                                <div className="p-2 bg-gradient-to-br from-rose-600 to-pink-700 rounded-lg">
                                                    <Mail size={14} className="text-white" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-white font-bold text-sm break-all">
                                                            {row.email}
                                                        </span>
                                                        <button
                                                            onClick={() => copyToClipboard(row.email)}
                                                            className="text-slate-500 hover:text-blue-400 transition"
                                                            title="Copy email"
                                                        >
                                                            <Mail size={11} />
                                                        </button>
                                                    </div>
                                                    <div className="text-slate-500 text-[10px] mt-0.5">
                                                        {row.user_id ? (
                                                            <span className="inline-flex items-center gap-1">
                                                                <UserCheck size={9} className="text-emerald-400" />
                                                                Linked to user #{row.user_id}
                                                                {row.user_account_email && ` · ${row.user_account_email}`}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Users size={9} className="text-slate-500" />
                                                                No linked user account
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {row.reason && (
                                                <div className="mt-3 bg-slate-900/60 border border-slate-700/40 rounded-lg p-3">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                                                        <MessageSquare size={10} />
                                                        Reason
                                                    </div>
                                                    <p className="text-slate-300 text-xs whitespace-pre-wrap">
                                                        {row.reason}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="text-[10px] text-slate-500 mt-3">
                                                Unsubscribed {new Date(row.unsubscribed_at).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={() => handleRestore(row)}
                                                disabled={restoringId === row.id}
                                                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 px-3 py-2 rounded-lg border border-emerald-500/40 transition disabled:opacity-50"
                                            >
                                                {restoringId === row.id ? (
                                                    <div className="w-3 h-3 border-2 border-emerald-300/40 border-t-emerald-300 rounded-full animate-spin" />
                                                ) : (
                                                    <RefreshCw size={12} />
                                                )}
                                                Restore
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400">
                        Restoring a user removes them from this list — they will start receiving marketing
                        emails again. Users can unsubscribe themselves anytime via the link in any email footer.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminUnsubscribes;
