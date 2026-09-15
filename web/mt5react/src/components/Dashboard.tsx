import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, sendCommand } from '../hooks/useApi';
import { AccountStats } from './AccountStats';
import { getOrders } from '../api/nodejsApiClient';
import { QuantumAICard } from './QuantumAICard';
import type { PipnexSuggestion, NovaSuggestion } from './quantumAI';
import {
    AlertCircle, Play, Square, Key, Wifi, WifiOff, Server,
    AlertTriangle, RefreshCw, Shield, TrendingUp, TrendingDown,
    BookOpen, X as XIcon, Zap, Activity,
    Info, Clock, BarChart3, Sparkles
} from 'lucide-react';
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

// ─── Settings persistence helpers ─────────────────────────
function loadStoredSettings(key: string): Record<string, any> {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
        return {};
    } catch {
        return {};
    }
}

function saveStoredSettings(key: string, value: Record<string, any>) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore storage errors
    }
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
    created_at: string;
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
    const navigate = useNavigate();
    const { account, loading, error, refetch } = useAccount();
    const [vpsAddress, setVpsAddress] = useState<string | null>(null);
    const [pipnexEnabled, setPipnexEnabled] = useState(() => getStoredState('pipnexEnabled', false));
    const [novaEnabled, setNovaEnabled] = useState(() => getStoredState('novaEnabled', false));

    // ─── Settings now hydrate from localStorage ────────────
    const [pipnexSettings, setPipnexSettings] = useState<Record<string, any>>(
        () => loadStoredSettings('pipnexSettings')
    );
    const [novaSettings, setNovaSettings] = useState<Record<string, any>>(
        () => loadStoredSettings('novaSettings')
    );

    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [commandError, setCommandError] = useState<string | null>(null);
    const [eaConnected, setEaConnected] = useState<boolean | null>(null);
    const [refreshingUser, setRefreshingUser] = useState(false);

    // ─── Open positions for Quantum AI ─────────────────────
    const [positions, setPositions] = useState<any[]>([]);

    // ─── Risk Guard State ───────────────────────────────────
    const [slInput, setSlInput] = useState<string>(() => localStorage.getItem('riskSl') || '');
    const [tpInput, setTpInput] = useState<string>(() => localStorage.getItem('riskTp') || '');
    const [riskSession, setRiskSession] = useState<RiskSession | null>(null);
    const [riskCurrent, setRiskCurrent] = useState<RiskCurrent | null>(null);
    const [triggerAlert, setTriggerAlert] = useState<string | null>(null);

    // ─── Auto-close toggle (default OFF) ───────────────────
    const [autoCloseEnabled, setAutoCloseEnabled] = useState(() => getStoredState('autoCloseEnabled', false));

    // ─── First-Visit Guide Modal ───────────────────────────
    const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

    const dismissedTriggers = useRef<Set<number>>(new Set());
    const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const accessKey = localStorage.getItem('accessKey') || '';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

    // ─── Persist SL/TP inputs ────────────────────────────────
    useEffect(() => { localStorage.setItem('riskSl', slInput); }, [slInput]);
    useEffect(() => { localStorage.setItem('riskTp', tpInput); }, [tpInput]);

    // ─── Persist strategy settings to localStorage ──────────
    useEffect(() => {
        saveStoredSettings('pipnexSettings', pipnexSettings);
    }, [pipnexSettings]);

    useEffect(() => {
        saveStoredSettings('novaSettings', novaSettings);
    }, [novaSettings]);

    // ─── Persist auto-close preference ──────────────────────
    useEffect(() => {
        setStoredState('autoCloseEnabled', autoCloseEnabled);
    }, [autoCloseEnabled]);

    // ─── Check if user is new ────────────────────────────────
    useEffect(() => {
        const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide');
        if (!hasSeenGuide) {
            const timer = setTimeout(() => setShowWelcomeGuide(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismissWelcomeGuide = () => {
        localStorage.setItem('hasSeenWelcomeGuide', 'true');
        setShowWelcomeGuide(false);
    };

    const goToGuide = () => {
        localStorage.setItem('hasSeenWelcomeGuide', 'true');
        setShowWelcomeGuide(false);
        navigate('/guide');
    };

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

                const sessionId = data.session.id;
                const reason = data.session.trigger_reason;

                if (
                    (reason === 'sl_hit' || reason === 'tp_hit') &&
                    !dismissedTriggers.current.has(sessionId)
                ) {
                    dismissedTriggers.current.add(sessionId);
                    setTriggerAlert(reason);
                    setPipnexEnabled(false);
                    setNovaEnabled(false);
                    setStoredState('pipnexEnabled', false);
                    setStoredState('novaEnabled', false);

                    if (reason === 'sl_hit') {
                        toast.error(
                            `STOP LOSS HIT — Algo stopped. Drawdown: $${data.session.sl_amount?.toFixed(2)}`,
                            { autoClose: 8000, position: 'top-center' }
                        );
                    } else {
                        toast.success(
                            `TARGET PROFIT HIT — Algo stopped. Profit: $${data.session.tp_amount?.toFixed(2)}`,
                            { autoClose: 8000, position: 'top-center' }
                        );
                    }

                    fetch(`${API_URL}/risk/dismiss`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                    }).catch(() => {});

                    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
                    bannerTimeoutRef.current = setTimeout(() => {
                        setTriggerAlert(null);
                    }, 30000);
                }
            } else {
                setRiskSession(null);
                setRiskCurrent(null);
            }
        } catch (err) {
            // silent
        }
    };

    useEffect(() => {
        loadUserFromStorage();
        refreshUserInfo(false);
        fetchRiskStatus();

        const userInterval = setInterval(() => refreshUserInfo(false), 30000);
        const riskInterval = setInterval(fetchRiskStatus, 5000);

        return () => {
            clearInterval(userInterval);
            clearInterval(riskInterval);
            if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        };
    }, []);

    // ─── Fetch open positions for Quantum AI (every 3s) ─────
    useEffect(() => {
        if (!vpsAddress) return;
        const fetchPositions = async () => {
            try {
                const data = await getOrders();
                setPositions(data.opened || []);
            } catch {
                // silent — don't spam if EA offline
            }
        };
        fetchPositions();
        const interval = setInterval(fetchPositions, 3000);
        return () => clearInterval(interval);
    }, [vpsAddress]);

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

    useEffect(() => {
        if (!vpsAddress) return;
        const interval = setInterval(() => { refetch(); }, 1000);
        return () => clearInterval(interval);
    }, [vpsAddress, refetch]);

    useEffect(() => { setStoredState('pipnexEnabled', pipnexEnabled); }, [pipnexEnabled]);
    useEffect(() => { setStoredState('novaEnabled', novaEnabled); }, [novaEnabled]);

    // ─── NOTE ─────────────────────────────────────────────────
    // The previous "reconcile on connect" effect was REMOVED.
    // It sent Enable=0 to the EA on login when localStorage said
    // disabled, which turned off algos that were running from a
    // previous session. Now the EA keeps its state across logouts.
    // ──────────────────────────────────────────────────────────

    const startRiskSession = async (): Promise<boolean> => {
        const sl = parseFloat(slInput);
        const tp = parseFloat(tpInput);

        if ((!sl || sl <= 0) && (!tp || tp <= 0)) {
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

    const toggleStrategy = async (type: StrategyType, enable: boolean) => {
        if (!vpsAddress || !eaConnected) {
            toast.error('VPS not configured or EA not reachable');
            return;
        }
        setIsToggling(type);
        setCommandError(null);
        try {
            if (enable) {
                const currentPipnex = type === 'pipnex' ? true : pipnexEnabled;
                const currentNova = type === 'nova' ? true : novaEnabled;
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

    const updateSetting = async (type: StrategyType, key: string, value: number | boolean) => {
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

    // ─── Quantum AI: Apply PipNex suggestions (no MaxLoss) ──
    const applyPipnexSuggestion = async (suggestion: PipnexSuggestion) => {
        // MaxLoss intentionally omitted — SL handles loss protection now
        const { Lot, PipStep, CloseProfit, MinProfitPercent, MaxLevels, Martingale } = suggestion;
        const values = { Lot, PipStep, CloseProfit, MinProfitPercent, MaxLevels, Martingale };

        let ok = 0;
        let fail = 0;
        for (const [key, value] of Object.entries(values)) {
            try {
                await sendCommand(`PipNex_${key}`, value as number | boolean);
                ok++;
            } catch (err) {
                console.error(`Quantum AI: failed PipNex_${key}`, err);
                fail++;
            }
        }
        setPipnexSettings(prev => ({ ...prev, ...values }));
        if (fail === 0) {
            toast.success(`✅ Quantum AI applied ${ok} PipNex settings`);
        } else {
            toast.warning(`Applied ${ok}/${ok + fail} PipNex settings`);
        }
    };

    // ─── Quantum AI: Apply NOVA suggestions ─────────────────
    const applyNovaSuggestion = async (suggestion: NovaSuggestion) => {
        const { LotSize, SwingStrength, RewardRisk, MaxPositions } = suggestion;
        const values = { LotSize, SwingStrength, RewardRisk, MaxPositions };

        let ok = 0;
        let fail = 0;
        for (const [key, value] of Object.entries(values)) {
            try {
                await sendCommand(`Nova_${key}`, value as number);
                ok++;
            } catch (err) {
                console.error(`Quantum AI: failed Nova_${key}`, err);
                fail++;
            }
        }
        setNovaSettings(prev => ({ ...prev, ...values }));
        if (fail === 0) {
            toast.success(`✅ Quantum AI applied ${ok} NOVA settings`);
        } else {
            toast.warning(`Applied ${ok}/${ok + fail} NOVA settings`);
        }
    };

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
        toast.success(`${key} ${checked ? 'enabled' : 'disabled'}`);
    };

    // ─── EA Not Configured ───────────────────────────────────
    if (!vpsAddress) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6 flex items-center justify-center">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-8 max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 mb-4">
                        <AlertCircle size={28} className="text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">EA Not Configured</h2>
                    <p className="text-slate-400 text-sm mb-4">
                        Please contact the administrator to set up your VPS and EA configuration.
                    </p>
                    <button
                        onClick={() => refreshUserInfo(true)}
                        disabled={refreshingUser}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshingUser ? 'animate-spin' : ''} />
                        {refreshingUser ? 'Refreshing...' : 'Refresh VPS Info'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-5">

                {/* ─── TRIGGER ALERT BANNER ───────────────────────── */}
                {triggerAlert && (
                    <div className={`rounded-2xl p-4 border flex items-center gap-3 backdrop-blur ${
                        triggerAlert === 'sl_hit'
                            ? 'bg-gradient-to-r from-rose-900/40 to-red-900/20 border-rose-500/50 text-rose-200'
                            : 'bg-gradient-to-r from-emerald-900/40 to-green-900/20 border-emerald-500/50 text-emerald-200'
                    }`}>
                        <div className={`p-2 rounded-xl ${
                            triggerAlert === 'sl_hit'
                                ? 'bg-rose-500/20 border border-rose-500/30'
                                : 'bg-emerald-500/20 border border-emerald-500/30'
                        }`}>
                            {triggerAlert === 'sl_hit'
                                ? <TrendingDown size={20} className="text-rose-400" />
                                : <TrendingUp size={20} className="text-emerald-400" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm uppercase tracking-wider">
                                {triggerAlert === 'sl_hit' ? 'Stop Loss Hit' : 'Target Profit Hit'}
                            </div>
                            <div className="text-xs opacity-80 mt-0.5">
                                {triggerAlert === 'sl_hit'
                                    ? `Your algo was stopped automatically to protect your account.`
                                    : `Your algo was stopped automatically — profit target reached.`}
                            </div>
                        </div>
                        <button
                            onClick={() => setTriggerAlert(null)}
                            className="text-xs underline opacity-70 hover:opacity-100 flex-shrink-0"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <BarChart3 className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                                Trading Dashboard
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Live account · EA control · Risk management
                            </p>
                        </div>
                    </div>

                    {/* EA Status Card */}
                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur ${
                        eaConnected === null
                            ? 'bg-slate-800/60 border-slate-700/50'
                            : eaConnected
                                ? 'bg-emerald-900/20 border-emerald-500/30'
                                : 'bg-rose-900/20 border-rose-500/30'
                    }`}>
                        {eaConnected === null ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-500/40 border-t-slate-300 rounded-full animate-spin" />
                                <span className="text-slate-300 text-xs font-semibold">Checking EA...</span>
                            </>
                        ) : eaConnected ? (
                            <>
                                <Wifi size={16} className="text-emerald-400" />
                                <div>
                                    <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                        EA Connected
                                    </div>
                                    <div className="text-slate-500 text-[10px]">
                                        {vpsAddress}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <WifiOff size={16} className="text-rose-400" />
                                <div>
                                    <div className="text-rose-400 text-xs font-bold uppercase tracking-wider">
                                        EA Disconnected
                                    </div>
                                    <div className="text-slate-500 text-[10px]">
                                        Check VPS or EA
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ─── ACCOUNT INFO STRIP ─────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {accessKey && (
                        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-xl p-4 border border-slate-700/50 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex-shrink-0">
                                <Key size={14} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    Access Key
                                </div>
                                <code className="text-white font-mono text-xs truncate block">
                                    {accessKey}
                                </code>
                            </div>
                        </div>
                    )}
                    <div className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-xl p-4 border flex items-center gap-3 ${
                        vpsAddress ? 'border-slate-700/50' : 'border-amber-500/40'
                    }`}>
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                            vpsAddress
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                                : 'bg-gradient-to-br from-amber-500 to-orange-600'
                        }`}>
                            <Server size={14} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                VPS Address
                            </div>
                            <div className="flex items-center gap-2">
                                <code className={`font-mono text-xs truncate ${
                                    vpsAddress ? 'text-white' : 'text-amber-400'
                                }`}>
                                    {vpsAddress || 'Pending assignment...'}
                                </code>
                                <button
                                    onClick={() => refreshUserInfo(true)}
                                    disabled={refreshingUser}
                                    className="text-slate-500 hover:text-blue-400 transition disabled:opacity-50 flex-shrink-0"
                                    title="Refresh VPS info"
                                >
                                    <RefreshCw size={12} className={refreshingUser ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── ACCOUNT STATS ──────────────────────────────── */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="text-center">
                            <div className="w-10 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-400 text-xs">Loading account data...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-rose-900/20 border border-rose-500/30 rounded-2xl p-4 text-rose-400 flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span className="text-sm">{error}</span>
                        <button onClick={refetch} className="ml-auto text-xs underline">Retry</button>
                    </div>
                ) : account ? (
                    <AccountStats
                        balance={account.balance}
                        equity={account.equity}
                        profit={account.equity - account.balance}
                        currency={account.currency || '$'}
                    />
                ) : null}

                {/* ─── RISK GUARD ─────────────────────────────────── */}
                <div className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border overflow-hidden transition-all ${
                    riskSession?.is_active
                        ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-700/50'
                }`}>
                    <div className="px-5 py-4 border-b border-slate-700/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                                riskSession?.is_active
                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-lg shadow-emerald-600/20'
                                    : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-600/20'
                            }`}>
                                <Shield size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    Risk Guard
                                    {riskSession?.is_active && (
                                        <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 normal-case tracking-normal">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            ACTIVE
                                        </span>
                                    )}
                                </h2>
                                <p className="text-slate-500 text-[10px] mt-0.5">
                                    Auto-stops your algo when SL or TP is hit
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] text-rose-400 uppercase tracking-wider font-bold mb-1.5">
                                    <TrendingDown size={11} />
                                    Stop Loss ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={riskSession?.is_active ? (riskSession.sl_amount ?? '') : slInput}
                                    onChange={(e) => setSlInput(e.target.value)}
                                    placeholder="e.g. 100"
                                    disabled={riskSession?.is_active}
                                    className="w-full bg-slate-900/60 border border-rose-500/30 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Algo stops if equity drops by this amount
                                </p>
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1.5">
                                    <TrendingUp size={11} />
                                    Take Profit ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={riskSession?.is_active ? (riskSession.tp_amount ?? '') : tpInput}
                                    onChange={(e) => setTpInput(e.target.value)}
                                    placeholder="e.g. 200"
                                    disabled={riskSession?.is_active}
                                    className="w-full bg-slate-900/60 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Algo stops when equity rises by this amount
                                </p>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════ */}
                        {/*  AUTO-CLOSE TOGGLE (NEW)                     */}
                        {/* ═══════════════════════════════════════════ */}
                        <div className={`mt-5 rounded-xl border p-4 transition-all ${
                            autoCloseEnabled
                                ? 'bg-gradient-to-br from-rose-900/20 to-slate-900/40 border-rose-500/40 shadow-lg shadow-rose-500/10'
                                : 'bg-slate-900/40 border-slate-700/40'
                        }`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`p-1.5 rounded-lg flex-shrink-0 border ${
                                        autoCloseEnabled
                                            ? 'bg-rose-500/20 border-rose-500/40'
                                            : 'bg-slate-800/60 border-slate-700/40'
                                    }`}>
                                        <Sparkles size={14} className={autoCloseEnabled ? "text-rose-300" : "text-slate-500"} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                                Auto-Close Positions
                                            </span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                                autoCloseEnabled
                                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                                    : 'bg-slate-800/60 text-slate-400 border-slate-700/40'
                                            }`}>
                                                {autoCloseEnabled ? '● Enabled' : '○ Disabled'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                            When ON, all open positions close automatically if Stop Loss or Take Profit hits, or the algo stops. Leave OFF to manage closes manually.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAutoCloseEnabled(!autoCloseEnabled)}
                                    aria-pressed={autoCloseEnabled}
                                    aria-label="Toggle auto-close"
                                    className={`relative inline-flex items-center flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 shadow-lg ${
                                        autoCloseEnabled
                                            ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/40'
                                            : 'bg-slate-700 shadow-slate-900/40'
                                    } cursor-pointer hover:scale-105 active:scale-95`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                                            autoCloseEnabled ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                    >
                                        {autoCloseEnabled ? (
                                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {riskSession?.is_active && riskCurrent && (
                            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                                        Start Balance
                                    </div>
                                    <div className="font-mono text-sm text-white font-bold">
                                        ${riskSession.starting_balance.toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                                        Current Equity
                                    </div>
                                    <div className="font-mono text-sm text-white font-bold">
                                        ${riskCurrent.equity.toFixed(2)}
                                    </div>
                                </div>
                                <div className={`rounded-xl p-3 border ${
                                    riskCurrent.raw_drawdown > 0
                                        ? 'bg-rose-900/20 border-rose-500/30'
                                        : 'bg-slate-900/60 border-slate-700/40'
                                }`}>
                                    <div className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold mb-1">
                                        Drawdown
                                    </div>
                                    <div className={`font-mono text-sm font-bold ${
                                        riskCurrent.raw_drawdown > 0 ? 'text-rose-400' : 'text-slate-500'
                                    }`}>
                                        ${riskCurrent.raw_drawdown.toFixed(2)}
                                        {riskSession.sl_amount && (
                                            <span className="text-[10px] opacity-60 ml-1">
                                                / ${riskSession.sl_amount.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`rounded-xl p-3 border ${
                                    riskCurrent.raw_profit > 0
                                        ? 'bg-emerald-900/20 border-emerald-500/30'
                                        : 'bg-slate-900/60 border-slate-700/40'
                                }`}>
                                    <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-1">
                                        Profit
                                    </div>
                                    <div className={`font-mono text-sm font-bold ${
                                        riskCurrent.raw_profit > 0 ? 'text-emerald-400' : 'text-slate-500'
                                    }`}>
                                        ${riskCurrent.raw_profit.toFixed(2)}
                                        {riskSession.tp_amount && (
                                            <span className="text-[10px] opacity-60 ml-1">
                                                / ${riskSession.tp_amount.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {riskSession?.is_active && (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
                                <Clock size={10} />
                                Started at {new Date(riskSession.created_at || '').toLocaleTimeString()} · Values locked until you stop all algos
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── QUANTUM AI ─────────────────────────────────── */}
                {account && (
                    <QuantumAICard
                        balance={account.balance}
                        equity={account.equity}
                        positions={positions}
                        riskSession={riskSession}
                        onApplyPipnex={applyPipnexSuggestion}
                        onApplyNova={applyNovaSuggestion}
                        disabled={!eaConnected}
                    />
                )}

                {/* ─── COMMAND ERROR ──────────────────────────────── */}
                {commandError && (
                    <div className="bg-rose-900/20 border border-rose-500/30 rounded-2xl p-3 text-rose-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{commandError}</span>
                    </div>
                )}

                {/* ─── STRATEGY CARDS ─────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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

            {/* ─── FIRST-VISIT WELCOME MODAL ─────────────────────── */}
            {showWelcomeGuide && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl max-w-lg w-full p-6 md:p-8 relative">
                        <button
                            onClick={dismissWelcomeGuide}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                        >
                            <XIcon size={20} />
                        </button>

                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-600/30">
                                <BookOpen className="text-white" size={32} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white text-center mb-2">
                            Welcome to PipTrader AI
                        </h2>
                        <p className="text-slate-400 text-sm text-center mb-6">
                            You're all set up. Here's what you need to know.
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-3 bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                <div className="p-1.5 bg-emerald-500/20 rounded-lg flex-shrink-0 border border-emerald-500/30">
                                    <Shield size={14} className="text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white mb-0.5">Set Risk Guard first</div>
                                    <div className="text-[11px] text-slate-400">Enter Stop Loss and Take Profit amounts</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                <div className="p-1.5 bg-blue-500/20 rounded-lg flex-shrink-0 border border-blue-500/30">
                                    <Play size={14} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white mb-0.5">Click Start Algo</div>
                                    <div className="text-[11px] text-slate-400">Enable PipNex or NOVA to begin trading</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                <div className="p-1.5 bg-purple-500/20 rounded-lg flex-shrink-0 border border-purple-500/30">
                                    <Activity size={14} className="text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white mb-0.5">Track performance</div>
                                    <div className="text-[11px] text-slate-400">Monitor trades in Orders and History pages</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 mb-6 flex items-start gap-2">
                            <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-200">
                                Need more help? Check out the full User Guide anytime from the top bar.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={goToGuide}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-4 rounded-xl transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
                            >
                                <BookOpen size={18} />
                                Read the Guide
                            </button>
                            <button
                                onClick={dismissWelcomeGuide}
                                className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-3 px-4 rounded-xl transition border border-slate-700/60"
                            >
                                I'm Ready to Trade
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ---- Settings Definitions ----
// NOTE: MaxLoss removed from PipNex — SL handles loss protection now
const PIPNEX_SETTINGS = [
    { key: 'Lot', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.01 },
    { key: 'PipStep', label: 'Pip Step', type: 'number', step: 1, min: 1, default: 10 },
    { key: 'CloseProfit', label: 'Close Profit ($)', type: 'number', step: 0.05, min: 0, default: 2.0 },
    { key: 'MinProfitPercent', label: 'Min Profit %', type: 'number', step: 1, min: 0, max: 100, default: 60 },
    { key: 'MaxLevels', label: 'Max Levels', type: 'number', step: 1, min: 1, default: 20 },
    { key: 'Martingale', label: 'Martingale', type: 'checkbox', default: false },
];

const NOVA_SETTINGS = [
    { key: 'LotSize', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.05 },
    { key: 'SwingStrength', label: 'Swing Strength', type: 'number', step: 1, min: 1, default: 30 },
    { key: 'RewardRisk', label: 'Reward/Risk', type: 'number', step: 0.1, min: 0.1, default: 3.0 },
    { key: 'MaxPositions', label: 'Max Positions', type: 'number', step: 1, min: 1, default: 5 },
];

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
        <div className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border transition-all duration-300 overflow-hidden ${
            enabled
                ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : 'border-slate-700/50 hover:border-slate-600/60'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>

            <div className="p-5 border-b border-slate-700/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl text-2xl ${
                            enabled
                                ? 'bg-gradient-to-br from-emerald-600/30 to-teal-700/30 ring-1 ring-emerald-500/40'
                                : 'bg-slate-800/60'
                        }`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{label}</h3>
                            <p className="text-slate-400 text-xs">{description}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onToggle(type, !enabled)}
                        disabled={isToggling || disabled}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                            enabled
                                ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-600/20'
                                : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white shadow-emerald-600/20'
                        } ${(isToggling || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isToggling ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Working...
                            </>
                        ) : enabled ? (
                            <>
                                <Square size={16} /> Stop Algo
                            </>
                        ) : (
                            <>
                                <Play size={16} /> Start Algo
                            </>
                        )}
                    </button>
                </div>
                {enabled && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Algorithm Running
                    </div>
                )}
                {disabled && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        <AlertTriangle size={12} />
                        EA Offline
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Zap size={12} className="text-blue-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        Parameters
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {settingsDef.map((setting) => {
                        const isBool = setting.type === 'checkbox';
                        const rawValue = localInputs[setting.key] ?? String(settings[setting.key] ?? setting.default);
                        const currentValue = settings[setting.key] ?? setting.default;
                        const isChanged = currentValue !== setting.default;

                        if (isBool) {
                            const checked = !!settings[setting.key];
                            return (
                                <div
                                    key={setting.key}
                                    className={`bg-slate-900/40 rounded-xl p-3.5 border transition-all ${
                                        checked
                                            ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                            : 'border-slate-700/40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                                {setting.label}
                                            </div>
                                            <div className={`text-[11px] font-bold uppercase tracking-wider ${
                                                checked ? 'text-emerald-400' : 'text-slate-500'
                                            }`}>
                                                {checked ? '● ON' : '○ OFF'}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onCheckboxChange(type, setting.key, !checked)}
                                            disabled={disabled}
                                            aria-pressed={checked}
                                            aria-label={`Toggle ${setting.label}`}
                                            className={`relative inline-flex items-center flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 shadow-lg ${
                                                checked
                                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/40'
                                                    : 'bg-slate-700 shadow-slate-900/40'
                                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                                                    checked ? 'translate-x-7' : 'translate-x-0'
                                                }`}
                                            >
                                                {checked ? (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={setting.key}
                                className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-700/40 hover:border-slate-600/60 transition-all"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {setting.label}
                                    </label>
                                    {isChanged && (
                                        <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/30 font-bold">
                                            changed
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={rawValue}
                                    onChange={(e) => onInputChange(type, setting.key, e.target.value)}
                                    onBlur={() => onInputBlur(type, setting.key)}
                                    disabled={disabled}
                                    className="w-full bg-slate-950/60 border border-slate-600/60 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition disabled:opacity-50"
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

export default Dashboard;
