import React, { useState, useEffect } from 'react';
import {
    RotateCcw, Zap, Shield, AlertCircle, CheckCircle2, Info
} from 'lucide-react';

interface StrategySetting {
    key: string;
    label: string;
    type: 'number' | 'checkbox' | 'text';
    step?: number;
    min?: number;
    max?: number;
    default: any;
    hint?: string;
    icon?: React.ReactNode;
}

interface StrategySettingsProps {
    strategy: 'pipnex' | 'nova';
    onSettingsChange: (settings: Record<string, any>) => void;
    initialSettings?: Record<string, any>;
}

const STRATEGY_DEFS: Record<string, { label: string; description: string; icon: string; settings: StrategySetting[] }> = {
    pipnex: {
        label: 'PipNex Algo',
        description: 'Scalper grid with martingale strategy',
        icon: '📈',
        settings: [
            { key: 'lot', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.01, hint: 'Trade volume per order' },
            { key: 'pipStep', label: 'Pip Step', type: 'number', step: 1, min: 1, default: 10, hint: 'Distance between grid levels' },
            { key: 'closeProfit', label: 'Close Profit ($)', type: 'number', step: 0.05, min: 0, default: 0.30, hint: 'Target profit per cycle' },
            { key: 'maxLoss', label: 'Max Loss ($)', type: 'number', step: 0.05, min: 0, default: 0.50, hint: 'Stop loss threshold' },
            { key: 'maxLevels', label: 'Max Levels', type: 'number', step: 1, min: 1, default: 20, hint: 'Maximum grid levels' },
            { key: 'martingale', label: 'Martingale', type: 'checkbox', default: false, hint: 'Double lot on each level' },
        ],
    },
    nova: {
        label: 'NOVA EDGE AI',
        description: 'Swing trading with Fibonacci levels',
        icon: '🤖',
        settings: [
            { key: 'lotSize', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.05, hint: 'Trade volume per order' },
            { key: 'swingStrength', label: 'Swing Strength', type: 'number', step: 1, min: 1, default: 30, hint: 'Bars to identify swings' },
            { key: 'rewardRisk', label: 'Reward/Risk', type: 'number', step: 0.1, min: 0.1, default: 3.0, hint: 'TP relative to SL' },
            { key: 'maxPositions', label: 'Max Positions', type: 'number', step: 1, min: 1, default: 5, hint: 'Concurrent trades allowed' },
        ],
    },
};

export const StrategySettings: React.FC<StrategySettingsProps> = ({
    strategy,
    onSettingsChange,
    initialSettings = {},
}) => {
    const userStr = localStorage.getItem('user');
    let vpsAddress = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            vpsAddress = user.vps_address;
        } catch (e) {}
    }

    const def = STRATEGY_DEFS[strategy];
    const [settings, setSettings] = useState<Record<string, any>>(() => {
        const defaults: Record<string, any> = {};
        def.settings.forEach(s => {
            defaults[s.key] = s.default;
        });
        return { ...defaults, ...initialSettings };
    });

    const [saved, setSaved] = useState(false);

    // Sync when initialSettings change externally
    useEffect(() => {
        const merged: Record<string, any> = {};
        def.settings.forEach(s => {
            merged[s.key] = initialSettings[s.key] ?? s.default;
        });
        setSettings(merged);
    }, [strategy]);

    const handleChange = (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        onSettingsChange(newSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    const handleReset = () => {
        const defaults: Record<string, any> = {};
        def.settings.forEach(s => {
            defaults[s.key] = s.default;
        });
        setSettings(defaults);
        onSettingsChange(defaults);
    };

    // ─── EA Not Configured ───────────────────────────────────
    if (!vpsAddress) {
        return (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <AlertCircle size={18} className="text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">EA Not Configured</p>
                        <p className="text-slate-400 text-xs">Settings disabled</p>
                    </div>
                </div>
                <p className="text-xs text-slate-500">
                    Please contact the administrator to set up your VPS and EA configuration.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ─── HEADER ─────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">{def.icon}</div>
                    <div>
                        <h3 className="text-white font-bold text-base flex items-center gap-2">
                            {def.label}
                            {saved && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    <CheckCircle2 size={10} />
                                    Saved
                                </span>
                            )}
                        </h3>
                        <p className="text-slate-500 text-xs">{def.description}</p>
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 px-3 py-1.5 rounded-lg transition"
                    title="Reset to defaults"
                >
                    <RotateCcw size={12} />
                    Reset
                </button>
            </div>

            {/* ─── SETTINGS GRID ──────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {def.settings.map((setting) => {
                    const isBool = setting.type === 'checkbox';
                    const currentValue = settings[setting.key] ?? setting.default;
                    const isDefault = currentValue === setting.default;

                    if (isBool) {
                        const checked = !!settings[setting.key];
                        return (
                            <div
                                key={setting.key}
                                className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-xl p-4 border transition-all ${
                                    checked
                                        ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                        : 'border-slate-700/50 hover:border-slate-600/60'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                                            {setting.label}
                                        </div>
                                        {setting.hint && (
                                            <div className="text-[10px] text-slate-500">
                                                {setting.hint}
                                            </div>
                                        )}
                                    </div>
                                    <label className="cursor-pointer flex-shrink-0 ml-3">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => handleChange(setting.key, e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className={`w-11 h-6 rounded-full transition-all relative ${
                                            checked ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-slate-700'
                                        }`}>
                                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all transform ${
                                                checked ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={setting.key}
                            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/60 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    {setting.label}
                                </label>
                                {!isDefault && (
                                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/30">
                                        changed
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    step={setting.step || 0.01}
                                    min={setting.min}
                                    max={setting.max}
                                    value={settings[setting.key] ?? ''}
                                    onChange={(e) => handleChange(setting.key, parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-900/60 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all pr-12"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                                    {setting.step && setting.step < 1 ? '±' + setting.step : ''}
                                </div>
                            </div>
                            {setting.hint && (
                                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                                    <Info size={10} className="text-slate-600" />
                                    {setting.hint}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ─── FOOTER STATUS ──────────────────────────────── */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-700/40">
                <span className="flex items-center gap-1.5">
                    <Zap size={10} className="text-yellow-400" />
                    Changes apply instantly to your EA
                </span>
                <span className="flex items-center gap-1.5">
                    <Shield size={10} className="text-blue-400" />
                    {def.settings.length} parameters
                </span>
            </div>
        </div>
    );
};
