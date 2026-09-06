import React, { useState, useEffect } from 'react';
import { useAccount } from '../hooks/useApi';
import { 
    Loader2, TrendingUp, 
    AlertCircle, RefreshCw, BarChart3, Calendar, 
    Clock, Activity, Zap, Shield, DollarSign, 
    Award, Target, PieChart, Layers 
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

// EA definitions
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
    const [localInputs, setLocalInputs] = useState<Record<string, Record<string, string>>>({});

    const fetchStatus = async () => {
        setRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/strategies/status`);
            const data = await res.json();
            const enhanced: StrategyMap = {};
            for (const [id, strategy] of Object.entries(data)) {
                const base = strategy as Strategy;
                // Simulate realistic stats – replace with real data later
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
            // Init local inputs
            const inputs: Record<string, Record<string, string>> = {};
            for (const [id, strat] of Object.entries(enhanced)) {
                inputs[id] = {};
                const def = EA_DEFS[id];
                if (def) {
                    for (const setting of def.settings) {
                        if (setting.type === 'number') {
                            const val = strat.settings?.[setting.key] ?? setting.default;
                            inputs[id][setting.key] = String(val);
                        }
                    }
                }
            }
            setLocalInputs(inputs);
        } catch (err) {
            console.error('Failed to fetch strategies:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    // ---- Helpers ----
    const getRecommendedLot = (balance: number, riskPercent: number = 1): number => {
        const lot = (balance * riskPercent / 100) / 50; // assume 50 pip stop loss
        return Math.round(lot * 100) / 100;
    };

    const getOverallStats = () => {
        let totalTrades = 0, winningTrades = 0, losingTrades = 0, totalProfit = 0;
        let activeCount = 0;
        for (const [id, strategy] of Object.entries(strategies)) {
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

    if (loading || accountLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
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
                            📊 Statistics Center
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Deep performance analytics and risk management
                        </p>
                    </div>
                    <button
                        onClick={fetchStatus}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Account Summary (minimal) */}
                {accountError ? (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{accountError}</span>
                        <button onClick={refetchAccount} className="ml-auto text-sm underline">Retry</button>
                    </div>
                ) : account ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-xs text-slate-400">Balance</div>
                            <div className="text-xl font-bold text-white">${account.balance.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-xs text-slate-400">Equity</div>
                            <div className="text-xl font-bold text-white">${account.equity.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-xs text-slate-400">Profit</div>
                            <div className={`text-xl font-bold ${(account.equity - account.balance) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${(account.equity - account.balance).toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-xs text-slate-400">Active EAs</div>
                            <div className="text-xl font-bold text-white">{overall.activeCount}</div>
                        </div>
                    </div>
                ) : null}

                {/* Overall Performance Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                        <div className="text-xs text-slate-400 flex items-center gap-1"><Activity size={14} /> Total Trades</div>
                        <div className="text-xl font-bold text-white">{overall.totalTrades}</div>
                    </div>
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                        <div className="text-xs text-slate-400 flex items-center gap-1"><Award size={14} /> Win Rate</div>
                        <div className={`text-xl font-bold ${overall.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            {overall.winRate.toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                        <div className="text-xs text-slate-400 flex items-center gap-1"><TrendingUp size={14} /> Total Profit</div>
                        <div className={`text-xl font-bold ${overall.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${overall.totalProfit.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                        <div className="text-xs text-slate-400 flex items-center gap-1"><PieChart size={14} /> W/L Ratio</div>
                        <div className="text-xl font-bold text-white">
                            {overall.losingTrades > 0 ? (overall.winningTrades / overall.losingTrades).toFixed(2) : '∞'}
                        </div>
                    </div>
                </div>

                {/* EA Performance Cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {Object.entries(EA_DEFS).map(([id, def]) => {
                        const strategy = strategies[id] || { enabled: false, settings: {}, stats: undefined };
                        const isActive = strategy.enabled;
                        const stats = strategy.stats || null;
                        const currentLot = strategy.settings?.Lot || strategy.settings?.LotSize || 0.01;

                        return (
                            <div
                                key={id}
                                className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
                                    isActive
                                        ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg'
                                        : 'border-slate-700/50 opacity-70'
                                }`}
                            >
                                {/* Card Header */}
                                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{def.icon}</span>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{def.label}</h3>
                                            <p className="text-slate-400 text-xs">{def.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-block w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                                        <span className="text-xs text-slate-400">{isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>

                                {/* Stats Body */}
                                <div className="p-6 space-y-4">
                                    {isActive && stats ? (
                                        <>
                                            {/* Quick Metrics */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-slate-400">Win Rate</div>
                                                    <div className="text-lg font-bold text-emerald-400">{stats.winRate}%</div>
                                                </div>
                                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-slate-400">Trades</div>
                                                    <div className="text-lg font-bold text-white">{stats.totalTrades}</div>
                                                    <div className="text-[10px] text-slate-400">W {stats.winningTrades} / L {stats.losingTrades}</div>
                                                </div>
                                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-slate-400">Daily P&L</div>
                                                    <div className={`text-lg font-bold ${stats.dailyProfit! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ${stats.dailyProfit?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-slate-400">Uptime</div>
                                                    <div className="text-lg font-bold text-white">
                                                        {Math.floor(stats.uptime! / 3600)}h {Math.floor((stats.uptime! % 3600) / 60)}m
                                                    </div>
                                                </div>
                                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-slate-400">Profit Factor</div>
                                                    <div className="text-lg font-bold text-white">{stats.profitFactor}</div>
                                                </div>
                                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-slate-400">Max DD</div>
                                                    <div className="text-lg font-bold text-red-400">{stats.maxDrawdown}%</div>
                                                </div>
                                            </div>

                                            {/* Extended Stats */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                                                    <div className="text-xs text-slate-400">Weekly P&L</div>
                                                    <div className={`text-sm font-bold ${stats.weeklyProfit! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ${stats.weeklyProfit?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                                                    <div className="text-xs text-slate-400">Monthly P&L</div>
                                                    <div className={`text-sm font-bold ${stats.monthlyProfit! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ${stats.monthlyProfit?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                                                    <div className="text-xs text-slate-400">Best Trade</div>
                                                    <div className="text-sm font-bold text-green-400">+${stats.bestTrade?.toFixed(2)}</div>
                                                </div>
                                                <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                                                    <div className="text-xs text-slate-400">Worst Trade</div>
                                                    <div className="text-sm font-bold text-red-400">${stats.worstTrade?.toFixed(2)}</div>
                                                </div>
                                            </div>

                                            {/* Avg Win/Loss & Risk/Reward */}
                                            <div className="flex justify-between text-xs text-slate-400 bg-slate-700/20 rounded-lg px-3 py-2">
                                                <span>Avg Win: <span className="text-green-400">+${stats.avgWin?.toFixed(2)}</span></span>
                                                <span>Avg Loss: <span className="text-red-400">${stats.avgLoss?.toFixed(2)}</span></span>
                                                <span>Risk/Reward: <span className="text-white">{(stats.avgWin! / Math.abs(stats.avgLoss!)).toFixed(2)}</span></span>
                                            </div>

                                            {/* Recommended Settings */}
                                            <div className="border-t border-slate-700/50 pt-4">
                                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Shield size={14} /> Recommended Settings
                                                </div>
                                                <div className="bg-slate-700/30 rounded-lg p-3 text-sm">
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div>
                                                            <div className="text-xs text-slate-400">Conservative</div>
                                                            <div className="font-mono text-blue-400">
                                                                {account ? getRecommendedLot(account.balance, 0.5).toFixed(2) : 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-400">Moderate</div>
                                                            <div className="font-mono text-emerald-400">
                                                                {account ? getRecommendedLot(account.balance, 1.0).toFixed(2) : 'N/A'}
                                                            </div>
                                                            {currentLot === (account ? getRecommendedLot(account.balance, 1.0).toFixed(2) : '') && (
                                                                <span className="text-[10px] text-emerald-400">✓ Current</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-400">Aggressive</div>
                                                            <div className="font-mono text-purple-400">
                                                                {account ? getRecommendedLot(account.balance, 2.0).toFixed(2) : 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-2 text-center">
                                                        Based on 0.5%, 1%, 2% risk per trade
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-slate-400">
                                            <Zap size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">This algorithm is currently inactive</p>
                                            <p className="text-xs text-slate-500">Start it from the Dashboard to see performance data</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
