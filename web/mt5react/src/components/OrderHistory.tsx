import React, { useEffect, useState, useMemo } from "react";
import { getOrderHistory } from "../api/nodejsApiClient";

// Rich interface matching the history API response (positions mode)
interface HistoryOrder {
    symbol: string;
    open_time: number;
    ticket: number;
    type: string;                 // "POSITION_TYPE_BUY" or "POSITION_TYPE_SELL"
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

const OrderHistory: React.FC = () => {
    const [orders, setOrders] = useState<HistoryOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Date filter
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey>("close_time");
    const [sortAsc, setSortAsc] = useState(false);

    // Set default dates (last 30 days)
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setToDate(today.toISOString().split("T")[0]);
        setFromDate(thirtyDaysAgo.toISOString().split("T")[0]);
    }, []);

    // Fetch on mount and when filter changes
    useEffect(() => {
        if (fromDate && toDate) {
            fetchHistory(fromDate, toDate);
        }
    }, [fromDate, toDate]);

    const fetchHistory = async (from: string, to: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getOrderHistory(from, to);
            // The API returns { data: [...] } with the fields above.
            // Cast to HistoryOrder[] (they match)
            setOrders((data.data as unknown) as HistoryOrder[] || []);
        } catch (err: any) {
            console.error("Error fetching order history:", err);
            setError(err.message || "Failed to fetch order history.");
        } finally {
            setLoading(false);
        }
    };

    const handleDateFilter = () => {
        if (fromDate && toDate) {
            fetchHistory(fromDate, toDate);
        }
    };

    const handleReset = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setToDate(today.toISOString().split("T")[0]);
        setFromDate(thirtyDaysAgo.toISOString().split("T")[0]);
    };

    // ─── SORTING ──────────────────────────────────────────
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

    // ─── STATS ────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = orders.length;
        if (total === 0) return null;
        let wins = 0,
            losses = 0;
        let totalProfit = 0,
            totalNet = 0;
        let maxProfit = -Infinity,
            maxLoss = Infinity;
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

    // ─── HELPERS ──────────────────────────────────────────
    const getSide = (type: string) =>
        type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";

    const formatDate = (ts: number) => {
        try {
            return new Date(ts * 1000).toLocaleString();
        } catch {
            return "Invalid Date";
        }
    };

    const formatDuration = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const SortableHeader: React.FC<{ label: string; sortKey: SortKey }> = ({
        label,
        sortKey: key,
    }) => (
        <th
            onClick={() => handleSort(key)}
            style={{
                cursor: "pointer",
                padding: "16px 12px",
                fontSize: "0.8rem",
                fontWeight: "700",
                color: "#94a3b8",
                textAlign: "left",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                userSelect: "none",
                whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
            {label} {sortKey === key ? (sortAsc ? "↑" : "↓") : ""}
        </th>
    );

    // ─── RENDER ────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="text-white text-xl flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Loading order history...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl max-w-md text-center">
                    <div className="text-3xl mb-2">⚠️</div>
                    <p className="font-semibold">Error</p>
                    <p className="text-sm opacity-80">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        📊 Order History
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        View your trading history with detailed statistics
                    </p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase tracking-wider">Total Trades</div>
                            <div className="text-2xl font-bold text-white">{stats.total}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                Wins: {stats.wins} · Losses: {stats.losses}
                            </div>
                        </div>
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase tracking-wider">Win Rate</div>
                            <div className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {stats.winRate >= 50 ? "✅ Profitable" : "📉 Needs improvement"}
                            </div>
                        </div>
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase tracking-wider">Total Profit</div>
                            <div
                                className={`text-2xl font-bold ${
                                    stats.totalProfit >= 0 ? "text-green-400" : "text-red-400"
                                }`}
                            >
                                ${stats.totalProfit.toFixed(2)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Net: ${stats.totalNet.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase tracking-wider">Avg. Trade</div>
                            <div
                                className={`text-2xl font-bold ${
                                    stats.avgProfit >= 0 ? "text-green-400" : "text-red-400"
                                }`}
                            >
                                ${stats.avgProfit.toFixed(2)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Best: +${stats.maxProfit.toFixed(2)} · Worst: ${stats.maxLoss.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Date Filter */}
                <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                From
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                To
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                            />
                        </div>
                        <button
                            onClick={handleDateFilter}
                            disabled={!fromDate || !toDate}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                        >
                            Apply Filter
                        </button>
                        <button
                            onClick={handleReset}
                            className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Table */}
                {sortedOrders.length === 0 ? (
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-12 text-center border border-slate-700/50">
                        <div className="text-5xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-white">No Orders Found</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            No trading orders in the selected date range.
                        </p>
                    </div>
                ) : (
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-800/60">
                                    <tr>
                                        <SortableHeader label="Ticket" sortKey="ticket" />
                                        <SortableHeader label="Symbol" sortKey="symbol" />
                                        <SortableHeader label="Side" sortKey="side" />
                                        <SortableHeader label="Volume" sortKey="volume" />
                                        <SortableHeader label="Open Price" sortKey="open_price" />
                                        <SortableHeader label="Close Price" sortKey="close_price" />
                                        <SortableHeader label="Profit" sortKey="profit" />
                                        <SortableHeader label="Net Profit" sortKey="net_profit" />
                                        <SortableHeader label="Duration" sortKey="duration" />
                                        <SortableHeader label="Time" sortKey="close_time" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedOrders.map((order) => {
                                        const side = getSide(order.type);
                                        const isBuy = side === "BUY";
                                        return (
                                            <tr
                                                key={order.ticket}
                                                className="border-t border-slate-700/30 hover:bg-slate-700/30 transition"
                                            >
                                                <td className="px-3 py-3 text-white font-mono text-xs">
                                                    #{order.ticket}
                                                </td>
                                                <td className="px-3 py-3 text-white font-semibold">
                                                    {order.symbol}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                                            isBuy
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-red-500/20 text-red-400"
                                                        }`}
                                                    >
                                                        {side}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-white">
                                                    {order.volume.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-3 text-white font-mono text-xs">
                                                    {order.open_price.toFixed(5)}
                                                </td>
                                                <td className="px-3 py-3 text-white font-mono text-xs">
                                                    {order.close_price.toFixed(5)}
                                                </td>
                                                <td
                                                    className={`px-3 py-3 font-semibold ${
                                                        order.profit >= 0 ? "text-green-400" : "text-red-400"
                                                    }`}
                                                >
                                                    ${order.profit.toFixed(2)}
                                                </td>
                                                <td
                                                    className={`px-3 py-3 font-semibold ${
                                                        order.net_profit >= 0 ? "text-green-400" : "text-red-400"
                                                    }`}
                                                >
                                                    ${order.net_profit.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-3 text-slate-300 text-xs whitespace-nowrap">
                                                    {formatDuration(order.duration)}
                                                </td>
                                                <td className="px-3 py-3 text-slate-300 text-xs whitespace-nowrap">
                                                    {formatDate(order.close_time)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-2 border-t border-slate-700/30 text-xs text-slate-500 flex justify-between">
                            <span>Showing {sortedOrders.length} orders</span>
                            <span>Last updated: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
