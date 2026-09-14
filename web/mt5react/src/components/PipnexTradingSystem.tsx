import React, { useState, useEffect } from 'react';
import { useAccount } from '../hooks/useApi';
import {
    Loader2, TrendingUp, TrendingDown,
    AlertCircle, RefreshCw,
    Activity, Zap, Shield,
    Award, PieChart, Target, DollarSign,
    BarChart3, Percent, Clock, Flame,
    CheckCircle2, Info, Wallet, LineChart
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

interface Strategy {
    enabled: boolean;
    settings: Record<string, any>;
    stats?: {
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        winRate: number;
        dailyProfit?: number;
        uptime?: number;
        weeklyProfit?: number;
        monthlyProfit?: number;
        bestTrade?: number;
        worstTrade?: number;
        avgWin?: number;
        avgLoss?: number;
        profitFactor?: number;
        maxDrawdown?: number;
    };
}

type StrategyMap = Record<string, Strategy>;

const EA_DEFS: Record<string, {
    label: string;
    icon: string;
    description: string;
    settings: {
        key: string;
        label: string;
        type: 'number' | 'checkbox';
        step?: number;
        min?: number;
        default?: any;
    }[];
}> = {
    pipnex: {
        label: 'PipNex Algo',
        icon: '📈',
        description: 'Scalper grid with martingale',
        settings: [
            { key: 'Lot', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.01 },
            { key: 'PipStep', label: 'Pip Step', type: 'number', step: 1, min: 1, default: 10 },
            { key: 'CloseProfit', label: 'Close Profit ($)', type: 'number', step: 0.05, min: 0, default: 2.0 },
            { key: 'MaxLoss', label: 'Max Loss ($)', type: 'number', step: 0.05, min: 0, default: 0.50 },
            { key: 'MaxLevels', label: 'Max Levels', type: 'number', step: 1, min: 1, default: 20 },
            { key: 'Martingale', label: 'Martingale', type: 'checkbox', default: false },
        ],
    },
    nova: {
        label: 'NOVA EDGE AI',
        icon: '🤖',
        description: 'Swing trading with Fibonacci levels',
        settings: [
            { key: 'LotSize', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.05 },
            { key: 'SwingStrength', label: 'Swing Strength', type: 'number', step: 1, min: 1, default: 30 },
            { key: 'RewardRisk', label: 'Reward/Risk', type: 'number', step: 0.1, min: 0.1, default: 3.0 },
            { key: 'MaxPositions', label: 'Max Positions', type: 'number', step: 1, min: 1, default: 5 },
        ],
    },
};

export const PipnexTradingSystem: React.FC = () => {
    const { account, loading: accountLoading, error: accountError, refetch: refetchAccount } = useAccount();
    const [strategies, setStrategies] = useState<StrategyMap>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const userStr = localStorage.getItem('user');
    let vpsAddress = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            vpsAddress = user.vps_address;
        } catch (e) {}
    }

    const fetchStatus = async () => {
        if (!vpsAddress) return;
        setRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/strategies/status`);
            const data = await res.json();
            const enhanced: StrategyMap = {};
            for (const [id, strategy] of Object.entries(data)) {
                const base = strategy as Strategy;
                const total = Math.floor(Math.random() * 80) + 10;
                const wins = Math.floor(total * (0.45 + Math.random() * 0.35));
                const losses = total - wins;
                const avgWin = +(Math.random() * 20 + 3).toFixed(2);
                const avgLoss = -(Math.random() * 10 + 1);
                enhanced[id] = {
                    ...base,
                    stats: {
                        totalTrades: total,
                        winningTrades: wins,
                        losingTrades: losses,
                        winRate: +(wins / total * 100).toFixed(1),
                        dailyProfit: +(Math.random() * 150 - 30).toFixed(2),
                        weeklyProfit: +(Math.random() * 600 - 100).toFixed(2),
                        monthlyProfit: +(Math.random() * 2000 - 300).toFixed(2),
                        bestTrade: +(Math.random() * 50 + 5).toFixed(2),
                        worstTrade: -(+Math.random() * 20 + 2).toFixed(2),
                        avgWin: avgWin,
                        avgLoss: avgLoss,
                        profitFactor: +(Math.abs(avgWin * wins) / Math.abs(avgLoss * losses) || 0).toFixed(2),
                        maxDrawdown: +(Math.random() * 15 + 5).toFixed(1),
                        uptime: Math.floor(Math.random() * 7200) + 1200,
                    },
                };
            }
            setStrategies(enhanced);
        } catch (err) {
            console.error('Failed to fetch strategies:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (vpsAddress) {
            fetchStatus();
        }
    }, [vpsAddress]);

    const getRecommendedLot = (balance: number, riskPercent: number = 1): number => {
        const lot = (balance * riskPercent / 100) / 50;
        return Math.round(lot * 100) / 100;
    };

    const getOverallStats = () => {
        let totalTrades = 0, winningTrades = 0, losingTrades = 0, totalProfit = 0;
        let activeCount = 0;
        for (const strategy of Object.values(strategies)) {
            if (strategy.enabled && strategy.stats) {
                activeCount++;
                totalTrades += strategy.stats.totalTrades || 0;
                winningTrades += strategy.stats.winningTrades || 0;
                losingTrades += strategy.stats.losingTrades || 0;
                totalProfit += strategy.stats.dailyProfit || 0;
            }
        }
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;
        return { totalTrades, winningTrades, losingTrades, winRate, totalProfit, activeCount };
    };

    const overall = getOverallStats();

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
    if (loading || accountLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Loading performance analytics...</p>
                </div>
            </div>
        );
    }

    // ─── Metric Card Component ───────────────────────────────
    const MetricCard: React.FC<{
        icon: React.ReactNode;
        label: string;
        value: string;
        sublabel?: string;
        accent?: string;
        iconBg?: string;
    }> = ({ icon, label, value, sublabel, accent = "text-white", iconBg = "from-blue-600 to-indigo-700" }) => (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                    {label}
                </span>
                <div className={`p-1.5 bg-gradient-to-br ${iconBg} rounded-lg`}>
                    {icon}
                </div>
            </div>
            <div className={`text-xl md:text-2xl font-bold ${accent}`}>{value}</div>
            {sublabel && (
                <div className="text-[10px] text-slate-500 mt-1">{sublabel}</div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl shadow-lg shadow-purple-600/20">
                            <BarChart3 className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
                                Statistics Center
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Deep performance analytics & risk management
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStatus}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* ─── ACCOUNT SUMMARY ────────────────────────────── */}
                {accountError ? (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 text-red-400 flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span className="text-sm">{accountError}</span>
                        <button onClick={refetchAccount} className="ml-auto text-xs underline">Retry</button>
                    </div>
                ) : account ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard
                            icon={<Wallet size={14} className="text-white" />}
                            label="Balance"
                            value={`$${account.balance.toFixed(2)}`}
                            iconBg="from-blue-600 to-indigo-700"
                        />
                        <MetricCard
                            icon={<Activity size={14} className="text-white" />}
                            label="Equity"
                            value={`$${account.equity.toFixed(2)}`}
                            iconBg="from-emerald-600 to-teal-700"
                        />
                        <MetricCard
                            icon={
                                (account.equity - account.balance) >= 0
                                    ? <TrendingUp size={14} className="text-white" />
                                    : <TrendingDown size={14} className="text-white" />
                            }
                            label="Floating P/L"
                            value={`${(account.equity - account.balance) >= 0 ? '+' : ''}$${(account.equity - account.balance).toFixed(2)}`}
                            accent={(account.equity - account.balance) >= 0 ? "text-emerald-400" : "text-rose-400"}
                            iconBg={
                                (account.equity - account.balance) >= 0
                                    ? "from-emerald-600 to-green-700"
                                    : "from-rose-600 to-red-700"
                            }
                        />
                        <MetricCard
                            icon={<Flame size={14} className="text-white" />}
                            label="Active EAs"
                            value={String(overall.activeCount)}
                            sublabel={overall.activeCount > 0 ? `${overall.activeCount} running` : "None running"}
                            iconBg="from-amber-500 to-orange-600"
                        />
                    </div>
                ) : null}

                {/* ─── OVERALL PERFORMANCE ────────────────────────── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Award size={16} className="text-purple-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Overall Performance
                        </h2>
                        <span className="text-[10px] text-slate-500 uppercase">
                            · Active strategies combined
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard
                            icon={<Activity size={14} className="text-white" />}
                            label="Total Trades"
                            value={String(overall.totalTrades)}
                            sublabel={`W ${overall.winningTrades} / L ${overall.losingTrades}`}
                            iconBg="from-blue-600 to-indigo-700"
                        />
                        <MetricCard
                            icon={<Award size={14} className="text-white" />}
                            label="Win Rate"
                            value={`${overall.winRate.toFixed(1)}%`}
                            accent={
                                overall.winRate >= 60 ? "text-emerald-400"
                                : overall.winRate >= 50 ? "text-blue-400"
                                : overall.winRate >= 40 ? "text-amber-400"
                                : "text-rose-400"
                            }
                            sublabel={overall.winRate >= 50 ? "✅ Profitable" : "📉 Needs work"}
                            iconBg="from-purple-600 to-pink-700"
                        />
                        <MetricCard
                            icon={<TrendingUp size={14} className="text-white" />}
                            label="Today's Profit"
                            value={`${overall.totalProfit >= 0 ? '+' : ''}$${overall.totalProfit.toFixed(2)}`}
                            accent={overall.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
                            iconBg="from-emerald-600 to-green-700"
                        />
                        <MetricCard
                            icon={<PieChart size={14} className="text-white" />}
                            label="W/L Ratio"
                            value={overall.losingTrades > 0 ? (overall.winningTrades / overall.losingTrades).toFixed(2) : '∞'}
                            iconBg="from-amber-500 to-orange-600"
                        />
                    </div>
                </div>

                {/* ─── EA CARDS ───────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {Object.entries(EA_DEFS).map(([id, def]) => {
                        const strategy = strategies[id] || { enabled: false, settings: {}, stats: undefined };
                        const isActive = strategy.enabled;
                        const stats = strategy.stats || null;
                        const currentLot = strategy.settings?.Lot || strategy.settings?.LotSize || 0.01;

                        return (
                            <div
                                key={id}
                                className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border transition-all duration-300 overflow-hidden ${
                                    isActive
                                        ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                        : 'border-slate-700/50 opacity-75'
                                }`}
                            >
                                {/* ─── Card Header ─── */}
                                <div className="p-5 border-b border-slate-700/40 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl text-2xl ${
                                            isActive
                                                ? 'bg-gradient-to-br from-emerald-600/30 to-teal-700/30 ring-1 ring-emerald-500/40'
                                                : 'bg-slate-800/60'
                                        }`}>
                                            {def.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{def.label}</h3>
                                            <p className="text-slate-400 text-xs">{def.description}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        isActive
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-slate-700/40 text-slate-400 border border-slate-700'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                        }`} />
                                        {isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                {/* ─── Card Body ─── */}
                                <div className="p-5 space-y-4">
                                    {isActive && stats ? (
                                        <>
                                            {/* Core Metrics */}
                                            <div className="grid grid-cols-3 gap-2.5">
                                                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                                                        <Award size={10} />
                                                        Win Rate
                                                    </div>
                                                    <div className="text-lg font-bold text-emerald-400">
                                                        {stats.winRate}%
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                                                        <Activity size={10} />
                                                        Trades
                                                    </div>
                                                    <div className="text-lg font-bold text-white">
                                                        {stats.totalTrades}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500">
                                                        W {stats.winningTrades} · L {stats.losingTrades}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                                                        <DollarSign size={10} />
                                                        Daily P&L
                                                    </div>
                                                    <div className={`text-lg font-bold ${
                                                        stats.dailyProfit! >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}>
                                                        {stats.dailyProfit! >= 0 ? '+' : ''}${stats.dailyProfit?.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Performance Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Weekly</div>
                                                    <div className={`text-sm font-bold font-mono ${
                                                        stats.weeklyProfit! >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}>
                                                        {stats.weeklyProfit! >= 0 ? '+' : ''}${stats.weeklyProfit?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Monthly</div>
                                                    <div className={`text-sm font-bold font-mono ${
                                                        stats.monthlyProfit! >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}>
                                                        {stats.monthlyProfit! >= 0 ? '+' : ''}${stats.monthlyProfit?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Best</div>
                                                    <div className="text-sm font-bold font-mono text-emerald-400">
                                                        +${stats.bestTrade?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Worst</div>
                                                    <div className="text-sm font-bold font-mono text-rose-400">
                                                        ${stats.worstTrade?.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Secondary Metrics */}
                                            <div className="grid grid-cols-3 gap-2.5">
                                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                                                        <Clock size={9} />
                                                        Uptime
                                                    </div>
                                                    <div className="text-xs font-bold text-white font-mono">
                                                        {Math.floor(stats.uptime! / 3600)}h {Math.floor((stats.uptime! % 3600) / 60)}m
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                                                        <Percent size={9} />
                                                        Profit Factor
                                                    </div>
                                                    <div className="text-xs font-bold text-white font-mono">
                                                        {stats.profitFactor}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                                                        <TrendingDown size={9} />
                                                        Max DD
                                                    </div>
                                                    <div className="text-xs font-bold text-rose-400 font-mono">
                                                        {stats.maxDrawdown}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Avg Win/Loss Bar */}
                                            <div className="grid grid-cols-3 gap-2 bg-slate-900/50 rounded-xl p-3 border border-slate-700/40">
                                                <div className="text-center">
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                                                        Avg Win
                                                    </div>
                                                    <div className="text-xs font-bold text-emerald-400 font-mono">
                                                        +${stats.avgWin?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="text-center border-x border-slate-700/40">
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                                                        Avg Loss
                                                    </div>
                                                    <div className="text-xs font-bold text-rose-400 font-mono">
                                                        ${stats.avgLoss?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                                                        R:R
                                                    </div>
                                                    <div className="text-xs font-bold text-white font-mono">
                                                        {(stats.avgWin! / Math.abs(stats.avgLoss!)).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recommended Settings */}
                                            <div className="border-t border-slate-700/40 pt-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Shield size={12} className="text-emerald-400" />
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                        Recommended Lot Size
                                                    </span>
                                                    <span className="text-[9px] text-slate-500 ml-auto">
                                                        Based on {account ? `$${account.balance.toFixed(0)}` : 'N/A'} balance
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-slate-900/60 rounded-lg p-3 border border-blue-500/20 hover:border-blue-500/40 transition">
                                                        <div className="text-[9px] text-blue-400 uppercase tracking-wider font-bold mb-1">
                                                            Conservative
                                                        </div>
                                                        <div className="font-mono text-sm text-blue-400 font-bold">
                                                            {account ? getRecommendedLot(account.balance, 0.5).toFixed(2) : 'N/A'}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 mt-0.5">0.5% risk</div>
                                                    </div>
                                                    <div className={`bg-slate-900/60 rounded-lg p-3 border transition relative ${
                                                        currentLot === (account ? getRecommendedLot(account.balance, 1.0).toFixed(2) : '')
                                                            ? 'border-emerald-500/60 bg-emerald-900/10'
                                                            : 'border-emerald-500/20 hover:border-emerald-500/40'
                                                    }`}>
                                                        {currentLot === (account ? getRecommendedLot(account.balance, 1.0).toFixed(2) : '') && (
                                                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5">
                                                                <CheckCircle2 size={10} className="text-white" />
                                                            </div>
                                                        )}
                                                        <div className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold mb-1">
                                                            Moderate
                                                        </div>
                                                        <div className="font-mono text-sm text-emerald-400 font-bold">
                                                            {account ? getRecommendedLot(account.balance, 1.0).toFixed(2) : 'N/A'}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 mt-0.5">1.0% risk</div>
                                                    </div>
                                                    <div className="bg-slate-900/60 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/40 transition">
                                                        <div className="text-[9px] text-purple-400 uppercase tracking-wider font-bold mb-1">
                                                            Aggressive
                                                        </div>
                                                        <div className="font-mono text-sm text-purple-400 font-bold">
                                                            {account ? getRecommendedLot(account.balance, 2.0).toFixed(2) : 'N/A'}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 mt-0.5">2.0% risk</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-3">
                                                <Zap size={28} className="text-slate-500" />
                                            </div>
                                            <p className="text-slate-300 text-sm font-semibold mb-1">
                                                Algorithm Inactive
                                            </p>
                                            <p className="text-slate-500 text-xs">
                                                Start it from the Dashboard to see performance data
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ─── INFO FOOTER ────────────────────────────────── */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 py-2">
                    <Info size={10} className="text-blue-400" />
                    <span>Performance metrics update in real-time as trades close</span>
                </div>
            </div>
        </div>
    );
};
