import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
    onLogin: (data: { login: string; password: string; server: string }) => void;
    isLoading?: boolean;
    error?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading, error }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [server, setServer] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin({ login, password, server });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
            {/* Decorative gradient blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-8 md:p-10 transition-all duration-300 hover:shadow-blue-500/10">
                    {/* Logo / Brand */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-600/20 mb-4">
                            <span className="text-3xl">📊</span>
                        </div>
                        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Master Trading
                        </h1>
                        <p className="text-slate-400 text-sm mt-2 font-light">
                            Connect to your MT5 account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Login
                            </label>
                            <input
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="e.g. 123456"
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
                                Server
                            </label>
                            <input
                                type="text"
                                value={server}
                                onChange={(e) => setServer(e.target.value)}
                                placeholder="e.g. JustMarkets-Demo3"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition duration-200"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-xl p-3 animate-pulse">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
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
