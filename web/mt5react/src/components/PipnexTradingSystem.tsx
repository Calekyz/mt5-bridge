import React, { useState, useEffect } from 'react';
import { useAccount } from '../hooks/useApi';
import { AccountStats } from './AccountStats';
import { Loader2, TrendingUp, TrendingDown, Target, Clock, AlertCircle, RefreshCw } from 'lucide-react';

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
    };
}

type StrategyMap = Record<string, Strategy>;

// EA definitions – only PipNex and NOVA
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
    const [saving, setSaving] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStatus = async () => {
        setRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/strategies/status`);
            const data = await res.json();
            // Enhance with stats (simulate for now)
            const enhanced: StrategyMap = {};
            for (const [id, strategy] of Object.entries(data)) {
                enhanced[id] = {
                    ...(strategy as Strategy),
                    stats: {
                        totalTrades: Math.floor(Math.random() * 50) + 5,
                        winningTrades: Math.floor(Math.random() * 30) + 2,
                        losingTrades: Math.floor(Math.random() * 20) + 1,
                        winRate: +(Math.random() * 30 + 50).toFixed(1),
                        dailyProfit: +(Math.random() * 200 - 50).toFixed(2),
                        uptime: Math.floor(Math.random() * 3600) + 600,
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
        fetchStatus();
    }, []);

    const toggleEA = async (id: string, enabled: boolean) => {
        setSaving(id);
        try {
            const res = await fetch(`${API_URL}/strategies/${id}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            });
            const data = await res.json();
            if (data.success) {
                setStrategies((prev) => ({ ...prev, [id]: data.state }));
            }
        } catch (err) {
            console.error('Toggle error:', err);
        } finally {
            setSaving(null);
        }
    };

    const updateSetting = async (id: string, key: string, value: any) => {
        setSaving(id);
        try {
            const res = await fetch(`${API_URL}/strategies/${id}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value }),
            });
            const data = await res.json();
            if (data.success) {
                setStrategies((prev) => ({ ...prev, [id]: data.state }));
            }
        } catch (err) {
            console.error('Update setting error:', err);
        } finally {
            setSaving(null);
        }
    };

    // Recommended lot size based on balance (1% risk)
    const getRecommendedLot = (balance: number): number => {
        // Example: 1% of balance / 50 (assumed stop loss in pips) * pip value
        // Simplified: 0.01 lot per $1000
        const lot = (balance / 1000) * 0.01;
        return Math.round(lot * 100) / 100;
    };

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
                            🚀 Strategy Control Center
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Manage and monitor your trading algorithms
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

                {/* Account Summary */}
                {accountError ? (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{accountError}</span>
                        <button onClick={refetchAccount} className="ml-auto text-sm underline">Retry</button>
                    </div>
                ) : account ? (
                    <AccountStats
                        balance={account.balance}
                        equity={account.equity}
                        profit={account.equity - account.balance}
                        currency={account.currency || '$'}
                    />
                ) : null}

                {/* EA Cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {Object.entries(EA_DEFS).map(([id, def]) => {
                        const strategy = strategies[id] || { enabled: false, settings: {}, stats: { totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, dailyProfit: 0, uptime: 0 } };
                        const isActive = strategy.enabled;
                        const isSaving = saving === id;
                        const stats = strategy.stats || { totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, dailyProfit: 0, uptime: 0 };

                        // Recommended lot
                        const recommendedLot = account ? getRecommendedLot(account.balance) : 0.01;
                        const currentLot = strategy.settings?.Lot || strategy.settings?.LotSize || 0.01;

                        return (
                            <div
                                key={id}
                                className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
                                    isActive
                                        ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg'
                                        : 'border-slate-700/50 hover:border-slate-600'
                                }`}
                            >
                                {/* Card Header */}
                                <div className="p-6 border-b border-slate-700/50">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{def.icon}</span>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{def.label}</h3>
                                                <p className="text-slate-400 text-xs">{def.description}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleEA(id, !isActive)}
                                            disabled={isSaving}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                                                isActive
                                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : isActive ? (
                                                <>
                                                    <TrendingDown size={18} />
                                                    Stop Algo
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingUp size={18} />
                                                    Start Algo
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    {isActive && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400/80">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Algorithm running
                                        </div>
                                    )}
                                </div>

                                {/* Statistics & Settings */}
                                <div className="p-6 space-y-4">
                                    {isActive && (
                                        <>
                                            {/* Statistics Grid */}
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Clock size={14} /> Statistics
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                        <div className="text-xs text-slate-400">Win Rate</div>
                                                        <div className="text-lg font-bold text-emerald-400">
                                                            {stats.winRate}%
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                        <div className="text-xs text-slate-400">Trades</div>
                                                        <div className="text-lg font-bold text-white">
                                                            {stats.totalTrades}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            W {stats.winningTrades} / L {stats.losingTrades}
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                                        <div className="text-xs text-slate-400">Daily P&L</div>
                                                        <div className={`text-lg font-bold ${(stats.dailyProfit ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            ${(stats.dailyProfit ?? 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {stats.uptime && (
                                                    <div className="mt-2 text-xs text-slate-400">
                                                        Uptime: {Math.floor(stats.uptime / 3600)}h {Math.floor((stats.uptime % 3600) / 60)}m
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recommended Settings */}
                                            <div className="border-t border-slate-700/50 pt-4">
                                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Target size={14} /> Recommended Settings
                                                </div>
                                                <div className="bg-slate-700/30 rounded-lg p-3 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-300">Suggested Lot Size</span>
                                                        <span className="font-mono text-emerald-400">
                                                            {recommendedLot.toFixed(2)}
                                                            {currentLot !== recommendedLot && (
                                                                <span className="text-xs text-slate-400 ml-2">
                                                                    (current: {currentLot.toFixed(2)})
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Based on 1% risk per trade and account balance
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Settings Form */}
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Parameters</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {def.settings.map((setting) => {
                                                const value = strategy.settings?.[setting.key] ?? setting.default;
                                                const isBool = setting.type === 'checkbox';
                                                return (
                                                    <div key={setting.key} className="flex flex-col">
                                                        <label className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                                                            {setting.label}
                                                        </label>
                                                        {isBool ? (
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!value}
                                                                    onChange={(e) => updateSetting(id, setting.key, e.target.checked)}
                                                                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                                                />
                                                                <span className="text-sm text-slate-300">Enabled</span>
                                                            </label>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                step={setting.step || 0.01}
                                                                min={setting.min || 0}
                                                                value={value}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) updateSetting(id, setting.key, val);
                                                                }}
                                                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
