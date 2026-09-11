import React, { useState, useEffect } from 'react';
import { useAccount, sendCommand } from '../hooks/useApi';
import { AccountStats } from './AccountStats';
import { Loader2, AlertCircle, Play, Square, Key, Wifi, WifiOff, Server, AlertTriangle, RefreshCw, Shield, TrendingUp, TrendingDown } from 'lucide-react';
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

interface RiskSession {
    id: number;
    starting_balance: number;
    starting_equity: number;
    sl_amount: number | null;
    tp_amount: number | null;
    is_active: boolean;
    trigger_reason: string | null;
    triggered_at: string | null;
    created_at: string;   // ← NEW FIELD
}

interface RiskCurrent {
    balance: number;
    equity: number;
    drawdown: number;
    profit: number;
    raw_drawdown: number;
    raw_profit: number;
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

    // ─── Risk Guard State ───────────────────────────────────
    const [slInput, setSlInput] = useState<string>('');
    const [tpInput, setTpInput] = useState<string>('');
    const [riskSession, setRiskSession] = useState<RiskSession | null>(null);
    const [riskCurrent, setRiskCurrent] = useState<RiskCurrent | null>(null);
    const [triggerAlert, setTriggerAlert] = useState<string | null>(null);

    const accessKey = localStorage.getItem('accessKey') || '';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

    // ─── Load user from localStorage (instant) ──────────────
    const loadUserFromStorage = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setVpsAddress(user.vps_address || null);
            } catch (e) {
                console.error('Failed to parse user', e);
            }
        }
    };

    // ─── Refresh user info ───────────────────────────────────
    const refreshUserInfo = async (showToast = false) => {
        setRefreshingUser(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch user info');
            const user = await response.json();
            const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...existingUser, ...user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (user.vps_address) {
                setVpsAddress(user.vps_address);
                if (showToast) toast.success('VPS address updated: ' + user.vps_address);
            } else {
                setVpsAddress(null);
                if (showToast) toast.info('No VPS assigned yet');
            }
        } catch (err: any) {
            console.error('Refresh user info error:', err);
            if (showToast) toast.error('Failed to refresh user info: ' + err.message);
        } finally {
            setRefreshingUser(false);
        }
    };

    // ─── Fetch risk status ───────────────────────────────────
    const fetchRiskStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/risk/status`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.session) {
                setRiskSession(data.session);
                setRiskCurrent(data.current || null);

                // Check if a trigger just happened
                if (data.session.trigger_reason === 'sl_hit' && triggerAlert !== 'sl_hit') {
                    setTriggerAlert('sl_hit');
                    setPipnexEnabled(false);
                    setNovaEnabled(false);
                    setStoredState('pipnexEnabled', false);
                    setStoredState('novaEnabled', false);
                    toast.error(`⚠️ STOP LOSS HIT — Algo stopped. Drawdown: $${data.session.sl_amount?.toFixed(2)}`, {
                        autoClose: 15000,
                        position: 'top-center',
                    });
                } else if (data.session.trigger_reason === 'tp_hit' && triggerAlert !== 'tp_hit') {
                    setTriggerAlert('tp_hit');
                    setPipnexEnabled(false);
                    setNovaEnabled(false);
                    setStoredState('pipnexEnabled', false);
                    setStoredState('novaEnabled', false);
                    toast.success(`🎯 TARGET PROFIT HIT — Algo stopped. Profit: $${data.session.tp_amount?.toFixed(2)}`, {
                        autoClose: 15000,
                        position: 'top-center',
                    });
                } else if (!data.session.trigger_reason) {
                    setTriggerAlert(null);
                }
            } else {
                setRiskSession(null);
                setRiskCurrent(null);
            }
        } catch (err) {
            // silent
        }
    };

    // ─── On mount ─────────────────────────────────────────────
    useEffect(() => {
        loadUserFromStorage();
        refreshUserInfo(false);
        fetchRiskStatus();

        const userInterval = setInterval(() => refreshUserInfo(false), 30000);
        const riskInterval = setInterval(fetchRiskStatus, 5000);

        return () => {
            clearInterval(userInterval);
            clearInterval(riskInterval);
        };
    }, []);

    // ─── Check EA health ─────────────────────────────────────
    useEffect(() => {
        const checkEaHealth = async () => {
            if (!vpsAddress) {
                setEaConnected(false);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/ea/status`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
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

    // ─── Poll account ────────────────────────────────────────
    useEffect(() => {
        if (!vpsAddress) return;
        const interval = setInterval(() => { refetch(); }, 1000);
        return () => clearInterval(interval);
    }, [vpsAddress, refetch]);

    // ─── State persistence ───────────────────────────────────
    useEffect(() => { setStoredState('pipnexEnabled', pipnexEnabled); }, [pipnexEnabled]);
    useEffect(() => { setStoredState('novaEnabled', novaEnabled); }, [novaEnabled]);

    // ─── Send Master_Enabled command ─────────────────────────
    useEffect(() => {
        const anyEnabled = pipnexEnabled || novaEnabled;
        sendCommand('Master_Enabled', anyEnabled ? 1 : 0).catch(console.error);
    }, [pipnexEnabled, novaEnabled]);

    // ─── Start risk session ──────────────────────────────────
    const startRiskSession = async (): Promise<boolean> => {
        const sl = parseFloat(slInput);
        const tp = parseFloat(tpInput);

        if ((!sl || sl <= 0) && (!tp || tp <= 0)) {
            // No SL/TP set → no session needed
            return true;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/risk/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    sl: sl > 0 ? sl : null,
                    tp: tp > 0 ? tp : null,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to start risk session');
            }
            await fetchRiskStatus();
            return true;
        } catch (err: any) {
            toast.error('Risk guard failed: ' + err.message);
            return false;
        }
    };

    // ─── Stop risk session ───────────────────────────────────
    const stopRiskSession = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/risk/stop`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setRiskSession(null);
            setRiskCurrent(null);
            setTriggerAlert(null);
        } catch (err: any) {
            console.error('Stop risk session error:', err);
        }
    };

    // ─── Toggle strategy ─────────────────────────────────────
    const toggleStrategy = async (type: StrategyType, enable: boolean) => {
        if (!vpsAddress || !eaConnected) {
            toast.error('VPS not configured or EA not reachable');
            return;
        }
        setIsToggling(type);
        setCommandError(null);
        try {
            // If ENABLING: start risk session first (if SL/TP set)
            if (enable) {
                const currentPipnex = type === 'pipnex' ? true : pipnexEnabled;
                const currentNova = type === 'nova' ? true : novaEnabled;
                // Only start a session if none is active AND we're enabling something
                if (!riskSession?.is_active && (currentPipnex || currentNova)) {
                    const ok = await startRiskSession();
                    if (!ok) {
                        setIsToggling(null);
                        return;
                    }
                }
            }

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

            // If DISABLING and both are now off → stop risk session
            if (!enable) {
                const stillEnabled = type === 'pipnex' ? novaEnabled : pipnexEnabled;
                if (!stillEnabled) {
                    await stopRiskSession();
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

    // ─── Local inputs ────────────────────────────────────────
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
            setLocalInputs(prev => ({ ...prev, [type]: inputs }));
        };
        initLocal('pipnex');
        initLocal('nova');
    }, [pipnexSettings, novaSettings]);

    const handleInputChange = (type: StrategyType, key: string, rawValue: string) => {
        setLocalInputs(prev => ({
            ...prev,
            [type]: { ...prev[type], [key]: rawValue },
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
                    [type]: { ...prev[type], [key]: String(currentVal) },
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

    // ─── EA Not Configured ───────────────────────────────────
    if (!vpsAddress) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 flex items-center justify-center">
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 max-w-md text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">EA Not Configured</h2>
                    <p className="text-slate-400 text-sm">
                        Please contact the administrator to set up your VPS and EA configuration.
                    </p>
                    <button
                        onClick={() => refreshUserInfo(true)}
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

    // ─── Normal dashboard ────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Trigger Alert Banner */}
                {triggerAlert && (
                    <div className={`rounded-xl p-4 border flex items-center gap-3 ${
                        triggerAlert === 'sl_hit'
                            ? 'bg-red-900/30 border-red-500/50 text-red-300'
                            : 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300'
                    }`}>
                        {triggerAlert === 'sl_hit' ? (
                            <TrendingDown size={24} />
                        ) : (
                            <TrendingUp size={24} />
                        )}
                        <div className="flex-1">
                            <div className="font-bold">
                                {triggerAlert === 'sl_hit' ? '⚠️ Stop Loss Hit' : '🎯 Target Profit Hit'}
                            </div>
                            <div className="text-sm opacity-80">
                                {triggerAlert === 'sl_hit'
                                    ? `Your algo was stopped automatically to protect your account.`
                                    : `Your algo was stopped automatically — profit target reached.`}
                            </div>
                        </div>
                        <button
                            onClick={() => { setTriggerAlert(null); }}
                            className="text-xs underline opacity-70 hover:opacity-100"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

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
                                onClick={() => refreshUserInfo(true)}
                                disabled={refreshingUser}
                                className="ml-2 text-blue-400 hover:text-blue-300 transition disabled:opacity-50"
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

                {/* ─── RISK GUARD CARD ──────────────────────────── */}
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                                <Shield size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Risk Guard</h2>
                                <p className="text-slate-400 text-xs">
                                    Auto-stops your algo when your account hits SL or TP
                                </p>
                            </div>
                        </div>
                        {riskSession?.is_active && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                Active
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                                Stop Loss ($) — Max Drawdown
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={slInput}
                                onChange={(e) => setSlInput(e.target.value)}
                                placeholder="e.g. 100"
                                disabled={riskSession?.is_active}
                                className="w-full bg-slate-700/50 border border-red-700/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">Algo stops if equity drops by this amount</p>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                                Take Profit ($) — Target Profit
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={tpInput}
                                onChange={(e) => setTpInput(e.target.value)}
                                placeholder="e.g. 200"
                                disabled={riskSession?.is_active}
                                className="w-full bg-slate-700/50 border border-green-700/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">Algo stops when equity rises by this amount</p>
                        </div>
                    </div>

                    {/* Live risk status */}
                    {riskSession?.is_active && riskCurrent && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-slate-700/30 rounded-lg p-3">
                                <div className="text-xs text-slate-400">Start Balance</div>
                                <div className="font-mono text-white">${riskSession.starting_balance.toFixed(2)}</div>
                            </div>
                            <div className="bg-slate-700/30 rounded-lg p-3">
                                <div className="text-xs text-slate-400">Current Equity</div>
                                <div className="font-mono text-white">${riskCurrent.equity.toFixed(2)}</div>
                            </div>
                            <div className="bg-slate-700/30 rounded-lg p-3">
                                <div className="text-xs text-slate-400">Drawdown</div>
                                <div className={`font-mono ${riskCurrent.raw_drawdown > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                    ${riskCurrent.raw_drawdown.toFixed(2)}
                                    {riskSession.sl_amount && <span className="text-xs opacity-60"> / ${riskSession.sl_amount.toFixed(0)}</span>}
                                </div>
                            </div>
                            <div className="bg-slate-700/30 rounded-lg p-3">
                                <div className="text-xs text-slate-400">Profit</div>
                                <div className={`font-mono ${riskCurrent.raw_profit > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    ${riskCurrent.raw_profit.toFixed(2)}
                                    {riskSession.tp_amount && <span className="text-xs opacity-60"> / ${riskSession.tp_amount.toFixed(0)}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {riskSession?.is_active && (
                        <div className="mt-3 text-xs text-slate-400">
                            Risk Guard started at {new Date(riskSession.created_at || '').toLocaleTimeString()}. Values locked until you stop all algos.
                        </div>
                    )}
                </div>

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
    type, label, icon, description, enabled, settings, localInputs,
    onToggle, onInputChange, onInputBlur, onCheckboxChange,
    isToggling, settingsDef, disabled = false,
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
