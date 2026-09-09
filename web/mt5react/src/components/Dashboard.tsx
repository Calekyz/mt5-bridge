import React, { useState, useEffect } from 'react';
import { useAccount, sendCommand } from '../hooks/useApi';
import { AccountStats } from './AccountStats';
import { Loader2, AlertCircle, Play, Square, Key, Wifi, WifiOff, Server, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

type StrategyType = 'pipnex' | 'nova';

function getStoredState(key: string, defaultValue: boolean): boolean {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return stored === 'true';
}

function setStoredState(key: string, value: boolean) {
    localStorage.setItem(key, String(value));
}

export const Dashboard: React.FC = () => {
    const { account, loading, error, refetch } = useAccount();
    const [vpsAddress, setVpsAddress] = useState<string | null>(null);
    const [pipnexEnabled, setPipnexEnabled] = useState(() => getStoredState('pipnexEnabled', false));
    const [novaEnabled, setNovaEnabled] = useState(() => getStoredState('novaEnabled', false));
    const [pipnexSettings, setPipnexSettings] = useState<Record<string, any>>({});
    const [novaSettings, setNovaSettings] = useState<Record<string, any>>({});
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [commandError, setCommandError] = useState<string | null>(null);
    const [eaConnected, setEaConnected] = useState<boolean | null>(null);
    const [refreshingUser, setRefreshingUser] = useState(false);

    const accessKey = localStorage.getItem('accessKey') || '';

    // ─── Load user and VPS address from localStorage ──────────
    const loadUserFromStorage = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.vps_address) {
                    setVpsAddress(user.vps_address);
                } else {
                    setVpsAddress(null);
                }
            } catch (e) {
                console.error('Failed to parse user', e);
            }
        }
    };

    useEffect(() => {
        loadUserFromStorage();
    }, []);

    // ─── Refresh user info from backend ──────────────────────────
    const refreshUserInfo = async () => {
        setRefreshingUser(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }
            const user = await response.json();
            // Update localStorage
            const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...existingUser, ...user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Update state
            if (user.vps_address) {
                setVpsAddress(user.vps_address);
                toast.success('VPS address updated: ' + user.vps_address);
            } else {
                setVpsAddress(null);
                toast.info('No VPS assigned yet');
            }
        } catch (err: any) {
            toast.error('Failed to refresh user info: ' + err.message);
        } finally {
            setRefreshingUser(false);
        }
    };

    // ─── Check EA health using the VPS ──────────────────────────
    useEffect(() => {
        const checkEaHealth = async () => {
            if (!vpsAddress) {
                setEaConnected(false);
                return;
            }
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';
                const response = await fetch(`${API_URL}/ea/status`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setEaConnected(data.connected);
                } else {
                    setEaConnected(false);
                }
            } catch {
                setEaConnected(false);
            }
        };
        checkEaHealth();
        const interval = setInterval(checkEaHealth, 15000);
        return () => clearInterval(interval);
    }, [vpsAddress]);

    // ─── Poll account every 1 second ────────────────────────
    useEffect(() => {
        if (!vpsAddress) return;
        const interval = setInterval(() => {
            refetch();
        }, 1000);
        return () => clearInterval(interval);
    }, [vpsAddress, refetch]);

    // ─── State persistence ────────────────────────────────────
    useEffect(() => {
        setStoredState('pipnexEnabled', pipnexEnabled);
    }, [pipnexEnabled]);

    useEffect(() => {
        setStoredState('novaEnabled', novaEnabled);
    }, [novaEnabled]);

    // ─── Send Master_Enabled command ──────────────────────────
    useEffect(() => {
        const anyEnabled = pipnexEnabled || novaEnabled;
        sendCommand('Master_Enabled', anyEnabled ? 1 : 0).catch(console.error);
    }, [pipnexEnabled, novaEnabled]);

    // ─── Toggle strategy ──────────────────────────────────────
    const toggleStrategy = async (type: StrategyType, enable: boolean) => {
        if (!vpsAddress || !eaConnected) {
            toast.error('VPS not configured or EA not reachable');
            return;
        }
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

    const updateSetting = async (type: StrategyType, key: string, value: number) => {
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

    // ─── Local input states ──────────────────────────────────
    const [localInputs, setLocalInputs] = useState<Record<string, Record<string, string>>>({
        pipnex: {},
        nova: {},
    });

    useEffect(() => {
        const initLocal = (type: StrategyType) => {
            const settings = type === 'pipnex' ? pipnexSettings : novaSettings;
            const defs = type === 'pipnex' ? PIPNEX_SETTINGS : NOVA_SETTINGS;
            const inputs: Record<string, string> = {};
            for (const def of defs) {
                if (def.type === 'number') {
                    const val = settings[def.key] ?? def.default;
                    inputs[def.key] = String(val);
                }
            }
            setLocalInputs(prev => ({
                ...prev,
                [type]: inputs,
            }));
        };
        initLocal('pipnex');
        initLocal('nova');
    }, [pipnexSettings, novaSettings]);

    const handleInputChange = (type: StrategyType, key: string, rawValue: string) => {
        setLocalInputs(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [key]: rawValue,
            },
        }));
    };

    const handleInputBlur = (type: StrategyType, key: string) => {
        const raw = localInputs[type]?.[key] || '';
        const num = parseFloat(raw);
        if (!isNaN(num)) {
            updateSetting(type, key, num);
        } else {
            const settings = type === 'pipnex' ? pipnexSettings : novaSettings;
            const defs = type === 'pipnex' ? PIPNEX_SETTINGS : NOVA_SETTINGS;
            const def = defs.find(d => d.key === key);
            if (def) {
                const currentVal = settings[key] ?? def.default;
                setLocalInputs(prev => ({
                    ...prev,
                    [type]: {
                        ...prev[type],
                        [key]: String(currentVal),
                    },
                }));
            }
        }
    };

    const handleCheckboxChange = (type: StrategyType, key: string, checked: boolean) => {
        const prefix = type === 'pipnex' ? 'PipNex_' : 'Nova_';
        sendCommand(`${prefix}${key}`, checked).catch(console.error);
        if (type === 'pipnex') {
            setPipnexSettings(prev => ({ ...prev, [key]: checked }));
        } else {
            setNovaSettings(prev => ({ ...prev, [key]: checked }));
        }
    };

    // ─── EA Not Configured screen ──────────────────────────
    if (!vpsAddress) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 flex items-center justify-center">
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 max-w-md text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">EA Not Configured</h2>
                    <p className="text-slate-400 text-sm">
                        Please contact the administrator to set up your VPS and EA configuration.
                    </p>
                    <button
                        onClick={refreshUserInfo}
                        disabled={refreshingUser}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition disabled:opacity-50 mx-auto"
                    >
                        <RefreshCw size={16} className={refreshingUser ? 'animate-spin' : ''} />
                        {refreshingUser ? 'Refreshing...' : 'Refresh VPS Info'}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Normal dashboard ──────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            📊 Trading Dashboard
                        </h1>
                        {accessKey && (
                            <div className="mt-2 flex items-center gap-3 bg-slate-700/40 px-4 py-2 rounded-xl border border-slate-600/50">
                                <Key size={18} className="text-blue-400" />
                                <span className="text-slate-300 text-sm font-medium">Access Key:</span>
                                <code className="font-mono text-sm text-white bg-slate-800/60 px-3 py-1 rounded-lg">
                                    {accessKey}
                                </code>
                            </div>
                        )}
                        <div className="mt-2 flex items-center gap-3 bg-slate-700/40 px-4 py-2 rounded-xl border border-slate-600/50">
                            <Server size={18} className="text-blue-400" />
                            <span className="text-slate-300 text-sm font-medium">VPS Address:</span>
                            <code className="font-mono text-sm text-white bg-slate-800/60 px-3 py-1 rounded-lg">
                                {vpsAddress}
                            </code>
                            <button
                                onClick={refreshUserInfo}
                                disabled={refreshingUser}
                                className="ml-2 text-blue-400 hover:text-blue-300 transition disabled:opacity-50"
                                title="Refresh VPS info"
                            >
                                <RefreshCw size={16} className={refreshingUser ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-sm">
                            {eaConnected === null ? (
                                <span className="text-slate-400">Checking EA...</span>
                            ) : eaConnected ? (
                                <>
                                    <Wifi size={16} className="text-green-400" />
                                    <span className="text-green-400">EA Connected</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={16} className="text-red-400" />
                                    <span className="text-red-400">EA Disconnected</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-slate-300">Live (1s refresh)</span>
                        </div>
                    </div>
                </div>

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

                {commandError && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{commandError}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <StrategyCard
                        type="pipnex"
                        label="PipNex Algo"
                        icon="📈"
                        description="Scalper grid with martingale"
                        enabled={pipnexEnabled}
                        settings={pipnexSettings}
                        localInputs={localInputs.pipnex}
                        onToggle={toggleStrategy}
                        onInputChange={handleInputChange}
                        onInputBlur={handleInputBlur}
                        onCheckboxChange={handleCheckboxChange}
                        isToggling={isToggling === 'pipnex'}
                        settingsDef={PIPNEX_SETTINGS}
                        disabled={!eaConnected}
                    />
                    <StrategyCard
                        type="nova"
                        label="NOVA EDGE AI"
                        icon="🤖"
                        description="Swing trading with Fibonacci levels"
                        enabled={novaEnabled}
                        settings={novaSettings}
                        localInputs={localInputs.nova}
                        onToggle={toggleStrategy}
                        onInputChange={handleInputChange}
                        onInputBlur={handleInputBlur}
                        onCheckboxChange={handleCheckboxChange}
                        isToggling={isToggling === 'nova'}
                        settingsDef={NOVA_SETTINGS}
                        disabled={!eaConnected}
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

// ---- Strategy Card ----
interface StrategyCardProps {
    type: StrategyType;
    label: string;
    icon: string;
    description: string;
    enabled: boolean;
    settings: Record<string, any>;
    localInputs: Record<string, string>;
    onToggle: (type: StrategyType, enable: boolean) => void;
    onInputChange: (type: StrategyType, key: string, value: string) => void;
    onInputBlur: (type: StrategyType, key: string) => void;
    onCheckboxChange: (type: StrategyType, key: string, checked: boolean) => void;
    isToggling: boolean;
    settingsDef: any[];
    disabled?: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
    type,
    label,
    icon,
    description,
    enabled,
    settings,
    localInputs,
    onToggle,
    onInputChange,
    onInputBlur,
    onCheckboxChange,
    isToggling,
    settingsDef,
    disabled = false,
}) => {
    return (
        <div className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
            enabled ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'border-slate-700/50 hover:border-slate-600'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
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
                        disabled={isToggling || disabled}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                            enabled
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                        } ${(isToggling || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isToggling ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : enabled ? (
                            <>
                                <Square size={18} /> Stop Algo
                            </>
                        ) : (
                            <>
                                <Play size={18} /> Start Algo
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
                {disabled && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400/80">
                        <AlertTriangle size={14} />
                        <span>EA offline</span>
                    </div>
                )}
            </div>
            <div className="p-6">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-4">Parameters</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {settingsDef.map((setting) => {
                        const isBool = setting.type === 'checkbox';
                        const rawValue = localInputs[setting.key] ?? String(settings[setting.key] ?? setting.default);

                        if (isBool) {
                            return (
                                <div key={setting.key} className="flex flex-col">
                                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-1">{setting.label}</label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!settings[setting.key]}
                                            onChange={(e) => onCheckboxChange(type, setting.key, e.target.checked)}
                                            disabled={disabled}
                                            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50"
                                        />
                                        <span className="text-sm text-slate-300">Enabled</span>
                                    </label>
                                </div>
                            );
                        }

                        return (
                            <div key={setting.key} className="flex flex-col">
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1">{setting.label}</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={rawValue}
                                    onChange={(e) => onInputChange(type, setting.key, e.target.value)}
                                    onBlur={() => onInputBlur(type, setting.key)}
                                    disabled={disabled}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                                    placeholder={String(setting.default)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
