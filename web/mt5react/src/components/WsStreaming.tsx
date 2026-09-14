import { useEffect, useState, useRef } from "react";
import {
    Wifi, WifiOff, Radio, TrendingUp, BarChart3, Layers, Bell,
    Activity, RefreshCw, Trash2, Send, Copy, Check, AlertCircle,
    Info, Zap, Search, Pause, Play, Filter, X
} from "lucide-react";

// Use environment variables or fallback to default (works with Render backend)
const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8890";
const BASE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8891/v1";

interface WsMessage {
    id: number;
    timestamp: string;
    data: any;
}

interface OHLCItem {
    time_frame: string;
    symbol: string;
    depth: number;
}

// ─── SINGLETON WebSocket ──────────────────────────────────────
let wsInstance: WebSocket | null = null;
let wsSubscribers: ((msg: WsMessage) => void)[] = [];
let isWsConnected = false;

function createWebSocket() {
    if (wsInstance) return;

    wsInstance = new WebSocket(WS_URL);

    wsInstance.onopen = () => {
        console.log("WebSocket connected");
        isWsConnected = true;
        wsSubscribers.forEach((cb) =>
            cb({
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                data: { system: "connected" },
            })
        );
    };

    wsInstance.onmessage = (event) => {
        try {
            const parsedData = JSON.parse(event.data);
            const newMsg: WsMessage = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                data: parsedData,
            };
            wsSubscribers.forEach((cb) => cb(newMsg));
        } catch (err) {
            console.error("Failed to parse WS message:", err);
        }
    };

    wsInstance.onerror = (event) => {
        console.error("WebSocket error:", event);
        isWsConnected = false;
    };

    wsInstance.onclose = () => {
        console.log("WebSocket disconnected");
        isWsConnected = false;
        wsInstance = null;
        wsSubscribers.forEach((cb) =>
            cb({
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                data: { system: "disconnected" },
            })
        );
    };
}

function subscribeToWs(cb: (msg: WsMessage) => void) {
    wsSubscribers.push(cb);
}

function unsubscribeFromWs(cb: (msg: WsMessage) => void) {
    wsSubscribers = wsSubscribers.filter((subscriber) => subscriber !== cb);
}

// ─── COMPONENT ──────────────────────────────────────────────
export default function WsStreaming() {
    const [symbolsInput, setSymbolsInput] = useState("");
    const [ohlcInput, setOhlcInput] = useState("");
    const [mbookInput, setMbookInput] = useState("");
    const [ordersEnabled, setOrdersEnabled] = useState(true);

    const [messages, setMessages] = useState<WsMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState("prices");
    const [autoScroll, setAutoScroll] = useState(true);
    const [paused, setPaused] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        createWebSocket();

        const handleNewMessage = (msg: WsMessage) => {
            if (paused) return;
            setMessages((prev) => [msg, ...prev].slice(0, 500)); // keep last 500
            if (autoScroll && messageContainerRef.current) {
                messageContainerRef.current.scrollTop = 0;
            }
        };

        subscribeToWs(handleNewMessage);
        setIsConnected(isWsConnected);

        return () => {
            unsubscribeFromWs(handleNewMessage);
        };
    }, [paused, autoScroll]);

    // ─── API CALLS ──────────────────────────────────────────────
    const callAPI = async (endpoint: string, payload: any, description: string) => {
        try {
            const url = `${BASE_API_URL}/${endpoint}`;
            console.log(`Sending to ${description}:`, url);
            console.log(`Payload:`, JSON.stringify(payload, null, 2));

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.text();
            console.log(`${description} response:`, result);
            console.log(`✅ ${description} sent successfully`);
        } catch (error) {
            console.error(`❌ ${description} request failed:`, error);
            alert(`${description} Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handlePricesSubmit = async () => {
        const symbols = symbolsInput
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
        await callAPI("track/prices", { symbols }, "Prices");
    };

    const handleOHLCSubmit = async () => {
        try {
            const entries = ohlcInput.split("|").filter(Boolean);
            const ohlcData: OHLCItem[] = entries.map((entry) => {
                const parts = entry.split(",").map((s) => s.trim());
                if (parts.length !== 3) throw new Error("Invalid format");
                return {
                    time_frame: parts[0],
                    symbol: parts[1].toUpperCase(),
                    depth: parseInt(parts[2]) || 5,
                };
            });
            await callAPI("track/ohlc", { ohlc: ohlcData }, "OHLC");
        } catch (error) {
            alert("Invalid OHLC format. Use: M1,EURUSD,5|M5,GBPUSD,10");
        }
    };

    const handleMbookSubmit = async () => {
        const symbols = mbookInput
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
        await callAPI("track/mbook", { symbols }, "Market Book");
    };

    const handleOrdersSubmit = async () => {
        await callAPI("track/orders", { enabled: String(ordersEnabled) }, "Orders");
    };

    const handleClearAll = () => {
        setSymbolsInput("");
        setOhlcInput("");
        setMbookInput("");
        setMessages([]);
        setSearchTerm("");
    };

    const handleCopyMessage = (msg: WsMessage) => {
        navigator.clipboard.writeText(JSON.stringify(msg.data, null, 2)).then(() => {
            setCopiedId(msg.id);
            setTimeout(() => setCopiedId(null), 2000);
        }).catch(() => {});
    };

    const handleClearMessages = () => {
        setMessages([]);
    };

    // ─── Filtered messages ───────────────────────────────────
    const filteredMessages = searchTerm
        ? messages.filter((m) =>
            JSON.stringify(m.data).toLowerCase().includes(searchTerm.toLowerCase())
        )
        : messages;

    const tabs = [
        { id: "prices", label: "Prices", icon: <TrendingUp size={14} />, color: "blue" },
        { id: "ohlc", label: "OHLC", icon: <BarChart3 size={14} />, color: "emerald" },
        { id: "mbook", label: "Market Book", icon: <Layers size={14} />, color: "purple" },
        { id: "orders", label: "Orders", icon: <Bell size={14} />, color: "amber" },
    ];

    // ─── Get tab styles ──────────────────────────────────────
    const getTabStyles = (tabId: string, color: string) => {
        const isActive = activeTab === tabId;
        if (!isActive) {
            return "text-slate-400 hover:text-white hover:bg-slate-700/40 border border-transparent";
        }
        const colorMap: Record<string, string> = {
            blue: "bg-blue-500/15 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/10",
            emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10",
            purple: "bg-purple-500/15 text-purple-400 border-purple-500/40 shadow-lg shadow-purple-500/10",
            amber: "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10",
        };
        return colorMap[color] || colorMap.blue;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl shadow-lg ${
                            isConnected
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-600/20'
                                : 'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-600/20'
                        }`}>
                            {isConnected ? (
                                <Radio className="text-white animate-pulse" size={22} />
                            ) : (
                                <WifiOff className="text-white" size={22} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                                WebSocket Streaming
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-2 h-2 rounded-full ${
                                    isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                                }`} />
                                <span className={`text-xs font-semibold ${
                                    isConnected ? "text-emerald-400" : "text-rose-400"
                                }`}>
                                    {isConnected ? "Connected" : "Disconnected"}
                                </span>
                                <span className="text-slate-600 text-[10px] font-mono truncate max-w-[200px]">
                                    {WS_URL}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPaused(!paused)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                paused
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25'
                                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                            }`}
                        >
                            {paused ? <Play size={14} /> : <Pause size={14} />}
                            {paused ? "Resume" : "Pause"}
                        </button>
                        <button
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                autoScroll
                                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/40 hover:bg-blue-500/25'
                                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                            }`}
                        >
                            <Zap size={14} />
                            Auto-Scroll
                        </button>
                    </div>
                </div>

                {/* ─── COMMAND PANEL ──────────────────────────────── */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 p-4 border-b border-slate-700/40">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${getTabStyles(tab.id, tab.color)}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-5">
                        {activeTab === "prices" && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp size={16} className="text-blue-400" />
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                                        Track Live Prices
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <input
                                        type="text"
                                        value={symbolsInput}
                                        onChange={(e) => setSymbolsInput(e.target.value)}
                                        placeholder="XAUUSD, EURUSD, BTCUSD"
                                        className="flex-1 min-w-[200px] bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                                        onKeyDown={(e) => e.key === "Enter" && handlePricesSubmit()}
                                    />
                                    <button
                                        onClick={handlePricesSubmit}
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
                                    >
                                        <Send size={14} />
                                        Send
                                    </button>
                                    <button
                                        onClick={() => callAPI("track/prices", { symbols: [] }, "Prices")}
                                        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                                    >
                                        <X size={14} />
                                        Clear
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Info size={11} />
                                    Comma-separated symbols. Press Enter to submit.
                                </p>
                            </div>
                        )}

                        {activeTab === "ohlc" && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 size={16} className="text-emerald-400" />
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                                        Track OHLC Bars
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <input
                                        type="text"
                                        value={ohlcInput}
                                        onChange={(e) => setOhlcInput(e.target.value)}
                                        placeholder="M1,EURUSD,5|M5,GBPUSD,10"
                                        className="flex-1 min-w-[200px] bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition"
                                        onKeyDown={(e) => e.key === "Enter" && handleOHLCSubmit()}
                                    />
                                    <button
                                        onClick={handleOHLCSubmit}
                                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95"
                                    >
                                        <Send size={14} />
                                        Send
                                    </button>
                                    <button
                                        onClick={() => callAPI("track/ohlc", { ohlc: [] }, "OHLC")}
                                        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                                    >
                                        <X size={14} />
                                        Clear
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Info size={11} />
                                    Format: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">timeframe,symbol,depth</code> separated by <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">|</code>
                                </p>
                            </div>
                        )}

                        {activeTab === "mbook" && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Layers size={16} className="text-purple-400" />
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                                        Track Market Book
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <input
                                        type="text"
                                        value={mbookInput}
                                        onChange={(e) => setMbookInput(e.target.value)}
                                        placeholder="EURUSD, GBPUSD, USDJPY"
                                        className="flex-1 min-w-[200px] bg-slate-900/60 border border-slate-600/60 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition"
                                        onKeyDown={(e) => e.key === "Enter" && handleMbookSubmit()}
                                    />
                                    <button
                                        onClick={handleMbookSubmit}
                                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95"
                                    >
                                        <Send size={14} />
                                        Send
                                    </button>
                                    <button
                                        onClick={() => callAPI("track/mbook", { symbols: [] }, "Market Book")}
                                        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                                    >
                                        <X size={14} />
                                        Clear
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Info size={11} />
                                    Depth-of-market data for the listed symbols.
                                </p>
                            </div>
                        )}

                        {activeTab === "orders" && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bell size={16} className="text-amber-400" />
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                                        Track Order Events
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <div className="flex bg-slate-900/60 border border-slate-600/60 rounded-xl p-1">
                                        <button
                                            onClick={() => setOrdersEnabled(true)}
                                            className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                                                ordersEnabled
                                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-600/30'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Enabled
                                        </button>
                                        <button
                                            onClick={() => setOrdersEnabled(false)}
                                            className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                                                !ordersEnabled
                                                    ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/30'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Disabled
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleOrdersSubmit}
                                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-amber-600/20 hover:scale-105 active:scale-95"
                                    >
                                        <Send size={14} />
                                        Send
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Info size={11} />
                                    Stream live trade events (open, close, modify).
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Clear All Footer */}
                    <div className="px-5 py-3 bg-slate-950/40 border-t border-slate-700/40 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <Activity size={10} className="text-blue-400" />
                            {filteredMessages.length} messages in buffer
                        </span>
                        <button
                            onClick={handleClearAll}
                            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-lg font-semibold transition"
                        >
                            <Trash2 size={12} />
                            Clear All
                        </button>
                    </div>
                </div>

                {/* ─── LIVE MESSAGES ──────────────────────────────── */}
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">

                    {/* Messages Header */}
                    <div className="px-5 py-3 border-b border-slate-700/40 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                    paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
                                }`} />
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Live Messages
                                </h3>
                                <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                                    {filteredMessages.length}
                                </span>
                                {paused && (
                                    <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 uppercase font-bold">
                                        Paused
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Search */}
                                <div className="relative flex-1 sm:flex-none sm:w-56">
                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Filter..."
                                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                {/* Clear messages */}
                                <button
                                    onClick={handleClearMessages}
                                    disabled={messages.length === 0}
                                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 px-2.5 py-1.5 rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={11} />
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div
                        ref={messageContainerRef}
                        className="h-96 overflow-y-auto p-4 space-y-2 font-mono text-sm"
                    >
                        {filteredMessages.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-4">
                                    <Radio size={28} className="text-slate-500" />
                                </div>
                                <p className="text-slate-400 text-sm font-semibold mb-1">
                                    {searchTerm ? "No matching messages" : "Waiting for messages"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {searchTerm
                                        ? "Try a different search term"
                                        : "Send a tracking request above to begin"}
                                </p>
                                {!isConnected && (
                                    <div className="mt-4 inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-lg text-xs">
                                        <WifiOff size={12} />
                                        WebSocket not connected
                                    </div>
                                )}
                            </div>
                        ) : (
                            filteredMessages.map(({ id, timestamp, data }) => {
                                const isCopied = copiedId === id;
                                const msgType = data?.type || data?.system || "message";
                                const isSystem = data?.system;

                                return (
                                    <div
                                        key={id}
                                        className={`rounded-xl p-3 border transition-all group ${
                                            isSystem
                                                ? data.system === "connected"
                                                    ? 'bg-emerald-900/15 border-emerald-500/30'
                                                    : 'bg-rose-900/15 border-rose-500/30'
                                                : 'bg-slate-900/40 border-slate-700/40 hover:border-slate-600/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                                #{String(id).slice(-6)}
                                            </span>
                                            <span className="text-slate-500 text-[10px]">
                                                {timestamp}
                                            </span>
                                            {!isSystem && (
                                                <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                    {String(msgType)}
                                                </span>
                                            )}
                                            {isSystem && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    data.system === "connected"
                                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                                }`}>
                                                    {data.system}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleCopyMessage({ id, timestamp, data })}
                                                className="ml-auto text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                                                title="Copy JSON"
                                            >
                                                {isCopied ? (
                                                    <Check size={12} className="text-emerald-400" />
                                                ) : (
                                                    <Copy size={12} />
                                                )}
                                            </button>
                                        </div>
                                        <pre className="text-emerald-300 whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                                            {JSON.stringify(data, null, 2)}
                                        </pre>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-2 bg-slate-950/40 border-t border-slate-700/40 flex flex-col sm:flex-row sm:justify-between gap-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <Zap size={10} className="text-yellow-400" />
                            Newest messages appear at top · Buffer holds last 500
                        </span>
                        <span className="flex items-center gap-1.5">
                            {autoScroll ? (
                                <>
                                    <Check size={10} className="text-emerald-400" />
                                    Auto-scroll enabled
                                </>
                            ) : (
                                <>
                                    <Pause size={10} className="text-amber-400" />
                                    Auto-scroll disabled
                                </>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
