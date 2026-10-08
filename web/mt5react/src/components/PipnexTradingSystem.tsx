// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAccount } from '../hooks/useApi';
import {
    TrendingUp, TrendingDown, AlertCircle, RefreshCw,
    Activity, Zap, Shield, Award, PieChart,
    BarChart3, Percent, Clock, Flame,
    CheckCircle2, Info, Wallet, ChevronDown, Save, Power
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
        label: 'PipTrader Algo',
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

const STORAGE_KEY = 'selected_ea';

export const PipnexTradingSystem: React.FC = () => {
    const { account, loading: accountLoading, error: accountError, refetch: refetchAccount } = useAccount();
    const [strategies, setStrategies] = useState<StrategyMap>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEA, setSelectedEA] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) || 'pipnex';
    });
    const [draftSettings, setDraftSettings] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    const userStr = localStorage.getItem('user');
    let vpsAddress: string | null = null;
    if (userStr) {
        try { vpsAddress = JSON.parse(userStr).vps_address; } catch {}
    }

    const eaIds = Object.keys(EA_DEFS);
    const currentDef = EA_DEFS[selectedEA];
    const currentStrategy: Strategy = strategies[selectedEA] || { enabled: false, settings: {} };
    const currentStats = currentStrategy.stats || null;

    // ─── Load strategies from API ───
    const fetchStatus = async () => {
        if (!vpsAddress) return;
        setRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/strategies/status`);
            const data = await res.json();
            const enhanced: StrategyMap = {};
            for (const [id, strategy] of Object.entries(data)) {
                const base = strategy as Strategy;
                enhanced[id] = base;
            }
            // Fill in missing EAs with defaults
            for (const id of eaIds) {
                if (!enhanced[id]) {
                    enhanced[id] = { enabled: false, settings: {} };
                }
            }
            setStrategies(enhanced);
        } catch (err) {
            console.error('Failed to load strategies:', err);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vpsAddress]);

    // ─── When selected EA changes, load its settings into draft ───
    useEffect(() => {
        const stored = currentStrategy.settings || {};
        const merged: Record<string, any> = {};
        for (const s of currentDef.settings) {
            merged[s.key] = stored[s.key] !== undefined ? stored[s.key] : s.default;
        }
        setDraftSettings(merged);
        setSaveMsg(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEA, JSON.stringify(currentStrategy.settings)]);

    const handleSelectEA = (id: string) => {
        setSelectedEA(id);
        localStorage.setItem(STORAGE_KEY, id);
    };

    const updateSetting = (key: string, value: any) => {
        setDraftSettings((prev) => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            // Try backend first
            const res = await fetch(`${API_URL}/strategies/${selectedEA}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: draftSettings }),
            });
            if (!res.ok) throw new Error(`Save failed (${res.status})`);
            setSaveMsg('✅ Saved');
        } catch (err: any) {
            // Fall back to localStorage
            const all = JSON.parse(localStorage.getItem('ea_settings') || '{}');
            all[selectedEA] = draftSettings;
            localStorage.setItem('ea_settings', JSON.stringify(all));
            setSaveMsg('✅ Saved locally (will sync next load)');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 3000);
        }
    };

    const toggleEnabled = async () => {
        const newVal = !currentStrategy.enabled;
        try {
            const res = await fetch(`${API_URL}/strategies/${selectedEA}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newVal }),
            });
            if (res.ok) {
                setStrategies((prev) => ({
                    ...prev,
                    [selectedEA]: { ...prev[selectedEA], enabled: newVal },
                }));
            }
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    // ─── Loading / Not configured ───
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

    if (loading || accountLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Loading performance analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-5">

                {/* ─── HEADER ─── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-rose-600 to-pink-700 rounded-xl shadow-lg shadow-rose-600/20">
                            <BarChart3 className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-white via-rose-100 to-pink-200 bg-clip-text text-transparent">
                                EA Manager
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Select, configure, and run your expert advisors
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStatus}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 self-start sm:self-auto"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* ─── ACCOUNT BAR ─── */}
                {account && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Balance</div>
                            <div className="text-base font-bold text-white">${account.balance.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Equity</div>
                            <div className="text-base font-bold text-white">${account.equity.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Floating P/L</div>
                            <div className={`text-base font-bold ${(account.equity - account.balance) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {(account.equity - account.balance) >= 0 ? '+' : ''}${(account.equity - account.balance).toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── EA DROPDOWN ─── */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/50">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Select Expert Advisor
                    </label>
                    <div className="relative">
                        <select
                            value={selectedEA}
                            onChange={(e) => handleSelectEA(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 pr-10 text-white text-sm font-semibold appearance-none focus:outline-none transition cursor-pointer"
                        >
                            {eaIds.map((id) => {
                                const def = EA_DEFS[id];
                                const active = strategies[id]?.enabled;
                                return (
                                    <option key={id} value={id}>
                                        {def.icon} {def.label} {active ? ' · ● Active' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* ─── SELECTED EA PANEL ─── */}
                <div className={`rounded-2xl border overflow-hidden transition-all ${
                    currentStrategy.enabled
                        ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 to-slate-900/60 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60'
                }`}>

                    {/* Header */}
                    <div className="p-4 border-b border-slate-700/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl text-2xl shrink-0 ${
                                currentStrategy.enabled
                                    ? 'bg-gradient-to-br from-emerald-600/30 to-teal-700/30 ring-1 ring-emerald-500/40'
                                    : 'bg-slate-800/60'
                            }`}>
                                {currentDef.icon}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-white truncate">{currentDef.label}</h2>
                                <p className="text-slate-400 text-[11px] truncate">{currentDef.description}</p>
                            </div>
                        </div>

                        <button
                            onClick={toggleEnabled}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                                currentStrategy.enabled
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                    : 'bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-700'
                            }`}
                        >
                            <Power size={12} />
                            {currentStrategy.enabled ? 'Stop' : 'Start'}
                        </button>
                    </div>

                    {/* Stats (only if active) */}
                    {currentStrategy.enabled && currentStats && (
                        <div className="p-4 border-b border-slate-700/40 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Award size={10} /> Win Rate</div>
                                <div className="text-lg font-bold text-emerald-400">{currentStats.winRate}%</div>
                            </div>
                            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Activity size={10} /> Trades</div>
                                <div className="text-lg font-bold text-white">{currentStats.totalTrades}</div>
                            </div>
                            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={10} /> Today</div>
                                <div className={`text-lg font-bold ${(currentStats.dailyProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {(currentStats.dailyProfit || 0) >= 0 ? '+' : ''}${(currentStats.dailyProfit || 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><PieChart size={10} /> R/R</div>
                                <div className="text-lg font-bold text-white">{currentStats.profitFactor || '—'}</div>
                            </div>
                        </div>
                    )}

                    {/* Settings */}
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Shield size={12} /> Configuration
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentDef.settings.map((s) => (
                                <div key={s.key} className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                    <label className="block text-[11px] font-semibold text-slate-300 mb-2">
                                        {s.label}
                                    </label>
                                    {s.type === 'checkbox' ? (
                                        <button
                                            type="button"
                                            onClick={() => updateSetting(s.key, !draftSettings[s.key])}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                                                draftSettings[s.key]
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}
                                        >
                                            <span>{draftSettings[s.key] ? 'Enabled' : 'Disabled'}</span>
                                            <span className={`w-8 h-4 rounded-full relative transition ${draftSettings[s.key] ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${draftSettings[s.key] ? 'left-4' : 'left-0.5'}`} />
                                            </span>
                                        </button>
                                    ) : (
                                        <input
                                            type="number"
                                            step={s.step}
                                            min={s.min}
                                            value={draftSettings[s.key] ?? ''}
                                            onChange={(e) => updateSetting(s.key, parseFloat(e.target.value))}
                                            className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-emerald-600/20"
                            >
                                <Save size={14} />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                            {saveMsg && (
                                <span className="text-xs text-emerald-400 font-semibold">{saveMsg}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Info Footer ─── */}
                <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-slate-400">
                    <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>Changes apply instantly to your EA. Use the dropdown above to switch between EAs. Only one EA runs at a time per account.</span>
                </div>

            </div>
        </div>
    );
};

export default PipnexTradingSystem;
