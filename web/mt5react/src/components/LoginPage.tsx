import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
    onLogin: (data: { token: string; user: any }) => void;
    isLoading?: boolean;
    error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [server, setServer] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Login failed');
            }

            const data = await res.json();
            onLogin({ token: data.token, user: data.user });
        } catch (err: any) {
            setLocalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                backgroundImage: `url('https://i.postimg.cc/DwvhGhZM/Chat-GPT-Image-Sep-7-2026-02-36-16-AM.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}
        >
            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-6 sm:p-8 md:p-10 transition-all duration-300 hover:shadow-blue-500/10">
                    {/* Logo / Brand */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="flex justify-center mb-4">
                            <img 
                                src="https://i.postimg.cc/4ygqTvHz/Chat-GPT-Image-Sep-7-2026-02-38-09-AM.png" 
                                alt="PipTrader AI Logo" 
                                className="h-20 w-auto"
                            />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            PipTrader AI
                        </h1>
                        <p className="text-slate-400 text-sm mt-2 font-light">
                            Connect to your trading account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition duration-200"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition duration-200 pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Broker Server
                            </label>
                            <input
                                type="text"
                                value={server}
                                onChange={(e) => setServer(e.target.value)}
                                placeholder="e.g. Broker-Server.com"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition duration-200"
                            />
                        </div>

                        {(localError || error) && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-xl p-3 animate-pulse">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <span>{localError || error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading || isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect'
                            )}
                        </button>

                        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                            <span className="hover:text-white cursor-pointer transition">Forgot password?</span>
                            <span className="hover:text-white cursor-pointer transition">Create account</span>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-700/50 pt-4">
                        <span>Secure connection • v2.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
