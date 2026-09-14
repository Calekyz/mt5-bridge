import React, { useState, useEffect } from 'react';
import {
    User, Wallet, TrendingUp, TrendingDown, Server, Award,
    Activity, Building2, Percent, RefreshCw, AlertCircle,
    Shield, Zap, DollarSign, BarChart3, Globe
} from 'lucide-react';
import { getAccount, type Account } from '../api/nodejsApiClient';

const AccountInfo: React.FC = () => {
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const userStr = localStorage.getItem('user');
    let vpsAddress = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            vpsAddress = user.vps_address;
        } catch (e) {}
    }

    const fetchAccount = async (silent = false) => {
        if (!vpsAddress) return;
        try {
            if (!silent) setRefreshing(true);
            const data = await getAccount();
            setAccount(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err: any) {
            if (!silent) setError(err.message || "Failed to fetch account");
        } finally {
            setLoading(false);
            if (!silent) setRefreshing(false);
        }
    };

    // Poll every 1 second (was 2s)
    useEffect(() => {
        if (!vpsAddress) return;

        fetchAccount();
        const interval = setInterval(() => fetchAccount(true), 1000);
        return () => clearInterval(interval);
    }, [vpsAddress]);

    // ─── EA Not Configured ───────────────────────────────────
    if (!vpsAddress) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-6">
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 max-w-md text-center">
                    <AlertCircle size={40} className="text-yellow-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-white mb-2">EA Not Configured</h2>
                    <p className="text-slate-400 text-sm">
                        Please contact the administrator to set up your VPS and EA configuration.
                    </p>
                </div>
            </div>
        );
    }

    // ─── Loading State ───────────────────────────────────────
    if (loading && !account) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Loading account info...</p>
                </div>
            </div>
        );
    }

    // ─── Error State ─────────────────────────────────────────
    if (error && !account) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-6">
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl px-8 py-6 max-w-md text-center">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                    <p className="text-red-300 font-bold mb-1">Error Loading Account</p>
                    <p className="text-red-400/70 text-sm mb-4">{error}</p>
                    <button
                        onClick={() => fetchAccount()}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!account) return null;

    // ─── Computed: Floating P/L ──────────────────────────────
    const floatingProfit = (account.equity || 0) - (account.balance || 0);
    const isProfit = floatingProfit >= 0;
    const profitPercent = account.balance > 0
        ? (floatingProfit / account.balance) * 100
        : 0;

    // ─── Account Info Row Component ──────────────────────────
    const InfoCard: React.FC<{
        icon: React.ReactNode;
        label: string;
        value: string | number;
        accent?: string;
        mono?: boolean;
    }> = ({ icon, label, value, accent = "text-white", mono = false }) => (
        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/40 hover:border-slate-600/60 transition-all">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
                <span className="text-slate-500">{icon}</span>
                {label}
            </div>
            <div className={`text-lg md:text-xl font-bold ${accent} ${mono ? 'font-mono' : ''} truncate`}>
                {value}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <User className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                                Account Information
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Live account details · Auto-refresh every 1s
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                Updated {lastUpdated.toLocaleTimeString()}
                            </div>
                        )}
                        <button
                            onClick={() => fetchAccount()}
                            disabled={refreshing}
                            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* ─── BIG BALANCE / EQUITY CARD ──────────────────── */}
                <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-950/80 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Balance */}
                        <div>
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                                <Wallet size={14} className="text-blue-400" />
                                Account Balance
                            </div>
                            <div className="text-4xl md:text-5xl font-black text-white font-mono tracking-tight">
                                ${account.balance?.toFixed(2)}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                Money from closed trades
                            </div>
                        </div>

                        {/* Equity */}
                        <div>
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                                <Activity size={14} className="text-emerald-400" />
                                Account Equity
                            </div>
                            <div className="text-4xl md:text-5xl font-black text-white font-mono tracking-tight">
                                ${account.equity?.toFixed(2)}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs">
                                {isProfit ? (
                                    <TrendingUp size={12} className="text-emerald-400" />
                                ) : (
                                    <TrendingDown size={12} className="text-rose-400" />
                                )}
                                <span className={isProfit ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                                    {isProfit ? "+" : ""}${floatingProfit.toFixed(2)} ({profitPercent.toFixed(2)}%)
                                </span>
                                <span className="text-slate-500">floating</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Status Footer */}
                    <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-700/40 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            Live · updates every 1 second
                        </span>
                        <span className="flex items-center gap-2">
                            <Zap size={11} className="text-yellow-400" />
                            Connected via {account.server || "Broker"}
                        </span>
                    </div>
                </div>

                {/* ─── ACCOUNT DETAILS GRID ───────────────────────── */}
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-700/40 flex items-center gap-2">
                        <Shield size={14} className="text-blue-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Account Details
                        </h2>
                    </div>

                    <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoCard
                            icon={<Award size={12} />}
                            label="Login"
                            value={account.login || "—"}
                            mono
                        />
                        <InfoCard
                            icon={<User size={12} />}
                            label="Account Name"
                            value={account.name || "—"}
                        />
                        <InfoCard
                            icon={<Building2 size={12} />}
                            label="Broker Server"
                            value={account.server || "—"}
                            mono
                        />
                        <InfoCard
                            icon={<Percent size={12} />}
                            label="Leverage"
                            value={account.leverage ? `1:${account.leverage}` : "N/A"}
                            mono
                        />
                        <InfoCard
                            icon={<DollarSign size={12} />}
                            label="Currency"
                            value={account.currency || "USD"}
                            accent="text-amber-400"
                        />
                        <InfoCard
                            icon={<BarChart3 size={12} />}
                            label="Trade Mode"
                            value={
                                account.trade_mode === 0 ? "Demo"
                                : account.trade_mode === 1 ? "Contest"
                                : account.trade_mode === 2 ? "Real"
                                : "N/A"
                            }
                            accent={
                                account.trade_mode === 2 ? "text-rose-400"
                                : account.trade_mode === 0 ? "text-blue-400"
                                : "text-slate-300"
                            }
                        />
                    </div>
                </div>

                {/* ─── QUICK SUMMARY STRIP ────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Profit Status */}
                    <div className={`rounded-2xl p-4 border ${
                        isProfit
                            ? 'bg-gradient-to-br from-emerald-900/30 to-slate-900/60 border-emerald-500/30'
                            : 'bg-gradient-to-br from-rose-900/30 to-slate-900/60 border-rose-500/30'
                    }`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                Floating Status
                            </span>
                            {isProfit ? (
                                <TrendingUp size={16} className="text-emerald-400" />
                            ) : (
                                <TrendingDown size={16} className="text-rose-400" />
                            )}
                        </div>
                        <div className={`text-xl font-bold ${
                            isProfit ? "text-emerald-400" : "text-rose-400"
                        }`}>
                            {isProfit ? "In Profit" : "In Loss"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {isProfit ? "Account is up" : "Account is down"} on open trades
                        </div>
                    </div>

                    {/* Server Status */}
                    <div className="rounded-2xl p-4 border bg-gradient-to-br from-blue-900/30 to-slate-900/60 border-blue-500/30">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                Connection
                            </span>
                            <Globe size={16} className="text-blue-400" />
                        </div>
                        <div className="text-xl font-bold text-blue-400">
                            {account.server ? "Connected" : "Unknown"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate">
                            {account.server || "Server not detected"}
                        </div>
                    </div>

                    {/* Platform */}
                    <div className="rounded-2xl p-4 border bg-gradient-to-br from-purple-900/30 to-slate-900/60 border-purple-500/30">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                Platform
                            </span>
                            <Server size={16} className="text-purple-400" />
                        </div>
                        <div className="text-xl font-bold text-purple-400">
                            MetaTrader 5
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Live data feed
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountInfo;
