import React, { useEffect, useState, useMemo } from "react";
import {
    Activity, TrendingUp, TrendingDown, Award, DollarSign,
    Clock, Calendar, ChevronUp, ChevronDown, RefreshCw,
    Target, Zap, ArrowUpDown, BarChart3, AlertCircle
} from "lucide-react";
import { getOrderHistory } from "../api/nodejsApiClient";

interface HistoryOrder {
    symbol: string;
    open_time: number;
    ticket: number;
    type: string;
    volume: number;
    open_price: number;
    sl_price: number;
    sl_pips: number;
    tp_price: number;
    tp_pips: number;
    close_price: number;
    close_time: number;
    duration: number;
    swap: number;
    commission: number;
    profit: number;
    net_profit: number;
    pip_profit: number;
    initiating_order_type: string;
    initiated_by_pending_order: boolean;
    comment: string;
    magic: number;
}

type SortKey = keyof HistoryOrder | "side";
type RangePreset = "24h" | "48h" | "7d" | "30d" | "90d" | "custom";

const OrderHistory: React.FC = () => {
    const [orders, setOrders] = useState<HistoryOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [sortKey, setSortKey] = useState<SortKey>("close_time");
    const [sortAsc, setSortAsc] = useState(false);
    const [preset, setPreset] = useState<RangePreset>("48h");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const userStr = localStorage.getItem('user');
    let vpsAddress = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            vpsAddress = user.vps_address;
        } catch (e) {}
    }

    // Helper: format date to YYYY-MM-DD
    const fmtDate = (d: Date) => d.toISOString().split("T")[0];

    // Apply a preset date range
    const applyPreset = (p: RangePreset) => {
        const today = new Date();
        let from = new Date();

        switch (p) {
            case "24h":
                from.setDate(today.getDate() - 1);
                break;
            case "48h":
                from.setDate(today.getDate() - 2);
                break;
            case "7d":
                from.setDate(today.getDate() - 7);
                break;
            case "30d":
                from.setDate(today.getDate() - 30);
                break;
            case "90d":
                from.setDate(today.getDate() - 90);
                break;
            case "custom":
                // Leave dates as-is for custom
                return;
        }

        setFromDate(fmtDate(from));
        setToDate(fmtDate(today));
        setPreset(p);
    };

    // Initialize with 48h default
    useEffect(() => {
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        setToDate(fmtDate(today));
        setFromDate(fmtDate(twoDaysAgo));
        setPreset("48h");
    }, []);

    // Fetch when dates change
    useEffect(() => {
        if (fromDate && toDate && vpsAddress) {
            fetchHistory(fromDate, toDate);
        }
    }, [fromDate, toDate, vpsAddress]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!fromDate || !toDate || !vpsAddress) return;
        const interval = setInterval(() => {
            fetchHistory(fromDate, toDate, true);
        }, 30000);
        return () => clearInterval(interval);
    }, [fromDate, toDate, vpsAddress]);

    const fetchHistory = async (from: string, to: string, silent = false) => {
        if (!vpsAddress) return;
        try {
            if (!silent) setLoading(true);
            setError(null);
            const data = await getOrderHistory(from, to);
            setOrders((data.data as unknown) as HistoryOrder[] || []);
            setLastUpdated(new Date());
        } catch (err: any) {
            console.error("Error fetching order history:", err);
            if (!silent) setError(err.message || "Failed to fetch order history.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleDateFilter = () => {
        if (fromDate && toDate && vpsAddress) {
            setPreset("custom");
            fetchHistory(fromDate, toDate);
        }
    };

    const handleRefresh = () => {
        if (fromDate && toDate && vpsAddress) {
            fetchHistory(fromDate, toDate);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(false);
        }
    };

    const sortedOrders = useMemo(() => {
        const copy = [...orders];
        if (copy.length === 0) return copy;
        copy.sort((a, b) => {
            let valA: any, valB: any;
            if (sortKey === "side") {
                valA = a.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
                valB = b.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
            } else {
                valA = a[sortKey as keyof HistoryOrder];
                valB = b[sortKey as keyof HistoryOrder];
            }
            if (typeof valA === "string") {
                return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortAsc ? valA - valB : valB - valA;
        });
        return copy;
    }, [orders, sortKey, sortAsc]);

    const stats = useMemo(() => {
        const total = orders.length;
        if (total === 0) return null;
        let wins = 0, losses = 0;
        let totalProfit = 0, totalNet = 0;
        let maxProfit = -Infinity, maxLoss = Infinity;
        orders.forEach((o) => {
            if (o.profit > 0) wins++;
            else losses++;
            totalProfit += o.profit;
            totalNet += o.net_profit;
            if (o.net_profit > maxProfit) maxProfit = o.net_profit;
            if (o.net_profit < maxLoss) maxLoss = o.net_profit;
        });
        const winRate = (wins / total) * 100;
        const avgProfit = totalNet / total;
        return { total, wins, losses, winRate, totalProfit, totalNet, avgProfit, maxProfit, maxLoss };
    }, [orders]);

    const getSide = (type: string) => (type === "POSITION_TYPE_BUY" ? "BUY" : "SELL");

    const formatDate = (ts: number) => {
        try {
            const d = new Date(ts * 1000);
            return d.toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "Invalid Date";
        }
    };

    const formatDuration = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    // ─── Sortable Header ──────────────────────────────────────
    const SortableHeader: React.FC<{ label: string; sortKey: SortKey; align?: "left" | "right" }> = ({
        label, sortKey: key, align = "left"
    }) => (
        <th
            onClick={() => handleSort(key)}
            className={`px-4 py-3.5 text-${align} text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition whitespace-nowrap group`}
        >
            <div className={`flex items-center gap-1.5 ${align === "right" ? "justify-end" : ""}`}>
                <span>{label}</span>
                {sortKey === key ? (
                    sortAsc ? <ChevronUp size={14} className="text-blue-400" /> : <ChevronDown size={14} className="text-blue-400" />
                ) : (
                    <ArrowUpDown size={12} className="text-slate-600 opacity-0 group-hover:opacity-100 transition" />
                )}
            </div>
        </th>
    );

    // ─── Preset Button ────────────────────────────────────────
    const PresetButton: React.FC<{ value: RangePreset; label: string }> = ({ value, label }) => (
        <button
            onClick={() => applyPreset(value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                preset === value
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20 scale-105'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
            }`}
        >
            {label}
        </button>
    );

    // ─── Loading State ────────────────────────────────────────
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

    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Loading order history...</p>
                </div>
            </div>
        );
    }

    if (error && orders.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-6">
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl px-8 py-6 max-w-md text-center">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                    <p className="text-red-300 font-bold mb-1">Error Loading History</p>
                    <p className="text-red-400/70 text-sm mb-4">{error}</p>
                    <button
                        onClick={handleRefresh}
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
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <BarChart3 className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                                Order History
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Closed trades · Live stats · Auto-refresh every 30s
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
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* ─── STATS CARDS ────────────────────────────────── */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {/* Total Trades */}
                        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Trades</span>
                                <Activity size={16} className="text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">{stats.total}</div>
                            <div className="mt-2 flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1 text-emerald-400">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                    {stats.wins} wins
                                </span>
                                <span className="flex items-center gap-1 text-rose-400">
                                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                                    {stats.losses} losses
                                </span>
                            </div>
                        </div>

                        {/* Win Rate */}
                        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Win Rate</span>
                                <Award size={16} className={stats.winRate >= 50 ? "text-emerald-400" : "text-amber-400"} />
                            </div>
                            <div className={`text-2xl font-bold ${
                                stats.winRate >= 60 ? "text-emerald-400"
                                : stats.winRate >= 50 ? "text-blue-400"
                                : stats.winRate >= 40 ? "text-amber-400"
                                : "text-rose-400"
                            }`}>
                                {stats.winRate.toFixed(1)}%
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                {stats.winRate >= 50 ? "✅ Profitable" : "📉 Needs work"}
                            </div>
                        </div>

                        {/* Total Profit */}
                        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Profit</span>
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
                                Net: <span className={stats.totalNet >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                    ${stats.totalNet.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Avg Trade */}
                        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg. Trade</span>
                                <Target size={16} className="text-purple-400" />
                            </div>
                            <div className={`text-2xl font-bold ${
                                stats.avgProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}>
                                {stats.avgProfit >= 0 ? "+" : ""}${stats.avgProfit.toFixed(2)}
                            </div>
                            <div className="mt-2 text-xs flex items-center gap-2">
                                <span className="text-emerald-400">↑ ${stats.maxProfit.toFixed(2)}</span>
                                <span className="text-rose-400">↓ ${stats.maxLoss.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── DATE FILTER ────────────────────────────────── */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
                    {/* Quick presets */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-2">
                            Quick Range:
                        </span>
                        <PresetButton value="24h" label="Last 24h" />
                        <PresetButton value="48h" label="⚡ Last 48h" />
                        <PresetButton value="7d" label="7 days" />
                        <PresetButton value="30d" label="30 days" />
                        <PresetButton value="90d" label="90 days" />
                    </div>

                    {/* Custom date range */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                <Calendar size={12} />
                                From
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => { setFromDate(e.target.value); setPreset("custom"); }}
                                className="bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                <Calendar size={12} />
                                To
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => { setToDate(e.target.value); setPreset("custom"); }}
                                className="bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition [color-scheme:dark]"
                            />
                        </div>
                        <button
                            onClick={handleDateFilter}
                            disabled={!fromDate || !toDate}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-600/20"
                        >
                            Apply Filter
                        </button>
                        <button
                            onClick={() => applyPreset("48h")}
                            className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* ─── TABLE ──────────────────────────────────────── */}
                {sortedOrders.length === 0 ? (
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 p-16 text-center">
                        <div className="text-6xl mb-4 opacity-40">📭</div>
                        <h3 className="text-xl font-bold text-white mb-1">No Orders Found</h3>
                        <p className="text-slate-400 text-sm">
                            No closed trades in the selected date range.
                        </p>
                        <p className="text-slate-500 text-xs mt-3">
                            Try a wider date range or check another preset.
                        </p>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900/60 border-b border-slate-700/50">
                                    <tr>
                                        <SortableHeader label="Ticket" sortKey="ticket" />
                                        <SortableHeader label="Symbol" sortKey="symbol" />
                                        <SortableHeader label="Side" sortKey="side" />
                                        <SortableHeader label="Volume" sortKey="volume" />
                                        <SortableHeader label="Open" sortKey="open_price" />
                                        <SortableHeader label="Close" sortKey="close_price" />
                                        <SortableHeader label="Profit" sortKey="profit" align="right" />
                                        <SortableHeader label="Net" sortKey="net_profit" align="right" />
                                        <SortableHeader label="Duration" sortKey="duration" />
                                        <SortableHeader label="Closed At" sortKey="close_time" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedOrders.map((order, idx) => {
                                        const side = getSide(order.type);
                                        const isBuy = side === "BUY";
                                        const isProfit = order.net_profit >= 0;
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
                                                        {isBuy ? "▲" : "▼"} {side}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-200 font-mono text-xs">
                                                    {order.volume.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                                    {order.open_price.toFixed(5)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                                    {order.close_price.toFixed(5)}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-semibold font-mono text-xs ${
                                                    order.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                                                }`}>
                                                    {order.profit >= 0 ? "+" : ""}${order.profit.toFixed(2)}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold font-mono text-xs ${
                                                    isProfit ? "text-emerald-400" : "text-rose-400"
                                                }`}>
                                                    {isProfit ? "+" : ""}${order.net_profit.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                                                        <Clock size={11} />
                                                        {formatDuration(order.duration)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                                    {formatDate(order.close_time)}
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
                                <Zap size={12} className="text-blue-400" />
                                Showing <span className="text-white font-semibold">{sortedOrders.length}</span> order{sortedOrders.length !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-2">
                                <DollarSign size={12} className="text-emerald-400" />
                                Total Net:
                                <span className={`font-semibold ${
                                    (stats?.totalNet ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}>
                                    ${(stats?.totalNet ?? 0).toFixed(2)}
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
