import React, { useState, useEffect, useMemo } from 'react';
import {
    Activity, TrendingUp, TrendingDown, X, RefreshCw,
    Clock, AlertCircle, FileText, Zap, DollarSign,
    Layers, Target, Shield
} from 'lucide-react';
import { getOrders, closeOrder, type OrderResponse } from '../api/nodejsApiClient';
import { toast } from 'react-toastify';

export const OrdersList: React.FC = () => {
    const [orders, setOrders] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [closing, setClosing] = useState<number | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);

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

    // Poll every 1 second (was 2s) — still safe for backend
    useEffect(() => {
        if (!vpsAddress) return;

        fetchOrders(); // immediate first fetch
        const interval = setInterval(() => fetchOrders(true), 1000);
        return () => clearInterval(interval);
    }, [vpsAddress]);

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

    const getOrderType = (order: any) => {
        if (order.type) {
            return order.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
        }
        console.warn("Order type missing, using price fallback");
        return order.price_current >= order.price_open ? "BUY" : "SELL";
    };

    const opened = orders?.opened || [];
    const pending = orders?.pending || [];

    // ─── LIVE STATS ──────────────────────────────────────────
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

    // ─── EA Not Configured ───────────────────────────────────
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

    // ─── Loading State ───────────────────────────────────────
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

    // ─── Error State ─────────────────────────────────────────
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
                            disabled={refreshing}
                            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* ─── SUMMARY STATS ──────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {/* Open Positions */}
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

                    {/* Pending */}
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending</span>
                            <Clock size={16} className="text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.pending}</div>
                        <div className="mt-2 text-xs text-slate-500">
                            {stats.pending > 0 ? "⏳ Awaiting trigger" : "No pending orders"}
                        </div>
                    </div>

                    {/* Total Profit */}
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
                        <div className="mt-2 text-xs text-slate-500">
                            Floating P&L
                        </div>
                    </div>

                    {/* Total Volume */}
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Volume</span>
                            <Target size={16} className="text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalVolume.toFixed(2)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                            Total lots open
                        </div>
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
                        {/* ─── OPEN POSITIONS TABLE ──────────────────────── */}
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
                                                return (
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
                                                                disabled={isClosing}
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                    isClosing
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

                                {/* Footer */}
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

                        {/* ─── PENDING ORDERS TABLE ──────────────────────── */}
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
                                                            ⏳ {order.type || "PENDING"}
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
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-2">
                    <span className="inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Live · updates every 1 second
                    </span>
                </div>
            </div>
        </div>
    );
};
