import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Scale, RefreshCw, AlertCircle, Search, X, Download, CheckCircle2, UserCheck, Shield } from 'lucide-react';
import { toast } from 'react-toastify';

interface TermsRow {
    id: number;
    user_id: number;
    email: string;
    terms_version: string;
    accepted_at: string;
    ip_address: string | null;
    user_agent: string | null;
    content_hash: string | null;
    user_account_email: string | null;
}

export const AdminTermsAcceptances: React.FC = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';
    const token = localStorage.getItem('token');

    const [rows, setRows] = useState<TermsRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/terms-acceptances`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load');
            const data = await res.json();
            setRows(data.acceptances || []);
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
            (r.user_account_email || '').toLowerCase().includes(q) ||
            (r.ip_address || '').toLowerCase().includes(q) ||
            String(r.user_id).includes(q) ||
            r.terms_version.toLowerCase().includes(q)
        );
    }, [rows, search]);

    const handleDownloadPdf = async (row: TermsRow) => {
        setDownloading(row.id);
        try {
            const res = await fetch(`${API_URL}/admin/terms-acceptances/${row.id}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate PDF');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `terms-acceptance-${row.id}-${row.email.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(`PDF downloaded for ${row.email}`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-600/20">
                            <Scale className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">
                                Terms Acceptances
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Every recorded acceptance · Legal proof for disputes
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

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-4">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Total Acceptances
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">{rows.length}</div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-4">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Current Version
                        </div>
                        <div className="text-2xl font-bold text-red-400">
                            {rows[0]?.terms_version || '1.0'}
                        </div>
                    </div>
                </div>

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
                                placeholder="Search by email, user ID, IP, or version..."
                                className="w-full bg-slate-950/60 border-2 border-slate-700/60 rounded-xl pl-12 pr-32 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition font-mono"
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

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-red-500/30 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-4">
                                <Scale size={28} className="text-slate-500" />
                            </div>
                            <div className="text-slate-300 font-semibold text-sm mb-1">
                                No acceptances recorded yet
                            </div>
                            <div className="text-[11px] text-slate-500">
                                Records will appear here once users accept the Terms
                            </div>
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-16">
                            <Search size={28} className="text-slate-500 mx-auto mb-3" />
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
                                                <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg">
                                                    <CheckCircle2 size={14} className="text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-white font-bold text-sm break-all">
                                                        {row.email}
                                                    </div>
                                                    <div className="text-slate-500 text-[10px] mt-0.5 flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex items-center gap-1">
                                                            <UserCheck size={9} className="text-red-400" />
                                                            User #{row.user_id}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Shield size={9} className="text-amber-400" />
                                                            v{row.terms_version}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/40">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                                                        Accepted At (UTC)
                                                    </div>
                                                    <div className="text-slate-200 font-mono text-[11px]">
                                                        {new Date(row.accepted_at).toISOString().replace('T', ' ').substring(0, 19)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/40">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                                                        IP Address
                                                    </div>
                                                    <div className="text-slate-200 font-mono text-[11px]">
                                                        {row.ip_address || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={() => handleDownloadPdf(row)}
                                                disabled={downloading === row.id}
                                                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-600 px-3 py-2 rounded-lg border border-amber-500/40 transition disabled:opacity-50"
                                            >
                                                {downloading === row.id ? (
                                                    <div className="w-3 h-3 border-2 border-amber-300/40 border-t-amber-300 rounded-full animate-spin" />
                                                ) : (
                                                    <Download size={12} />
                                                )}
                                                Download PDF
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
                        Each PDF contains the user's email, acceptance timestamp, IP address, and the full
                        Terms & Conditions text with a content hash for integrity verification.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminTermsAcceptances;
