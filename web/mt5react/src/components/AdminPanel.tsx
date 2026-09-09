import React, { useState, useEffect } from 'react';
import { Loader2, UserPlus, Trash2, RefreshCw, AlertCircle, Key, Copy, Check, Server, Mail, Lock, Plus } from 'lucide-react';

// ... (existing interfaces and state)

export const AdminPanel: React.FC = () => {
    // ... existing state

    // ─── Add Client State ─────────────────────────────────
    const [clientEmail, setClientEmail] = useState('');
    const [clientPassword, setClientPassword] = useState('');
    const [clientMt5Login, setClientMt5Login] = useState('');
    const [clientMt5Password, setClientMt5Password] = useState('');
    const [clientMt5Server, setClientMt5Server] = useState('');
    const [clientMt5Port, setClientMt5Port] = useState('443');
    const [addingClient, setAddingClient] = useState(false);
    const [newClientKey, setNewClientKey] = useState<string | null>(null);
    const [clientError, setClientError] = useState<string | null>(null);

    // ─── Handle Add Client ────────────────────────────────
    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientEmail || !clientPassword || !clientMt5Login || !clientMt5Password || !clientMt5Server) {
            setClientError('All fields are required');
            return;
        }
        setAddingClient(true);
        setClientError(null);
        setNewClientKey(null);

        try {
            const res = await fetch(`${API_URL}/admin/client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': ADMIN_KEY,
                },
                body: JSON.stringify({
                    email: clientEmail,
                    password: clientPassword,
                    mt5: {
                        login: parseInt(clientMt5Login),
                        password: clientMt5Password,
                        server: clientMt5Server,
                        port: parseInt(clientMt5Port) || 443,
                    },
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create client');
            }

            const data = await res.json();
            setNewClientKey(data.access_key);
            // Clear form after success
            setClientEmail('');
            setClientPassword('');
            setClientMt5Login('');
            setClientMt5Password('');
            setClientMt5Server('');
            setClientMt5Port('443');
            await loadData(); // refresh users/keys lists
        } catch (err: any) {
            setClientError(err.message);
        } finally {
            setAddingClient(false);
        }
    };

    // ─── Render new section in the JSX ────────────────────
    // (Place this after the "Add User" section and before the "Users Table")

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
            {/* ... header, etc. */}

            {/* ─── Add Client ───────────────────────────────────── */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-400" />
                    Add New Client (MT5 + Key)
                </h2>
                <form onSubmit={handleAddClient} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Email</label>
                            <input
                                type="email"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                placeholder="client@example.com"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Password</label>
                            <input
                                type="text"
                                value={clientPassword}
                                onChange={(e) => setClientPassword(e.target.value)}
                                placeholder="Auto‑generate or set manually"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">MT5 Login (ID)</label>
                            <input
                                type="number"
                                value={clientMt5Login}
                                onChange={(e) => setClientMt5Login(e.target.value)}
                                placeholder="12345678"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">MT5 Password</label>
                            <input
                                type="text"
                                value={clientMt5Password}
                                onChange={(e) => setClientMt5Password(e.target.value)}
                                placeholder="MT5 password"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">MT5 Server</label>
                            <input
                                type="text"
                                value={clientMt5Server}
                                onChange={(e) => setClientMt5Server(e.target.value)}
                                placeholder="MetaQuotes-Demo"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">MT5 Port</label>
                            <input
                                type="number"
                                value={clientMt5Port}
                                onChange={(e) => setClientMt5Port(e.target.value)}
                                placeholder="443"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            />
                        </div>
                    </div>

                    {clientError && (
                        <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                            {clientError}
                        </div>
                    )}

                    {newClientKey && (
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                            <p className="text-emerald-400 text-sm font-semibold">✅ Client created! Access Key:</p>
                            <code className="block mt-2 bg-slate-800 text-white font-mono text-sm px-4 py-2 rounded-lg break-all">
                                {newClientKey}
                            </code>
                            <p className="text-xs text-slate-400 mt-2">Give this key to the client for login.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={addingClient}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {addingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus size={18} />}
                        {addingClient ? 'Creating...' : 'Create Client'}
                    </button>
                </form>
            </div>

            {/* ─── Existing sections (Users, Keys) remain as they are ── */}
            {/* ... */}
        </div>
    );
};
