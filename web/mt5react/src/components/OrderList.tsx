import React, { useState } from "react";
import { getOrders, closeOrder, type OrderResponse } from "../api/nodejsApiClient";
import { usePolling } from "../hooks/usePolling";
import { toast } from "react-toastify";

export const OrdersList: React.FC = () => {
    const [orders, setOrders] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [closing, setClosing] = useState<number | null>(null);

    const fetchOrders = async () => {
        try {
            const data = await getOrders();
            setOrders(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    // Poll every 2 seconds
    usePolling(fetchOrders, 2000);

    const handleClose = async (ticket: number) => {
        setClosing(ticket);
        try {
            await closeOrder(ticket);
            toast.success(`Order #${ticket} closed successfully`);
            await fetchOrders(); // immediate refresh
        } catch (err: any) {
            toast.error(`Failed to close order: ${err.message}`);
        } finally {
            setClosing(null);
        }
    };

    if (loading && !orders) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-white text-xl">Loading orders...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-red-500 text-xl">Error: {error}</div>
            </div>
        );
    }

    const opened = orders?.opened || [];
    const pending = orders?.pending || [];

    // Helper to get order direction from type
    const getOrderType = (order: any) => {
        // If type exists, use it: 0 = BUY, 1 = SELL
        if (order.type !== undefined) {
            return order.type === 0 ? "BUY" : "SELL";
        }
        // Fallback: if price_current > price_open, it's likely a BUY
        // But this is not reliable! Better to fix the API.
        return order.price_current >= order.price_open ? "BUY" : "SELL";
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Open Positions</h2>
                        <p className="text-green-100 text-sm">Live data - refreshes every 2 seconds</p>
                    </div>
                    <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {opened.length} Open • {pending.length} Pending
                    </span>
                </div>

                {opened.length === 0 && pending.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-xl">No open orders</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Ticket</th>
                                    <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Symbol</th>
                                    <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Type</th>
                                    <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Volume</th>
                                    <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Open Price</th>
                                    <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Current Price</th>
                                    <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Profit</th>
                                    <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {opened.map((order) => {
                                    const orderType = getOrderType(order);
                                    return (
                                        <tr key={order.ticket} className="border-t border-gray-700 hover:bg-gray-700/30 transition">
                                            <td className="px-4 py-3 text-white font-mono">#{order.ticket}</td>
                                            <td className="px-4 py-3 text-white font-bold">{order.symbol}</td>
                                            <td className={`px-4 py-3 font-bold ${orderType === "BUY" ? "text-green-400" : "text-red-400"}`}>
                                                {orderType}
                                            </td>
                                            <td className="px-4 py-3 text-white">{order.volume}</td>
                                            <td className="px-4 py-3 text-white">{order.price_open.toFixed(5)}</td>
                                            <td className="px-4 py-3 text-white">{order.price_current.toFixed(5)}</td>
                                            <td className={`px-4 py-3 font-bold ${order.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                ${order.profit.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleClose(order.ticket)}
                                                    disabled={closing === order.ticket}
                                                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-1 rounded-lg text-sm font-semibold transition"
                                                >
                                                    {closing === order.ticket ? "Closing..." : "Close"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="px-6 py-3 bg-gray-700/30 text-gray-400 text-xs flex justify-between">
                    <span>🟢 Auto-refresh active</span>
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    );
};
