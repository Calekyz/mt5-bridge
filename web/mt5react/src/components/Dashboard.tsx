import React, { useState, useEffect } from 'react';
import { useAccount, sendCommand } from '../hooks/useApi';
import { AccountStats } from './AccountStats';
import { Loader2, AlertCircle, Play, Square } from 'lucide-react';
import { toast } from 'react-toastify';

type StrategyType = 'pipnex' | 'nova';

export const Dashboard: React.FC = () => {
    const { account, loading, error, refetch } = useAccount();
    const [pipnexEnabled, setPipnexEnabled] = useState(false);
    const [novaEnabled, setNovaEnabled] = useState(false);
    const [pipnexSettings, setPipnexSettings] = useState<Record<string, any>>({});
    const [novaSettings, setNovaSettings] = useState<Record<string, any>>({});
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [commandError, setCommandError] = useState<string | null>(null);

    useEffect(() => {
        const anyEnabled = pipnexEnabled || novaEnabled;
        sendCommand('Master_Enabled', anyEnabled ? 1 : 0).catch(console.error);
    }, [pipnexEnabled, novaEnabled]);

    const toggleStrategy = async (type: StrategyType, enable: boolean) => {
        setIsToggling(type);
        setCommandError(null);
        try {
            const varName = type === 'pipnex' ? 'PipNex_Enable' : 'Nova_Enable';
            await sendCommand(varName, enable ? 1 : 0);
            if (type === 'pipnex') {
                setPipnexEnabled(enable);
                if (enable) {
                    for (const [key, value] of Object.entries(pipnexSettings)) {
                        await sendCommand(`PipNex_${key}`, value);
                    }
                }
            } else {
                setNovaEnabled(enable);
                if (enable) {
                    for (const [key, value] of Object.entries(novaSettings)) {
                        await sendCommand(`Nova_${key}`, value);
                    }
                }
            }
            toast.success(`${type === 'pipnex' ? 'PipNex' : 'NOVA'} ${enable ? 'started' : 'stopped'}`);
        } catch (err: any) {
            setCommandError(err.message || 'Failed to toggle strategy');
            toast.error(`Failed to ${enable ? 'start' : 'stop'} ${type}`);
        } finally {
            setIsToggling(null);
        }
    };

    const updateSetting = async (type: StrategyType, key: string, value: any) => {
        try {
            const prefix = type === 'pipnex' ? 'PipNex_' : 'Nova_';
            await sendCommand(`${prefix}${key}`, value);
            if (type === 'pipnex') {
                setPipnexSettings(prev => ({ ...prev, [key]: value }));
            } else {
                setNovaSettings(prev => ({ ...prev, [key]: value }));
            }
            toast.success(`${key} updated to ${value}`);
        } catch (err: any) {
            toast.error(`Failed to update ${key}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-6 md:px-8">
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        📊 Trading Dashboard
                    </h1>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="text-slate-300">Live</span>
                    </div>
                </div>

                {/* Account Stats */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button onClick={refetch} className="ml-auto text-sm underline">Retry</button>
                    </div>
                ) : account ? (
                    <AccountStats
                        balance={account.balance}
                        equity={account.equity}
                        profit={account.equity - account.balance}
                        currency={account.currency || '$'}
                    />
                ) : null}

                {/* Command Error */}
                {commandError && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{commandError}</span>
                    </div>
                )}

                {/* Strategy Cards – Full width, responsive grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* PipNex Card */}
                    <StrategyCard
                        type="pipnex"
                        label="PipNex Algo"
                        icon="📈"
                        description="Scalper grid with martingale"
                        enabled={pipnexEnabled}
                        settings={pipnexSettings}
                        onToggle={toggleStrategy}
                        onUpdateSetting={updateSetting}
                        isToggling={isToggling === 'pipnex'}
                        settingsDef={PIPNEX_SETTINGS}
                    />

                    {/* NOVA Card */}
                    <StrategyCard
                        type="nova"
                        label="NOVA EDGE AI"
                        icon="🤖"
                        description="Swing trading with Fibonacci levels"
                        enabled={novaEnabled}
                        settings={novaSettings}
                        onToggle={toggleStrategy}
                        onUpdateSetting={updateSetting}
                        isToggling={isToggling === 'nova'}
                        settingsDef={NOVA_SETTINGS}
                    />
                </div>
            </div>
        </div>
    );
};

// ---- Settings Definitions ----
const PIPNEX_SETTINGS = [
    { key: 'Lot', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.01 },
    { key: 'PipStep', label: 'Pip Step', type: 'number', step: 1, min: 1, default: 10 },
    { key: 'CloseProfit', label: 'Close Profit ($)', type: 'number', step: 0.05, min: 0, default: 2.0 },
    { key: 'MaxLoss', label: 'Max Loss ($)', type: 'number', step: 0.05, min: 0, default: 0.50 },
    { key: 'MaxLevels', label: 'Max Levels', type: 'number', step: 1, min: 1, default: 20 },
    { key: 'Martingale', label: 'Martingale', type: 'checkbox', default: false },
];

const NOVA_SETTINGS = [
    { key: 'LotSize', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.05 },
    { key: 'SwingStrength', label: 'Swing Strength', type: 'number', step: 1, min: 1, default: 30 },
    { key: 'RewardRisk', label: 'Reward/Risk', type: 'number', step: 0.1, min: 0.1, default: 3.0 },
    { key: 'MaxPositions', label: 'Max Positions', type: 'number', step: 1, min: 1, default: 5 },
];

// ---- Strategy Card Component ----
interface StrategyCardProps {
    type: StrategyType;
    label: string;
    icon: string;
    description: string;
    enabled: boolean;
    settings: Record<string, any>;
    onToggle: (type: StrategyType, enable: boolean) => void;
    onUpdateSetting: (type: StrategyType, key: string, value: any) => void;
    isToggling: boolean;
    settingsDef: any[];
}

const StrategyCard: React.FC<StrategyCardProps> = ({
    type,
    label,
    icon,
    description,
    enabled,
    settings,
    onToggle,
    onUpdateSetting,
    isToggling,
    settingsDef,
}) => {
    return (
        <div className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
            enabled ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'border-slate-700/50 hover:border-slate-600'
        }`}>
            {/* Card Header */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{icon}</span>
                        <div>
                            <h3 className="text-xl font-bold text-white">{label}</h3>
                            <p className="text-slate-400 text-xs">{description}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onToggle(type, !enabled)}
                        disabled={isToggling}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                            enabled
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                        } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isToggling ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : enabled ? (
                            <>
                                <Square size={18} />
                                Stop Algo
                            </>
                        ) : (
                            <>
                                <Play size={18} />
                                Start Algo
                            </>
                        )}
                    </button>
                </div>
                {enabled && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400/80">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Algorithm running
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className="p-6">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-4">Parameters</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {settingsDef.map((setting) => {
                        const value = settings[setting.key] ?? setting.default;
                        const isBool = setting.type === 'checkbox';
                        return (
                            <div key={setting.key} className="flex flex-col">
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1">{setting.label}</label>
                                {isBool ? (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!value}
                                            onChange={(e) => onUpdateSetting(type, setting.key, e.target.checked)}
                                            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        />
                                        <span className="text-sm text-slate-300">Enabled</span>
                                    </label>
                                ) : (
                                    <input
                                        type="number"
                                        step={setting.step || 0.01}
                                        min={setting.min}
                                        max={setting.max}
                                        value={value}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) onUpdateSetting(type, setting.key, val);
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
    );
};
