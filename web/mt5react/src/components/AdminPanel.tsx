import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Loader2, UserPlus, Trash2, RefreshCw, AlertCircle, Key, Copy, Check, Save,
    Users, Shield, Crown, Server, CheckCircle2, XCircle, Search,
    Eye, EyeOff, Sparkles, ChevronLeft, ChevronRight, X, ExternalLink, MailX
} from 'lucide-react';

interface User {
    id: number;
    email: string;
    role: string;
    created_at: string;
    vps_address?: string | null;
}

interface AccessKey {
    id: number;
    key_code: string;
    created_at: string;
    used_by_email: string | null;
    created_by_email: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'my-super-secret-admin-key-2024';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [keys, setKeys] = useState<AccessKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [keyCount, setKeyCount] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Add Client State
    const [clientEmail, setClientEmail] = useState('');
    const [clientPassword, setClientPassword] = useState('');
    const [clientVps, setClientVps] = useState('');
    const [addingClient, setAddingClient] = useState(false);
    const [newClientKey, setNewClientKey] = useState<string | null>(null);
    const [clientError, setClientError] = useState<string | null>(null);
    const [showClientPassword, setShowClientPassword] = useState(false);

    // Inline VPS update state
    const [editingVps, setEditingVps] = useState<{ [key: number]: string }>({});
    const [savingVps, setSavingVps] = useState<{ [key: number]: boolean }>({});
    const [vpsUpdateMessage, setVpsUpdateMessage] = useState<string | null>(null);

    // Search
    const [userSearch, setUserSearch] = useState('');
    const [keySearch, setKeySearch] = useState('');

    // Pagination
    const [userPage, setUserPage] = useState(1);
    const [userPageSize, setUserPageSize] = useState(25);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 'X-Admin-Key': ADMIN_KEY }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Failed to fetch users');
            }
            const data = await res.json();
            setUsers(data);
            const initialEdit: { [key: number]: string } = {};
            data.forEach((u: User) => { initialEdit[u.id] = u.vps_address || ''; });
            setEditingVps(initialEdit);
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        }
    };

    const fetchKeys = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/keys`, {
                headers: { 'X-Admin-Key': ADMIN_KEY }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Failed to fetch keys');
            }
            const data = await res.json();
            setKeys(data);
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        await Promise.all([fetchUsers(), fetchKeys()]);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => { setUserPage(1); }, [userSearch, userPageSize]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail || !newPassword) return;
        setIsAdding(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
                body: JSON.stringify({ email: newEmail, password: newPassword })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Failed to add user');
            }
            setNewEmail('');
            setNewPassword('');
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        setIsDeleting(id);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Key': ADMIN_KEY }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Failed to delete user');
            }
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setIsDeleting(null);
        }
    };

    const generateKeys = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/admin/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
                body: JSON.stringify({ count: keyCount })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Failed to generate keys');
            }
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!window.confirm('Delete this key?')) return;
        try {
            const res = await fetch(`${API_URL}/admin/keys/${id}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Key': ADMIN_KEY }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Failed to delete key');
            }
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        }
    };

    const copyToClipboard = (key: string) => {
        navigator.clipboard.writeText(key).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = key;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        });
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientEmail || !clientPassword) {
            setClientError('Email and password are required');
            return;
        }
        setAddingClient(true);
        setClientError(null);
        setNewClientKey(null);
        try {
            const res = await fetch(`${API_URL}/admin/client`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
                body: JSON.stringify({
                    email: clientEmail,
                    password: clientPassword,
                    vps_address: clientVps || null,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Failed to create client');
            }
            const data = await res.json();
            setNewClientKey(data.access_key);
            setClientEmail('');
            setClientPassword('');
            setClientVps('');
            await loadData();
        } catch (err: any) {
            let msg = 'Unknown error';
            if (err.message) msg = err.message;
            else if (err.error) msg = err.error;
            else if (typeof err === 'string') msg = err;
            setClientError(msg);
        } finally {
            setAddingClient(false);
        }
    };

    const handleVpsChange = (userId: number, value: string) => {
        setEditingVps(prev => ({ ...prev, [userId]: value }));
    };

    const handleVpsSave = async (userId: number) => {
        const vpsAddress = editingVps[userId];
        const user = users.find(u => u.id === userId);
        if (!user) return;
        setSavingVps(prev => ({ ...prev, [userId]: true }));
        setError(null);
        setVpsUpdateMessage(null);
        try {
            const res = await fetch(`${API_URL}/admin/client/vps`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
                body: JSON.stringify({ email: user.email, vps_address: vpsAddress }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Failed to update VPS');
            }
            setVpsUpdateMessage('VPS updated for ' + user.email);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, vps_address: vpsAddress } : u));
            setEditingVps(prev => ({ ...prev, [userId]: vpsAddress }));
        } catch (err: any) {
            let msg = 'Unknown error';
            if (err.message) msg = err.message;
            else if (err.error) msg = err.error;
            else if (typeof err === 'string') msg = err;
            setError(msg);
        } finally {
            setSavingVps(prev => ({ ...prev, [userId]: false }));
            setTimeout(() => setVpsUpdateMessage(null), 3000);
        }
    };

    const stats = useMemo(() => {
        const totalUsers = users.length;
        const admins = users.filter(u => u.role === 'admin').length;
        const withVps = users.filter(u => u.vps_address).length;
        const totalKeys = keys.length;
        const usedKeys = keys.filter(k => k.used_by_email).length;
        const unusedKeys = totalKeys - usedKeys;
        return { totalUsers, admins, withVps, totalKeys, usedKeys, unusedKeys };
    }, [users, keys]);

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u =>
            u.email.toLowerCase().includes(q) ||
            String(u.id).includes(q) ||
            (u.vps_address || '').toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        );
    }, [users, userSearch]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
    const safePage = Math.min(userPage, totalPages);
    const paginatedUsers = useMemo(() => {
        const start = (safePage - 1) * userPageSize;
        return filteredUsers.slice(start, start + userPageSize);
    }, [filteredUsers, safePage, userPageSize]);

    const filteredKeys = keySearch
        ? keys.filter(k =>
            k.key_code.toLowerCase().includes(keySearch.toLowerCase()) ||
            (k.used_by_email || '').toLowerCase().includes(keySearch.toLowerCase())
        )
        : keys;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Loading admin data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl shadow-lg shadow-purple-600/20">
                            <Crown className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
                                Admin Panel
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Manage users, VPS assignments & access keys
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            to="/admin/mt5-details"
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Key size={16} />
                            <span>User MT5 Details</span>
                            <ExternalLink size={12} className="opacity-70" />
                        </Link>
                        <Link
                            to="/admin/unsubscribes"
                            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-500 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <MailX size={16} />
                            <span>Unsubscribed</span>
                            <ExternalLink size={12} className="opacity-70" />
                        </Link>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* QUICK STATS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Total Users</span>
                            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                                <Users size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{stats.admins} admin{stats.admins !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">VPS Assigned</span>
                            <div className="p-1.5 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg">
                                <Server size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">{stats.withVps}</div>
                        <div className="text-[10px] text-slate-500 mt-1">of {stats.totalUsers} users</div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Total Keys</span>
                            <div className="p-1.5 bg-gradient-to-br from-purple-600 to-pink-700 rounded-lg">
                                <Key size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.totalKeys}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{stats.usedKeys} used · {stats.unusedKeys} available</div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Available Keys</span>
                            <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                                <Sparkles size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-400">{stats.unusedKeys}</div>
                        <div className="text-[10px] text-slate-500 mt-1">ready to assign</div>
                    </div>
                </div>

                {/* ALERTS */}
                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
                    </div>
                )}
                {vpsUpdateMessage && (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-4 text-emerald-400 text-sm flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        <span>{vpsUpdateMessage}</span>
                    </div>
                )}

                {/* SEARCH BAR */}
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl border border-slate-700/50 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                            <Search size={14} className="text-white" />
                        </div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Find User
                        </h2>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Search by email, ID, VPS, or role
                        </span>
                    </div>

                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Type an email, ID, VPS address or role (admin/user)..."
                            className="w-full bg-slate-950/60 border-2 border-slate-700/60 rounded-xl pl-12 pr-32 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition font-mono"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                                userSearch
                                    ? filteredUsers.length > 0
                                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                    : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
                            }`}>
                                {userSearch ? `${filteredUsers.length} match${filteredUsers.length !== 1 ? 'es' : ''}` : `${stats.totalUsers} total`}
                            </span>
                        </div>
                        {userSearch && (
                            <button
                                onClick={() => setUserSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-white bg-slate-800/60 hover:bg-rose-500/20 rounded-lg transition"
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {!userSearch && (
                        <div className="mt-2.5 flex flex-wrap gap-2 text-[10px]">
                            <span className="text-slate-500 uppercase tracking-wider font-semibold">Try:</span>
                            {['@gmail.com', 'admin', 'http://', '1500'].map((hint) => (
                                <button
                                    key={hint}
                                    onClick={() => setUserSearch(hint)}
                                    className="px-2 py-0.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 rounded-md font-mono transition"
                                >
                                    {hint}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ADD NEW CLIENT */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/40 flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                            <UserPlus size={16} className="text-white" />
                        </div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Add New Client</h2>
                        <span className="text-[10px] text-slate-500 ml-auto">Creates user + assigns VPS + generates key</span>
                    </div>

                    <form onSubmit={handleAddClient} className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Email Address</label>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    placeholder="client@example.com"
                                    className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Password</label>
                                <div className="relative">
                                    <input
                                        type={showClientPassword ? "text" : "password"}
                                        value={clientPassword}
                                        onChange={(e) => setClientPassword(e.target.value)}
                                        placeholder="Set a secure password"
                                        className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition font-mono"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowClientPassword(!showClientPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                                    >
                                        {showClientPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold flex items-center gap-1.5">
                                <Server size={10} />
                                VPS Address
                                <span className="text-slate-600 normal-case tracking-normal">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={clientVps}
                                onChange={(e) => setClientVps(e.target.value)}
                                placeholder="http://51.75.104.231:8890"
                                className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition font-mono"
                            />
                        </div>

                        {clientError && (
                            <div className="text-rose-400 text-xs bg-rose-900/20 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2">
                                <XCircle size={14} />
                                {clientError}
                            </div>
                        )}

                        {newClientKey && (
                            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-500/40 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                    <p className="text-emerald-300 text-sm font-bold">Client created successfully!</p>
                                </div>
                                <div className="bg-slate-950/60 rounded-lg p-3 border border-emerald-500/20">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Access Key</div>
                                    <code className="block text-emerald-400 font-mono text-sm break-all">{newClientKey}</code>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(newClientKey)}
                                    className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
                                >
                                    {copiedKey === newClientKey ? (
                                        <>
                                            <Check size={14} />
                                            Copied to clipboard!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            Copy Access Key
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-slate-500 mt-2 text-center">
                                    Send this key to the client — they'll need it to log in.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={addingClient}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {addingClient ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Create Client
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ADD USER */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/40 flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg">
                            <UserPlus size={16} className="text-white" />
                        </div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Add User Only</h2>
                        <span className="text-[10px] text-slate-500 ml-auto">Assign VPS separately below</span>
                    </div>

                    <form onSubmit={handleAddUser} className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Email</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isAdding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={16} />
                                        Add User
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* USERS TABLE */}
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-700/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                                <Users size={14} className="text-white" />
                            </div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">All Users</h2>
                            <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                                {filteredUsers.length === users.length
                                    ? `${users.length}`
                                    : `${filteredUsers.length} / ${users.length}`}
                            </span>
                            {userSearch && (
                                <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                                    <Search size={9} />
                                    Filtered
                                    <button onClick={() => setUserSearch('')} className="hover:text-white">
                                        <X size={9} />
                                    </button>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                Per page
                            </label>
                            <select
                                value={userPageSize}
                                onChange={(e) => setUserPageSize(Number(e.target.value))}
                                className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition cursor-pointer"
                                style={{ colorScheme: 'dark' }}
                            >
                                {PAGE_SIZE_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/60 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">VPS Address</th>
                                    <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user, idx) => {
                                    const currentVps = editingVps[user.id] || '';
                                    const isPending = !currentVps && !user.vps_address;
                                    const isAdminRow = user.role === 'admin';
                                    const isSelf = user.email === 'caleborenge8@gmail.com';

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`border-t border-slate-700/20 hover:bg-slate-800/40 transition-colors ${
                                                idx % 2 === 0 ? "bg-slate-900/20" : ""
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-slate-300 bg-slate-800/60 px-2 py-1 rounded">
                                                    #{user.id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium truncate max-w-[200px]">
                                                        {user.email}
                                                    </span>
                                                    {isSelf && (
                                                        <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase font-bold">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                    isAdminRow
                                                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                                        : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                                                }`}>
                                                    {isAdminRow ? <Crown size={10} /> : <Shield size={10} />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 min-w-[260px]">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={currentVps}
                                                        onChange={(e) => handleVpsChange(user.id, e.target.value)}
                                                        placeholder={isPending ? "Pending..." : "Enter VPS URL"}
                                                        className={`flex-1 bg-slate-900/60 border rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                                                            isPending
                                                                ? 'border-amber-500/40 text-amber-400 placeholder-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30'
                                                                : 'border-slate-600/60 focus:border-blue-500 focus:ring-blue-500/30'
                                                        }`}
                                                    />
                                                    <button
                                                        onClick={() => handleVpsSave(user.id)}
                                                        disabled={savingVps[user.id]}
                                                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                                                        title="Save VPS address"
                                                    >
                                                        {savingVps[user.id] ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Save size={13} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isSelf ? (
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-slate-600 border border-slate-700/40 cursor-not-allowed"
                                                        title="You cannot delete your own account"
                                                    >
                                                        <Trash2 size={13} />
                                                        Delete
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={isDeleting === user.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/40 hover:border-rose-500/60 shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete user"
                                                    >
                                                        {isDeleting === user.id ? (
                                                            <>
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 size={13} />
                                                                Delete
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-16 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-3">
                                                <Search size={28} className="text-slate-500" />
                                            </div>
                                            <div className="text-slate-300 text-sm font-semibold mb-1">
                                                {userSearch ? 'No users found' : 'No users yet'}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {userSearch
                                                    ? <>No matches for "<span className="text-white font-mono">{userSearch}</span>"</>
                                                    : 'Create your first client using the form above'}
                                            </div>
                                            {userSearch && (
                                                <button
                                                    onClick={() => setUserSearch('')}
                                                    className="mt-4 inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                                >
                                                    <X size={12} />
                                                    Clear search
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length > 0 && (
                        <div className="px-5 py-3 bg-slate-900/40 border-t border-slate-700/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-xs text-slate-500">
                                Showing{' '}
                                <span className="text-white font-semibold">
                                    {(safePage - 1) * userPageSize + 1}
                                </span>
                                {' '}–{' '}
                                <span className="text-white font-semibold">
                                    {Math.min(safePage * userPageSize, filteredUsers.length)}
                                </span>
                                {' '}of{' '}
                                <span className="text-white font-semibold">
                                    {filteredUsers.length}
                                </span>
                                {' '}user{filteredUsers.length !== 1 ? 's' : ''}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setUserPage(1)}
                                    disabled={safePage <= 1}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    «
                                </button>

                                <button
                                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                                    disabled={safePage <= 1}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={12} />
                                    Prev
                                </button>

                                <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
                                    <span className="text-xs text-slate-500">Page</span>
                                    <span className="text-xs font-bold text-white font-mono">{safePage}</span>
                                    <span className="text-xs text-slate-500">/</span>
                                    <span className="text-xs font-mono text-slate-400">{totalPages}</span>
                                </div>

                                <button
                                    onClick={() => setUserPage(p => Math.min(totalPages, p + 1))}
                                    disabled={safePage >= totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight size={12} />
                                </button>

                                <button
                                    onClick={() => setUserPage(totalPages)}
                                    disabled={safePage >= totalPages}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Last page"
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ACCESS KEYS */}
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/40">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-br from-purple-600 to-pink-700 rounded-lg">
                                    <Key size={14} className="text-white" />
                                </div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Access Keys</h2>
                                <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                                    {filteredKeys.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={keySearch}
                                        onChange={(e) => setKeySearch(e.target.value)}
                                        placeholder="Search keys..."
                                        className="w-44 bg-slate-900/60 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition"
                                    />
                                </div>

                                <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-700/60 rounded-lg px-2 py-1">
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={keyCount}
                                        onChange={(e) => setKeyCount(parseInt(e.target.value) || 1)}
                                        className="w-12 bg-transparent text-white text-xs text-center focus:outline-none font-mono"
                                    />
                                </div>

                                <button
                                    onClick={generateKeys}
                                    disabled={generating}
                                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {generating ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Sparkles size={12} />
                                    )}
                                    {generating ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/60 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Code</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Created</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKeys.map((key, idx) => {
                                    const isCopied = copiedKey === key.key_code;
                                    const isUsed = !!key.used_by_email;
                                    return (
                                        <tr
                                            key={key.id}
                                            className={`border-t border-slate-700/20 hover:bg-slate-800/40 transition-colors ${
                                                idx % 2 === 0 ? "bg-slate-900/20" : ""
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <code className="font-mono text-xs text-white bg-slate-800/60 px-2 py-1 rounded border border-slate-700/40 select-all">
                                                        {key.key_code}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(key.key_code)}
                                                        className="text-slate-500 hover:text-white transition p-1"
                                                        title="Copy key"
                                                    >
                                                        {isCopied ? (
                                                            <Check size={13} className="text-emerald-400" />
                                                        ) : (
                                                            <Copy size={13} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                                {new Date(key.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {isUsed ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                                                            <CheckCircle2 size={10} />
                                                            Used
                                                        </span>
                                                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                                                            {key.used_by_email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                                                        <Sparkles size={10} />
                                                        Available
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteKey(key.id)}
                                                    disabled={isUsed}
                                                    className="inline-flex items-center justify-center w-8 h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                                                    title={isUsed ? "Cannot delete — key is in use" : "Delete key"}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredKeys.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-3">
                                                <Key size={28} className="text-slate-500" />
                                            </div>
                                            <div className="text-slate-400 text-sm">
                                                {keySearch ? 'No keys match your search' : 'No keys generated yet'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                Click "Generate" above to create new access keys
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminPanel;
