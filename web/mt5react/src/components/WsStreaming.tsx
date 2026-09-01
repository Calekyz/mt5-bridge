import { useEffect, useState, useRef } from "react";

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

// ─── SINGLETON WebSocket (reused across components if needed) ──
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
        // Notify subscribers of disconnection
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
    const messageContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        createWebSocket();

        const handleNewMessage = (msg: WsMessage) => {
            setMessages((prev) => [msg, ...prev].slice(0, 200)); // keep last 200
            // Auto-scroll to top (newest messages are at top)
            if (messageContainerRef.current) {
                messageContainerRef.current.scrollTop = 0;
            }
        };

        subscribeToWs(handleNewMessage);
        setIsConnected(isWsConnected);

        return () => {
            unsubscribeFromWs(handleNewMessage);
        };
    }, []);

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
    };

    const tabs = [
        { id: "prices", label: "Prices", color: "blue" },
        { id: "ohlc", label: "OHLC", color: "green" },
        { id: "mbook", label: "Market Book", color: "purple" },
        { id: "orders", label: "Orders", color: "orange" },
    ];

    // ─── RENDER ──────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        📡 WebSocket Streaming
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <div
                            className={`w-3 h-3 rounded-full ${
                                isConnected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-red-500 shadow-lg shadow-red-500/50"
                            } transition-all duration-300`}
                        ></div>
                        <span className="text-slate-300 text-sm font-medium">
                            {isConnected ? "Connected to WebSocket" : "Disconnected"}
                        </span>
                        <span className="text-slate-500 text-xs">
                            {WS_URL}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 mb-6">
                    <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-3">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/30 shadow-lg shadow-${tab.color}-500/10`
                                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4">
                        {activeTab === "prices" && (
                            <div className="space-y-3">
                                <h3 className="text-white font-semibold text-lg">Track Prices</h3>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <input
                                        type="text"
                                        value={symbolsInput}
                                        onChange={(e) => setSymbolsInput(e.target.value)}
                                        placeholder="XAUUSD, EURUSD, BTCUSD"
                                        className="flex-1 min-w-[200px] bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                                        onKeyDown={(e) => e.key === "Enter" && handlePricesSubmit()}
                                    />
                                    <button
                                        onClick={handlePricesSubmit}
                                        className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-medium transition shadow-lg shadow-blue-600/20"
                                    >
                                        Send
                                    </button>
                                    <button
                                        onClick={() => callAPI("track/prices", { symbols: [] }, "Prices")}
                                        className="bg-slate-600 hover:bg-slate-700 px-5 py-2 rounded-lg text-white font-medium transition"
                                    >
                                        Clear Tracking
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "ohlc" && (
                            <div className="space-y-3">
                                <h3 className="text-white font-semibold text-lg">Track OHLC</h3>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <input
                                        type="text"
                                        value={ohlcInput}
                                        onChange={(e) => setOhlcInput(e.target.value)}
                                        placeholder="M1,EURUSD,5|M5,GBPUSD,10"
                                        className="flex-1 min-w-[200px] bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                                        onKeyDown={(e) => e.key === "Enter" && handleOHLCSubmit()}
                                    />
                                    <button
                                        onClick={handleOHLCSubmit}
                                        className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg text-white font-medium transition shadow-lg shadow-green-600/20"
                                    >
                                        Send
                                    </button>
                                    <button
                                        onClick={() => callAPI("track/ohlc", { ohlc: [] }, "OHLC")}
                                        className="bg-slate-600 hover:bg-slate-700 px-5 py-2 rounded-lg text-white font-medium transition"
                                    >
                                        Clear OHLC
                                    </button>
                                </div>
                                <div className="text-xs text-slate-400">
                                    Format: timeframe,symbol,depth | separated
                                </div>
                            </div>
                        )}

                        {activeTab === "mbook" && (
                            <div className="space-y-3">
                                <h3 className="text-white font-semibold text-lg">Track Market Book</h3>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <input
                                        type="text"
                                        value={mbookInput}
                                        onChange={(e) => setMbookInput(e.target.value)}
                                        placeholder="EURUSD, GBPUSD, USDJPY"
                                        className="flex-1 min-w-[200px] bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                                        onKeyDown={(e) => e.key === "Enter" && handleMbookSubmit()}
                                    />
                                    <button
                                        onClick={handleMbookSubmit}
                                        className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg text-white font-medium transition shadow-lg shadow-purple-600/20"
                                    >
                                        Send
                                    </button>
                                    <button
                                        onClick={() => callAPI("track/mbook", { symbols: [] }, "Market Book")}
                                        className="bg-slate-600 hover:bg-slate-700 px-5 py-2 rounded-lg text-white font-medium transition"
                                    >
                                        Clear Tracking
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "orders" && (
                            <div className="space-y-3">
                                <h3 className="text-white font-semibold text-lg">Track Order Events</h3>
                                <div className="flex flex-wrap gap-4 items-center">
                                    <label className="flex items-center gap-2 text-white">
                                        <input
                                            type="radio"
                                            name="orders"
                                            checked={ordersEnabled === true}
                                            onChange={() => setOrdersEnabled(true)}
                                            className="text-orange-500"
                                        />
                                        Enabled
                                    </label>
                                    <label className="flex items-center gap-2 text-white">
                                        <input
                                            type="radio"
                                            name="orders"
                                            checked={ordersEnabled === false}
                                            onChange={() => setOrdersEnabled(false)}
                                            className="text-orange-500"
                                        />
                                        Disabled
                                    </label>
                                    <button
                                        onClick={handleOrdersSubmit}
                                        className="bg-orange-600 hover:bg-orange-700 px-5 py-2 rounded-lg text-white font-medium transition shadow-lg shadow-orange-600/20"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Clear All Button */}
                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
                        <button
                            onClick={handleClearAll}
                            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-5 py-2 rounded-lg font-medium transition border border-red-500/20"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                {/* Messages Display */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                        <h3 className="text-white font-semibold">
                            Live Messages <span className="text-slate-400 text-sm font-normal">({messages.length})</span>
                        </h3>
                        <span className="text-xs text-slate-500">Newest first</span>
                    </div>
                    <div
                        ref={messageContainerRef}
                        className="h-80 overflow-y-auto p-4 font-mono text-sm"
                    >
                        {messages.length === 0 ? (
                            <div className="text-slate-500 text-center py-10">
                                <div className="text-4xl mb-3">📭</div>
                                <p>No messages received yet</p>
                                <p className="text-xs text-slate-600">Send a tracking request above</p>
                            </div>
                        ) : (
                            messages.map(({ id, timestamp, data }) => (
                                <div
                                    key={id}
                                    className="mb-3 bg-slate-700/30 rounded-lg p-3 border border-slate-700/30 hover:border-slate-600 transition"
                                >
                                    <div className="text-slate-400 text-xs mb-1 flex items-center gap-2">
                                        <span className="bg-slate-600 px-2 py-0.5 rounded text-[10px] text-white">
                                            #{id}
                                        </span>
                                        <span>{timestamp}</span>
                                        {data?.type && (
                                            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px]">
                                                {data.type}
                                            </span>
                                        )}
                                    </div>
                                    <pre className="text-emerald-300 whitespace-pre-wrap break-all text-xs">
                                        {JSON.stringify(data, null, 2)}
                                    </pre>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
