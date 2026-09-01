import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

interface Strategy {
    enabled: boolean;
    settings: Record<string, any>;
}

type StrategyMap = Record<string, Strategy>;

// EA definitions for UI
const EA_DEFS = {
    pipnex: {
        label: 'PipNex Algo',
        icon: '📈',
        description: 'Scalper grid with martingale',
        settings: [
            { key: 'Lot', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01 },
            { key: 'PipStep', label: 'Pip Step', type: 'number', step: 1, min: 1 },
            { key: 'CloseProfit', label: 'Close Profit ($)', type: 'number', step: 0.05, min: 0 },
            { key: 'MaxLoss', label: 'Max Loss ($)', type: 'number', step: 0.05, min: 0 },
            { key: 'MaxLevels', label: 'Max Levels', type: 'number', step: 1, min: 1 },
            { key: 'Martingale', label: 'Martingale', type: 'checkbox' },
        ],
    },
    newspro: {
        label: 'NewsPro MX4',
        icon: '📰',
        description: 'Grid with trailing pending orders',
        settings: [
            { key: 'LotSize', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01 },
            { key: 'EntryDistance', label: 'Entry Distance (points)', type: 'number', step: 1, min: 1 },
            { key: 'StepDistance', label: 'Step Distance (points)', type: 'number', step: 1, min: 1 },
            { key: 'TrailingStop', label: 'Trailing Stop (points)', type: 'number', step: 1, min: 0 },
            { key: 'TrailingPending', label: 'Trailing Pending (points)', type: 'number', step: 1, min: 0 },
            { key: 'NumberOfOrders', label: 'Number of Orders', type: 'number', step: 1, min: 1 },
        ],
    },
    nova: {
        label: 'NOVA EDGE AI',
        icon: '🤖',
        description: 'Swing trading with Fibonacci levels',
        settings: [
            { key: 'LotSize', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01 },
            { key: 'SwingStrength', label: 'Swing Strength', type: 'number', step: 1, min: 1 },
            { key: 'RewardRisk', label: 'Reward/Risk', type: 'number', step: 0.1, min: 0.1 },
            { key: 'MaxPositions', label: 'Max Positions', type: 'number', step: 1, min: 1 },
        ],
    },
};

export const PipnexTradingSystem: React.FC = () => {
    const [strategies, setStrategies] = useState<StrategyMap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/strategies/status`);
            const data = await res.json();
            setStrategies(data);
        } catch (err) {
            console.error('Failed to fetch strategies:', err);
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-white text-xl">Loading strategies...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        🚀 Strategy Control Center
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage your EAs – only one can be active at a time
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(EA_DEFS).map(([id, def]) => {
                        const strategy = strategies[id] || { enabled: false, settings: {} };
                        const isActive = strategy.enabled;
                        const isSaving = saving === id;

                        return (
                            <div
                                key={id}
                                className={`bg-slate-800/60 backdrop-blur-sm rounded-xl border p-6 transition-all ${
                                    isActive
                                        ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg'
                                        : 'border-slate-700/50 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{def.icon}</span>
                                        <h3 className="text-lg font-bold text-white">{def.label}</h3>
                                    </div>
                                    <button
                                        onClick={() => toggleEA(id, !isActive)}
                                        disabled={isSaving}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                            isActive ? 'bg-emerald-600' : 'bg-slate-600'
                                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                                isActive ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <p className="text-slate-400 text-xs mb-4">{def.description}</p>

                                {isActive && (
                                    <div className="border-t border-slate-700/50 pt-4 mt-2">
                                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                                            Settings
                                        </div>
                                        <div className="space-y-3">
                                            {def.settings.map((setting) => {
                                                const value = strategy.settings?.[setting.key] ?? '';
                                                const isBool = setting.type === 'checkbox';

                                                return (
                                                    <div key={setting.key} className="flex items-center gap-3">
                                                        <label className="text-slate-300 text-sm w-1/2">
                                                            {setting.label}
                                                        </label>
                                                        {isBool ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={!!value}
                                                                onChange={(e) =>
                                                                    updateSetting(id, setting.key, e.target.checked)
                                                                }
                                                                className="w-4 h-4 text-blue-600 rounded border-slate-600 bg-slate-700 focus:ring-blue-500"
                                                            />
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                step={setting.step || 0.01}
                                                                min={setting.min || 0}
                                                                value={value}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) {
                                                                        updateSetting(id, setting.key, val);
                                                                    }
                                                                }}
                                                                className="w-1/2 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {isActive && (
                                    <div className="mt-3 text-xs text-emerald-400/80 flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Active
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
