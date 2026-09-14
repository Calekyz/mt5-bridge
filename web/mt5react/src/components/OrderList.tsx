import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Activity, TrendingUp, TrendingDown, X, RefreshCw,
    Clock, AlertCircle, Zap, DollarSign,
    Layers, Target, Shield, XCircle, CheckCircle2, Square
} from 'lucide-react';
import { getOrders, closeOrder, type OrderResponse } from '../api/nodejsApiClient';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

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

const SWEEP_COOLDOWN_MS = 5000;    // retry every 5s while positions remain
const SWEEP_FRESHNESS_MIN = 15;    // don't sweep sessions older than 15 min

export const OrdersList: React.FC = () => {
    const [orders, setOrders] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [closing, setClosing] = useState<number | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // ─── Close All State ────────────────────────────────────
    const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
    const [closingAll, setClosingAll] = useState(false);
    const [closeAllProgress, setCloseAllProgress] = useState({ current: 0, total: 0 });

    // ─── Risk Guard Auto-Close State ────────────────────────
    const [riskSession, setRiskSession] = useState<RiskSession | null>(null);
    const autoCloseInProgressRef = useRef(false);
    const lastSweepAttemptRef = useRef<number>(0);
    const sweepToastShownRef = useRef<Set<number>>(new Set());

    // ★ Per-session sweep state: 'pending' = sweeping, 'completed' = done (locked)
    const sweepStateRef = useRef<Map<number, 'pending' | 'completed'>>(new Map());

    const userStr = localStorage.getItem('user');
    let vpsAddress = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            vpsAddress = user.vps_address;
        } catch (e) {}
    }

    const fetchOrders = async (silent = false) => {
        if (!vpsAddress) return;
        try {
            if (!silent) setRefreshing(true);
            const data = await getOrders();
            setOrders(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err: any) {
            if (!silent) setError(err.message || "Failed to fetch orders");
        } finally {
            setLoading(false);
            if (!silent) setRefreshing(false);
        }
    };

    const fetchRiskStatus = async () => {
        if (!vpsAddress) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/risk/status`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setRiskSession(data.session || null);
        } catch {
            // silent
        }
    };

    // Poll orders every 1 second
    useEffect(() => {
        if (!vpsAddress) return;
        fetchOrders();
        const interval = setInterval(() => fetchOrders(true), 1000);
        return () => clearInterval(interval);
    }, [vpsAddress]);

    // Poll risk status every 2 seconds
    useEffect(() => {
        if (!vpsAddress) return;
        fetchRiskStatus();
        const interval = setInterval(fetchRiskStatus, 2000);
        return () => clearInterval(interval);
    }, [vpsAddress]);

    // ─── Close single order ──────────────────────────────────
    const handleClose = async (ticket: number) => {
        if (!window.confirm(`Close position #${ticket}?`)) return;

        setClosing(ticket);
        try {
            await closeOrder(ticket);
            toast.success(`Position #${ticket} closed`);
            await fetchOrders(true);
        } catch (err: any) {
            toast.error(`Failed to close: ${err.message}`);
        } finally {
            setClosing(null);
        }
    };

    // ─── Shared Close All performer ──────────────────────────
    const performCloseAll = async (
        reason: 'manual' | 'stop_loss' | 'take_profit' | 'algo_stopped' = 'manual'
    ) => {
        const opened = orders?.opened || [];
        if (opened.length === 0) return;

        setClosingAll(true);
        setCloseAllProgress({ current: 0, total: opened.length });

        let succeeded = 0;
        let failed = 0;

        for (let i = 0; i < opened.length; i++) {
            const ticket = opened[i].ticket;
            try {
                await closeOrder(ticket);
                succeeded++;
            } catch (err: any) {
                console.error(`Failed to close #${ticket}:`, err);
                failed++;
            }
            setCloseAllProgress({ current: i + 1, total: opened.length });
        }

        setClosingAll(false);
        setShowCloseAllConfirm(false);
        setCloseAllProgress({ current: 0, total: 0 });

        const prefix =
            reason === 'stop_loss'    ? '🛑 Auto-close (SL hit): ' :
            reason === 'take_profit'  ? '🎯 Auto-close (TP hit): ' :
            reason === 'algo_stopped' ? '⏹️ Auto-close (Algo stopped): ' :
            '';

        if (failed === 0) {
            toast.success(
                `${prefix}${succeeded} position${succeeded !== 1 ? 's' : ''} closed`,
                { autoClose: reason !== 'manual' ? 8000 : 3000 }
            );
        } else if (succeeded === 0) {
            toast.error(`${prefix}Failed to close ${failed} position${failed !== 1 ? 's' : ''}`);
        } else {
            toast.warning(`${prefix}Closed ${succeeded}/${succeeded + failed} (${failed} failed)`);
        }

        await fetchOrders(true);
    };

    // ─── Manual Close All (with confirm) ─────────────────────
    const handleCloseAll = async () => {
        const opened = orders?.opened || [];
        if (opened.length === 0) {
            toast.info('No open positions to close');
            setShowCloseAllConfirm(false);
            return;
        }
        await performCloseAll('manual');
    };

    // ─── UNIFIED AUTO-CLOSE SWEEP ────────────────────────────
    useEffect(() => {
        if (!riskSession) return;
        if (riskSession.is_active) return;

        const sessionId = riskSession.id;

        const reason = riskSession.trigger_reason;
        const isSL = reason === 'sl_hit';
        const isTP = reason === 'tp_hit';
        const isStop = !reason;

        if (!isSL && !isTP && !isStop) return;

        if (isSL && (!riskSession.sl_amount || riskSession.sl_amount <= 0)) return;
        if (isTP && (!riskSession.tp_amount || riskSession.tp_amount <= 0)) return;

        const stamp = riskSession.triggered_at || riskSession.created_at;
        if (stamp) {
            const ageMinutes = (Date.now() - new Date(stamp).getTime()) / 60000;
            if (ageMinutes > SWEEP_FRESHNESS_MIN) return;
        }

        const opened = orders?.opened || [];

        // ★ If positions are gone, mark sweep as COMPLETE (if it was pending)
        if (opened.length === 0) {
            const state = sweepStateRef.current.get(sessionId);
            if (state === 'pending') {
                sweepStateRef.current.set(sessionId, 'completed');
                console.log(`[Sweep] Session ${sessionId} — completed, subsequent positions are user-owned`);
            }
            return;
        }

        // ★ If sweep already completed for this session, leave new positions alone
        const state = sweepStateRef.current.get(sessionId);
        if (state === 'completed') return;

        if (autoCloseInProgressRef.current) return;
        if (Date.now() - lastSweepAttemptRef.current < SWEEP_COOLDOWN_MS) return;

        lastSweepAttemptRef.current = Date.now();
        autoCloseInProgressRef.current = true;

        // Mark as pending (so we can detect completion later)
        sweepStateRef.current.set(sessionId, 'pending');

        const label = isSL ? 'Stop Loss' : isTP ? 'Take Profit' : 'Algo Stopped';
        const emoji = isSL ? '🛑' : isTP ? '🎯' : '⏹️';

        if (!sweepToastShownRef.current.has(sessionId)) {
            sweepToastShownRef.current.add(sessionId);
            toast.warning(
                `${emoji} ${label} — auto-closing ${opened.length} position${opened.length !== 1 ? 's' : ''}...`,
                { autoClose: 6000, position: 'top-center' }
            );
        }

        performCloseAll(isSL ? 'stop_loss' : isTP ? 'take_profit' : 'algo_stopped').finally(() => {
            autoCloseInProgressRef.current = false;
        });
    }, [riskSession, orders]);

    const getOrderType = (order: any) => {
        if (order.type) {
            return order.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
        }
        return order.price_current >= order.price_open ? "BUY" : "SELL";
    };

    const opened = orders?.opened || [];
    const pending = orders?.pending || [];

    const stats = useMemo(() => {
        let totalProfit = 0;
        let winners = 0;
        let losers = 0;
        let totalVolume = 0;
        opened.forEach((o) => {
            totalProfit += o.profit || 0;
            totalVolume += o.volume || 0;
            if ((o.profit || 0) > 0) winners++;
            else if ((o.profit || 0) < 0) losers++;
        });
        return {
            total: opened.length,
            pending: pending.length,
            winners,
            losers,
            totalProfit,
            totalVolume,
        };
    }, [opened, pending]);

    // ─── Trigger status ─────────────────────────────────────
    const slTriggered = !!(
        riskSession &&
        !riskSession.is_active &&
        riskSession.trigger_reason === 'sl_hit' &&
        riskSession.sl_amount &&
        riskSession.sl_amount > 0
    );

    const tpTriggered = !!(
        riskSession &&
        !riskSession.is_active &&
        riskSession.trigger_reason === 'tp_hit' &&
        riskSession.tp_amount &&
        riskSession.tp_amount > 0
    );

    const algoStopped = !!(
        riskSession &&
        !riskSession.is_active &&
        !riskSession.trigger_reason &&
        (opened.length > 0 || closingAll)
    );

    const anyTriggered = slTriggered || tpTriggered || algoStopped;

    const isSL = slTriggered;
    const isTP = tpTriggered;
    const isStop = algoStopped;

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

    if (loading && !orders) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Loading positions...</p>
                </div>
            </div>
        );
    }

    if (error && !orders) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-6">
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl px-8 py-6 max-w-md text-center">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                    <p className="text-red-300 font-bold mb-1">Error Loading Orders</p>
                    <p className="text-red-400/70 text-sm mb-4">{error}</p>
                    <button
                        onClick={() => fetchOrders()}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl shadow-lg shadow-emerald-600/20">
                            <Layers className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
                                Open Positions
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Live positions · Auto-refresh every 1s
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                Updated {lastUpdated.toLocaleTimeString()}
                            </div>
                        )}
                        <button
                            onClick={() => fetchOrders()}
                            disabled={refreshing || closingAll}
                            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* ─── SL / TP / STOP TRIGGERED BANNER ────────────── */}
                {anyTriggered && (
                    <div className={`rounded-2xl border p-4 flex items-start gap-3 backdrop-blur transition-all ${
                        closingAll
                            ? 'bg-gradient-to-r from-amber-900/40 to-orange-900/20 border-amber-500/50'
                            : opened.length === 0
                                ? 'bg-gradient-to-r from-emerald-900/40 to-green-900/20 border-emerald-500/50'
                                : isSL
                                    ? 'bg-gradient-to-r from-rose-900/40 to-red-900/20 border-rose-500/50'
                                    : isTP
                                        ? 'bg-gradient-to-r from-blue-900/40 to-teal-900/20 border-blue-500/50'
                                        : 'bg-gradient-to-r from-amber-900/40 to-yellow-900/20 border-amber-500/50'
                    }`}>
                        <div className={`p-2 rounded-xl border flex-shrink-0 ${
                            closingAll
                                ? 'bg-amber-500/20 border-amber-500/30'
                                : opened.length === 0
                                    ? 'bg-emerald-500/20 border-emerald-500/30'
                                    : isSL
                                        ? 'bg-rose-500/20 border-rose-500/30'
                                        : isTP
                                            ? 'bg-blue-500/20 border-blue-500/30'
                                            : 'bg-amber-500/20 border-amber-500/30'
                        }`}>
                            {closingAll ? (
                                <RefreshCw size={20} className="text-amber-400 animate-spin" />
                            ) : opened.length === 0 ? (
                                <CheckCircle2 size={20} className="text-emerald-400" />
                            ) : isSL ? (
                                <TrendingDown size={20} className="text-rose-400" />
                            ) : isTP ? (
                                <TrendingUp size={20} className="text-blue-400" />
                            ) : (
                                <Square size={20} className="text-amber-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`font-bold text-sm uppercase tracking-wider ${
                                closingAll
                                    ? 'text-amber-200'
                                    : opened.length === 0
                                        ? 'text-emerald-200'
                                        : isSL
                                            ? 'text-rose-200'
                                            : isTP
                                                ? 'text-blue-200'
                                                : 'text-amber-200'
                            }`}>
                                {closingAll
                                    ? `${isSL ? 'Stop Loss' : isTP ? 'Take Profit' : 'Algo Stopped'} — Auto-Closing Positions`
                                    : opened.length === 0
                                        ? `${isSL ? 'Stop Loss' : isTP ? 'Take Profit' : 'Algo Stopped'} Handled — All Positions Closed`
                                        : `${isSL ? 'Stop Loss' : isTP ? 'Take Profit' : 'Algo Stopped'} — Positions Still Open`}
                            </div>
                            <div className={`text-xs mt-0.5 ${
                                closingAll
                                    ? 'text-amber-300/80'
                                    : opened.length === 0
                                        ? 'text-emerald-300/80'
                                        : isSL
                                            ? 'text-rose-300/80'
                                            : isTP
                                                ? 'text-blue-300/80'
                                                : 'text-amber-300/80'
                            }`}>
                                {closingAll ? (
                                    <>
                                        Closing {closeAllProgress.current} of {closeAllProgress.total} position{closeAllProgress.total !== 1 ? 's' : ''}...
                                    </>
                                ) : opened.length === 0 ? (
                                    <>
                                        {isSL && (
                                            <>
                                                Your Risk Guard stopped the algo at $
                                                {riskSession?.sl_amount?.toFixed(2)} drawdown.
                                                All positions have been closed automatically.
                                            </>
                                        )}
                                        {isTP && (
                                            <>
                                                Target profit of ${riskSession?.tp_amount?.toFixed(2)} hit.
                                                All positions have been closed automatically.
                                            </>
                                        )}
                                        {isStop && (
                                            <>
                                                Algo was stopped manually. All positions
                                                have been closed automatically.
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className="font-bold">{opened.length}</span>{' '}
                                        position{opened.length !== 1 ? 's' : ''} still open — auto-close in progress.
                                    </>
                                )}
                            </div>
                        </div>
                        {!closingAll && opened.length > 0 && (
                            <button
                                onClick={() => setShowCloseAllConfirm(true)}
                                className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg shadow-rose-600/30"
                            >
                                <XCircle size={14} strokeWidth={2.5} />
                                Close All Now
                            </button>
                        )}
                    </div>
                )}

                {/* ─── SUMMARY STATS ──────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Open</span>
                            <Activity size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                        <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-emerald-400">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                {stats.winners} in profit
                            </span>
                            <span className="flex items-center gap-1 text-rose-400">
                                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                                {stats.losers} in loss
                            </span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending</span>
                            <Clock size={16} className="text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.pending}</div>
                        <div className="mt-2 text-xs text-slate-500">
                            {stats.pending > 0 ? "Awaiting trigger" : "No pending orders"}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total P/L</span>
                            {stats.totalProfit >= 0 ? (
                                <TrendingUp size={16} className="text-emerald-400" />
                            ) : (
                                <TrendingDown size={16} className="text-rose-400" />
                            )}
                        </div>
                        <div className={`text-2xl font-bold ${
                            stats.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}>
                            {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">Floating P&L</div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Volume</span>
                            <Target size={16} className="text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalVolume.toFixed(2)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">Total lots open</div>
                    </div>
                </div>

                {/* ─── EMPTY STATE ────────────────────────────────── */}
                {opened.length === 0 && pending.length === 0 ? (
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 p-16 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/60 mb-4">
                            <Shield size={36} className="text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">No Open Positions</h3>
                        <p className="text-slate-400 text-sm">
                            Your account has no active trades right now.
                        </p>
                        <p className="text-slate-500 text-xs mt-3 flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            Watching for new positions...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ─── OPEN POSITIONS TABLE ──────────────────── */}
                        {opened.length > 0 && (
                            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-700/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                            Active Positions
                                        </h2>
                                        <span className="text-xs text-slate-500">
                                            ({opened.length})
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setShowCloseAllConfirm(true)}
                                        disabled={closingAll || closing !== null}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                            closingAll || closing !== null
                                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95'
                                        }`}
                                    >
                                        {closingAll ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Closing {closeAllProgress.current}/{closeAllProgress.total}
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={14} strokeWidth={2.5} />
                                                Close All ({opened.length})
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-900/60 border-b border-slate-700/50">
                                            <tr>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ticket</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Symbol</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Side</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Volume</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current</th>
                                                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">P/L</th>
                                                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {opened.map((order, idx) => {
                                                const orderType = getOrderType(order);
                                                const isBuy = orderType === "BUY";
                                                const isProfit = order.profit >= 0;
                                                const isClosing = closing === order.ticket;
                                                const isDisabled = closingAll || (closing !== null && !isClosing);
                                                return (
                                                    <tr
                                                        key={order.ticket}
                                                        className={`border-t border-slate-700/20 hover:bg-slate-800/40 transition-colors ${
                                                            idx % 2 === 0 ? "bg-slate-900/20" : ""
                                                        } ${isClosing ? "opacity-50" : ""}`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-xs text-slate-300 bg-slate-800/60 px-2 py-1 rounded">
                                                                #{order.ticket}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-bold text-white">{order.symbol}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${
                                                                isBuy
                                                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                                                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                                            }`}>
                                                                {isBuy ? "▲" : "▼"} {orderType}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-200 font-mono text-xs">
                                                            {order.volume.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                                            {order.price_open.toFixed(5)}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                                            {order.price_current.toFixed(5)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-bold font-mono text-xs ${
                                                            isProfit ? "text-emerald-400" : "text-rose-400"
                                                        }`}>
                                                            {isProfit ? "+" : ""}${order.profit.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleClose(order.ticket)}
                                                                disabled={isClosing || isDisabled}
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                    isClosing || isDisabled
                                                                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                                                        : "bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-lg shadow-rose-600/20 hover:scale-105 active:scale-95"
                                                                }`}
                                                            >
                                                                {isClosing ? (
                                                                    <>
                                                                        <div className="w-3 h-3 border-2 border-slate-400/40 border-t-slate-200 rounded-full animate-spin" />
                                                                        Closing
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <X size={12} strokeWidth={3} />
                                                                        Close
                                                                    </>
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-5 py-3 bg-slate-900/40 border-t border-slate-700/40 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-2">
                                        <Zap size={12} className="text-emerald-400" />
                                        <span className="text-white font-semibold">{opened.length}</span> position{opened.length !== 1 ? "s" : ""} open
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <DollarSign size={12} className={stats.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"} />
                                        Total P/L:
                                        <span className={`font-semibold ${
                                            stats.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                                        }`}>
                                            {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ─── PENDING ORDERS TABLE ──────────────────── */}
                        {pending.length > 0 && (
                            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-700/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-amber-400" />
                                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                            Pending Orders
                                        </h2>
                                        <span className="text-xs text-slate-500">
                                            ({pending.length})
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-900/60 border-b border-slate-700/50">
                                            <tr>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ticket</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Symbol</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Volume</th>
                                                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pending.map((order, idx) => (
                                                <tr
                                                    key={order.ticket}
                                                    className={`border-t border-slate-700/20 hover:bg-slate-800/40 transition-colors ${
                                                        idx % 2 === 0 ? "bg-slate-900/20" : ""
                                                    }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs text-slate-300 bg-slate-800/60 px-2 py-1 rounded">
                                                            #{order.ticket}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-bold text-white">{order.symbol}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                            <Clock size={10} /> {order.type || "PENDING"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-200 font-mono text-xs">
                                                        {order.volume?.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                                        {order.price_open?.toFixed(5)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-5 py-3 bg-slate-900/40 border-t border-slate-700/40 text-xs text-slate-500">
                                    <span className="flex items-center gap-2">
                                        <Clock size={12} className="text-amber-400" />
                                        <span className="text-white font-semibold">{pending.length}</span> order{pending.length !== 1 ? "s" : ""} waiting to trigger
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ─── AUTO-REFRESH INDICATOR ─────────────────────── */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-2 flex-wrap">
                    <span className="inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Live · updates every 1 second
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="inline-flex items-center gap-2">
                        <Shield size={10} className="text-rose-400" />
                        Auto-close sweep on SL / TP / Algo Stop
                    </span>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/*  CLOSE ALL CONFIRMATION MODAL                          */}
            {/* ══════════════════════════════════════════════════════ */}
            {showCloseAllConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-rose-500/40 shadow-2xl max-w-md w-full p-6 relative">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl shadow-lg shadow-rose-600/30">
                                <XCircle className="text-white" size={32} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white text-center mb-2">
                            Close All Positions?
                        </h2>
                        <p className="text-slate-400 text-sm text-center mb-6">
                            This will immediately close{' '}
                            <span className="text-white font-bold">{opened.length}</span>{' '}
                            open position{opened.length !== 1 ? 's' : ''} at market price.
                        </p>

                        <div className="bg-slate-700/30 rounded-xl p-4 mb-6 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Activity size={14} className="text-emerald-400" />
                                    Positions to close
                                </span>
                                <span className="text-white font-bold">{opened.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <DollarSign size={14} className={stats.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"} />
                                    Floating P/L
                                </span>
                                <span className={`font-bold ${
                                    stats.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}>
                                    {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-rose-900/20 border border-rose-500/30 rounded-lg p-3 mb-6 flex items-start gap-2">
                            <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-200">
                                This action cannot be undone. All trades will be closed at current market prices.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleCloseAll}
                                disabled={closingAll}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {closingAll ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Closing {closeAllProgress.current}/{closeAllProgress.total}
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={18} />
                                        Yes, Close All
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowCloseAllConfirm(false)}
                                disabled={closingAll}
                                className="flex-1 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersList;
