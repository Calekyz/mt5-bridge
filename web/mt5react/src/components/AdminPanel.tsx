import React, { useState, useEffect } from 'react';
import { Loader2, UserPlus, Trash2, RefreshCw, AlertCircle, Key } from 'lucide-react';

interface User {
    id: number;
    email: string;
    role: string;
    created_at: string;
}

interface AccessKey {
    id: number;
    key_code: string;
    created_at: string;
    used_by_email: string | null;
    created_by_email: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || '';

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

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 'X-Admin-Key': ADMIN_KEY }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch users');
            }
            const data = await res.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const fetchKeys = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/keys`, {
                headers: { 'X-Admin-Key': ADMIN_KEY }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch keys');
            }
            const data = await res.json();
            setKeys(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        await Promise.all([fetchUsers(), fetchKeys()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // ─── Add user ────────────────────────────────────────────
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail || !newPassword) return;
        setIsAdding(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': ADMIN_KEY
                },
                body: JSON.stringify({ email: newEmail, password: newPassword })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add user');
            }
            setNewEmail('');
            setNewPassword('');
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    // ─── Delete user ──────────────────────────────────────────
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
                throw new Error(data.error || 'Failed to delete user');
            }
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(null);
        }
    };

    // ─── Generate keys ───────────────────────────────────────
    const generateKeys = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/admin/keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': ADMIN_KEY
                },
                body: JSON.stringify({ count: keyCount })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate keys');
            }
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    // ─── Delete key ──────────────────────────────────────────
    const handleDeleteKey = async (id: number) => {
        if (!window.confirm('Delete this key?')) return;
        try {
            const res = await fetch(`${API_URL}/admin/keys/${id}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Key': ADMIN_KEY }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete key');
            }
            await loadData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            👥 Admin Panel
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Manage users and access keys
                        </p>
                    </div>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* ─── Add User ───────────────────────────────────── */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <UserPlus size={20} /> Add User
                    </h2>
                    <form onSubmit={handleAddUser} className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Email</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isAdding}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus size={18} />}
                            {isAdding ? 'Adding...' : 'Add User'}
                        </button>
                    </form>
                </div>

                {/* ─── Users Table ───────────────────────────────── */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/30 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                                        <td className="px-6 py-4 text-sm text-white font-mono">#{user.id}</td>
                                        <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-300'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {new Date(user.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user.email !== 'caleborenge8@gmail.com' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={isDeleting === user.id}
                                                    className="text-red-400 hover:text-red-300 transition disabled:opacity-50"
                                                >
                                                    {isDeleting === user.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── Access Keys ────────────────────────────────── */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Key size={20} /> Access Keys
                    </h2>
                    <div className="flex flex-wrap gap-4 items-end mb-4">
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Number of keys</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={keyCount}
                                onChange={(e) => setKeyCount(parseInt(e.target.value) || 1)}
                                className="w-20 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                        <button
                            onClick={generateKeys}
                            disabled={generating}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key size={16} />}
                            {generating ? 'Generating...' : 'Generate Keys'}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-700/30 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs text-slate-400">Key</th>
                                    <th className="px-4 py-2 text-left text-xs text-slate-400">Created</th>
                                    <th className="px-4 py-2 text-left text-xs text-slate-400">Used By</th>
                                    <th className="px-4 py-2 text-right text-xs text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keys.map((key) => (
                                    <tr key={key.id} className="border-b border-slate-700/30">
                                        <td className="px-4 py-2 font-mono text-white text-xs">{key.key_code}</td>
                                        <td className="px-4 py-2 text-slate-400">{new Date(key.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-slate-400">{key.used_by_email || 'Not used'}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button
                                                onClick={() => handleDeleteKey(key.id)}
                                                disabled={!!key.used_by_email}
                                                className="text-red-400 hover:text-red-300 disabled:opacity-30 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {keys.length === 0 && (
                                    <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400">No keys generated.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
