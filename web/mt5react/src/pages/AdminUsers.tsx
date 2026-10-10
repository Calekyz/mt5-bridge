// @ts-nocheck
import { useState, useEffect } from 'react';
import {
  Users, Search, Trash2, AlertTriangle, RefreshCw, Loader2,
  CheckCircle2, XCircle, Server
} from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || '/v1').replace(/\/$/, '');

type Filter = 'all' | 'configured' | 'not_configured';

interface AdminUser {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  plan: string | null;
  paymentStatus: string | null;
  vpsAddress: string | null;
  isConfigured: boolean;
}

function authHeaders() {
  const t = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState<number | null>(null);
  const [bulkActing, setBulkActing] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ filter, q: search }).toString();
      const res = await fetch(`${API}/admin/users/search?${qs}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const deleteOne = async (u: AdminUser) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    setActing(u.id);
    try {
      const res = await fetch(`${API}/admin/users/${u.id}/safe`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed');
      await load();
    } catch (err: any) {
      alert('Delete failed: ' + (err?.message || 'unknown'));
    } finally {
      setActing(null);
    }
  };

  const deleteAllNonAdmin = async () => {
    if (confirmText !== 'DELETE_ALL_USERS') {
      alert('Type DELETE_ALL_USERS in the box below first');
      return;
    }
    if (!confirm(`⚠️ DELETE ${users.length} users permanently? Admin will remain.`)) return;
    setBulkActing(true);
    try {
      const res = await fetch(`${API}/admin/users/bulk/all-non-admin`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ confirm: 'DELETE_ALL_USERS' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Bulk delete failed');
      alert(`✅ Deleted ${data.deleted} users`);
      setConfirmText('');
      await load();
    } catch (err: any) {
      alert('Bulk delete failed: ' + (err?.message || 'unknown'));
    } finally {
      setBulkActing(false);
    }
  };

  const counts = {
    all: users.length,
    configured: users.filter((u) => u.isConfigured).length,
    not_configured: users.filter((u) => !u.isConfigured).length,
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-600 to-pink-700 text-white">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">User Management</h1>
            <p className="text-slate-400 text-xs">Search, filter, and delete users</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-3">
        {(['all', 'configured', 'not_configured'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              filter === f
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {f === 'all' && `All (${counts.all})`}
            {f === 'configured' && `Configured (${counts.configured})`}
            {f === 'not_configured' && `Not Configured (${counts.not_configured})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or VPS address..."
          className="w-full pl-9 pr-24 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Users list */}
      {loading && users.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-slate-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">No users match this filter.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex flex-wrap items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">{u.email}</span>
                  {u.isConfigured ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      <CheckCircle2 size={10} /> Configured
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-700/30 border border-slate-700 px-1.5 py-0.5 rounded">
                      <XCircle size={10} /> Not Configured
                    </span>
                  )}
                  {u.plan && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      {u.plan}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>ID: {u.id}</span>
                  {u.vpsAddress && (
                    <span className="flex items-center gap-1">
                      <Server size={10} /> {u.vpsAddress}
                    </span>
                  )}
                  <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => deleteOne(u)}
                disabled={acting === u.id}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shrink-0"
              >
                {acting === u.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 p-4 rounded-2xl border-2 border-rose-500/40 bg-rose-500/5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="text-rose-400" size={16} />
          <span className="text-sm font-bold text-rose-300 uppercase tracking-wider">Danger Zone</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Delete ALL non-admin users. Your admin account (<strong className="text-white">caleborenge8@gmail.com</strong>) will remain.
          This action cannot be undone.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE_ALL_USERS to confirm"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-rose-500"
          />
          <button
            onClick={deleteAllNonAdmin}
            disabled={bulkActing || confirmText !== 'DELETE_ALL_USERS'}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold"
          >
            {bulkActing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete All Non-Admin
          </button>
        </div>
      </div>
    </div>
  );
}
