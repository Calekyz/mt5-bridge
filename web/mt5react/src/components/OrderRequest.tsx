import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, AlertTriangle, Target,
    Activity, Search, X, Info, Zap, Send, Shield, ChevronRight,
    BarChart3, Percent, CheckCircle2
} from 'lucide-react';
import { getQuote, placeOrder, getSymbols } from "../api/nodejsApiClient";
import { toast } from "react-toastify";

interface OrderRequest {
    symbol: string;
    volume: number;
    order_type: "buy" | "sell";
    deviation: number;
    sl?: number;
    tp?: number;
    comment?: string;
}

interface Quote {
    symbol: string;
    bid: number;
    ask: number;
    flags: number;
    time: string;
    volume: number;
}

const OrderRequestForm: React.FC = () => {
    const [formData, setFormData] = useState<OrderRequest>({
        symbol: "",
        volume: 0.1,
        order_type: "buy",
        deviation: 5,
        sl: undefined,
        tp: undefined,
        comment: "PipTrader trade",
    });

    const [quote, setQuote] = useState<Quote | null>(null);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [symbols, setSymbols] = useState<string[]>([]);
    const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSymbols, setLoadingSymbols] = useState(true);
    const [symbolsSet, setSymbolsSet] = useState<Set<string>>(new Set());

    const userStr = localStorage.getItem('user');
    let vpsAddress = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            vpsAddress = user.vps_address;
        } catch (e) {}
    }

    // ─── Load symbols ────────────────────────────────────────
    useEffect(() => {
        if (!vpsAddress) return;
        const loadSymbols = async () => {
            try {
                const data = await getSymbols();
                setSymbols(data);
                setSymbolsSet(new Set(data.map(s => s.toUpperCase())));
            } catch (error) {
                console.error('Failed to load symbols:', error);
            } finally {
                setLoadingSymbols(false);
            }
        };
        loadSymbols();
    }, [vpsAddress]);

    // ─── Filter symbols ──────────────────────────────────────
    useEffect(() => {
        const input = formData.symbol.toUpperCase();
        if (input.length === 0) {
            setFilteredSymbols(symbols.slice(0, 20));
            return;
        }
        const filtered = symbols.filter(s => s.toUpperCase().includes(input)).slice(0, 20);
        setFilteredSymbols(filtered);
    }, [formData.symbol, symbols]);

    const isSymbolValid = () => {
        if (!formData.symbol) return false;
        return symbolsSet.has(formData.symbol.toUpperCase());
    };

    // ─── Fetch quote when symbol changes ─────────────────────
    useEffect(() => {
        if (formData.symbol.length >= 2 && isSymbolValid() && vpsAddress) {
            fetchQuote();
        } else if (formData.symbol.length >= 2 && !isSymbolValid()) {
            setQuote(null);
            setQuoteError(`Symbol "${formData.symbol}" not recognized. Please select from the dropdown.`);
        } else {
            setQuote(null);
            setQuoteError(null);
        }
    }, [formData.symbol, symbolsSet, vpsAddress]);

    const fetchQuote = async () => {
        if (!formData.symbol || !vpsAddress) return;
        if (!isSymbolValid()) {
            setQuoteError(`Symbol "${formData.symbol}" not recognized.`);
            return;
        }
        setLoadingQuote(true);
        setQuoteError(null);
        try {
            const quoteData = await getQuote(formData.symbol);
            setQuote(quoteData);
        } catch (error) {
            setQuoteError(error instanceof Error ? error.message : "Failed to fetch quote");
            setQuote(null);
        } finally {
            setLoadingQuote(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "volume" || name === "sl" || name === "tp" || name === "deviation"
                ? value === "" ? undefined : parseFloat(value)
                : value,
        }));
        if (name === "symbol") {
            setShowSuggestions(true);
            setQuoteError(null);
        }
    };

    const handleSymbolSelect = (symbol: string) => {
        setFormData(prev => ({ ...prev, symbol }));
        setShowSuggestions(false);
        setQuoteError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vpsAddress) {
            toast.error('VPS not configured');
            return;
        }
        if (!isSymbolValid()) {
            toast.error("Please select a valid symbol from the dropdown.");
            return;
        }
        setSubmitting(true);
        try {
            await placeOrder(formData);
            toast.success("✅ Order placed successfully!");
            // Reset symbol/volume after success but keep settings
            setFormData(prev => ({
                ...prev,
                symbol: "",
                sl: undefined,
                tp: undefined,
            }));
            setQuote(null);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message || "Something went wrong");
            } else {
                toast.error("Failed to place order: Unknown error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getCurrentPrice = () => {
        if (!quote) return null;
        return formData.order_type === "buy" ? quote.ask : quote.bid;
    };

    const getSpread = () => {
        if (!quote) return null;
        return quote.ask - quote.bid;
    };

    // ─── Computed spread as pips ─────────────────────────────
    const spreadPips = useMemo(() => {
        if (!quote) return null;
        const spread = quote.ask - quote.bid;
        // Heuristic: 1 pip = 0.0001 for 5-decimal quotes, 0.01 for 3-decimal (JPY)
        const pipSize = quote.ask > 1000 ? 0.01 : quote.ask > 100 ? 0.01 : 0.0001;
        return spread / pipSize;
    }, [quote]);

    // ─── EA Not Configured ───────────────────────────────────
    if (!vpsAddress) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-6">
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 max-w-md text-center">
                    <AlertTriangle size={40} className="text-yellow-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-white mb-2">EA Not Configured</h2>
                    <p className="text-slate-400 text-sm">
                        Please contact the administrator to set up your VPS and EA configuration.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                        <Send className="text-white" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                            Place Trade Order
                        </h1>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Execute your strategy · Live quotes · Risk managed
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ─── SYMBOL & VOLUME CARD ──────────────────────── */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                                <BarChart3 className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                Order Details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Symbol Input */}
                            <div className="space-y-2 relative">
                                <label className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    <span>Trading Symbol</span>
                                    {loadingSymbols && (
                                        <span className="text-[10px] text-blue-400 animate-pulse normal-case">
                                            Loading...
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="symbol"
                                        placeholder="e.g. XAUUSD"
                                        value={formData.symbol}
                                        onChange={handleChange}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        required
                                        minLength={2}
                                        className={`w-full px-4 py-3 rounded-xl border bg-slate-900/60 text-white placeholder-slate-500 font-mono uppercase text-sm transition-all pr-10 ${
                                            formData.symbol && !isSymbolValid() && formData.symbol.length >= 2
                                                ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                                                : 'border-slate-600/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                                        }`}
                                    />
                                    {formData.symbol && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, symbol: "" }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    {showSuggestions && filteredSymbols.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700/60 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                                            {filteredSymbols.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => handleSymbolSelect(s)}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-600/20 text-white text-sm font-mono transition-colors flex items-center gap-2 border-b border-slate-700/30 last:border-0"
                                                >
                                                    <Search className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                    <span className="flex-1">{s}</span>
                                                    <CheckCircle2 size={12} className="text-slate-600 opacity-0 group-hover:opacity-100" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {formData.symbol && !isSymbolValid() && formData.symbol.length >= 2 && (
                                    <p className="text-xs text-rose-400 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        Symbol not recognized. Select from dropdown.
                                    </p>
                                )}
                                {filteredSymbols.length === 0 && formData.symbol.length > 0 && !loadingSymbols && (
                                    <p className="text-xs text-amber-400">
                                        No matching symbols found.
                                    </p>
                                )}
                            </div>

                            {/* Volume Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Trade Volume (Lots)
                                </label>
                                <input
                                    type="number"
                                    name="volume"
                                    placeholder="e.g. 0.1"
                                    value={formData.volume}
                                    onChange={handleChange}
                                    step="0.01"
                                    min={0.01}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ─── LIVE PRICE CARD ───────────────────────────── */}
                    {formData.symbol.length >= 2 && (
                        <div className="bg-gradient-to-br from-emerald-900/20 via-slate-900/60 to-blue-900/20 backdrop-blur rounded-2xl border border-emerald-500/20 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg">
                                        <Activity className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                        Live Market Price
                                    </h3>
                                </div>
                                {loadingQuote && (
                                    <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                                )}
                                {quote && !loadingQuote && (
                                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        LIVE
                                    </span>
                                )}
                            </div>

                            {quote && !loadingQuote && (
                                <>
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* BID */}
                                        <div className="bg-slate-900/60 rounded-xl p-3 border border-rose-500/20">
                                            <div className="text-[10px] text-rose-300 uppercase tracking-wider mb-1 font-semibold">
                                                BID
                                            </div>
                                            <div className="text-lg md:text-xl font-bold text-rose-400 font-mono">
                                                {quote.bid.toFixed(5)}
                                            </div>
                                        </div>
                                        {/* SPREAD */}
                                        <div className="bg-slate-900/60 rounded-xl p-3 border border-amber-500/20">
                                            <div className="text-[10px] text-amber-300 uppercase tracking-wider mb-1 font-semibold">
                                                SPREAD
                                            </div>
                                            <div className="text-lg md:text-xl font-bold text-amber-400 font-mono">
                                                {getSpread()?.toFixed(5)}
                                            </div>
                                            {spreadPips !== null && (
                                                <div className="text-[10px] text-amber-500/70 mt-0.5">
                                                    {spreadPips.toFixed(1)} pips
                                                </div>
                                            )}
                                        </div>
                                        {/* ASK */}
                                        <div className="bg-slate-900/60 rounded-xl p-3 border border-emerald-500/20">
                                            <div className="text-[10px] text-emerald-300 uppercase tracking-wider mb-1 font-semibold">
                                                ASK
                                            </div>
                                            <div className="text-lg md:text-xl font-bold text-emerald-400 font-mono">
                                                {quote.ask.toFixed(5)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Execution info */}
                                    <div className="mt-3 bg-slate-900/50 rounded-lg p-3 border border-slate-700/40">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">
                                                <Zap size={11} className="inline mr-1 text-yellow-400" />
                                                Execution Price
                                            </span>
                                            <span className="font-mono font-bold text-white">
                                                {getCurrentPrice()?.toFixed(5)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1">
                                            {formData.order_type === "buy"
                                                ? "Buy orders fill at the ASK price"
                                                : "Sell orders fill at the BID price"}
                                        </div>
                                    </div>
                                </>
                            )}

                            {quoteError && (
                                <div className="text-center py-3">
                                    <p className="text-rose-400 text-sm">{quoteError}</p>
                                    {quoteError.includes("not recognized") ? (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Please select a symbol from the dropdown.
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={fetchQuote}
                                            className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                                        >
                                            🔄 Retry Quote
                                        </button>
                                    )}
                                </div>
                            )}

                            {loadingQuote && (
                                <div className="text-center py-3">
                                    <p className="text-slate-400 text-sm animate-pulse">Loading price data...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── DIRECTION & SLIPPAGE CARD ─────────────────── */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                Direction & Execution
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Order Type - Toggle Buttons */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Order Direction
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, order_type: "buy" }))}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                                            formData.order_type === "buy"
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
                                                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                                        }`}
                                    >
                                        <TrendingUp size={16} />
                                        BUY
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, order_type: "sell" }))}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                                            formData.order_type === "sell"
                                                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                                                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                                        }`}
                                    >
                                        <TrendingDown size={16} />
                                        SELL
                                    </button>
                                </div>
                            </div>

                            {/* Slippage */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Percent size={11} />
                                    Slippage Tolerance (Pips)
                                </label>
                                <input
                                    type="number"
                                    name="deviation"
                                    placeholder="e.g. 5"
                                    value={formData.deviation}
                                    onChange={handleChange}
                                    min={0}
                                    step={1}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ─── RISK MANAGEMENT CARD ──────────────────────── */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                Risk Management
                            </h3>
                            <span className="text-[10px] text-slate-500 uppercase">
                                (Optional)
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Stop Loss */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wider">
                                    <AlertTriangle size={12} />
                                    Stop Loss
                                </label>
                                <input
                                    type="number"
                                    name="sl"
                                    placeholder="Optional"
                                    value={formData.sl ?? ""}
                                    onChange={handleChange}
                                    step="0.0001"
                                    min={0}
                                    className="w-full px-4 py-3 rounded-xl border border-rose-700/40 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition-all font-mono"
                                />
                                <p className="text-[10px] text-slate-500">
                                    Close position if price moves against you
                                </p>
                            </div>

                            {/* Take Profit */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                    <Target size={12} />
                                    Take Profit
                                </label>
                                <input
                                    type="number"
                                    name="tp"
                                    placeholder="Optional"
                                    value={formData.tp ?? ""}
                                    onChange={handleChange}
                                    step="0.0001"
                                    min={0}
                                    className="w-full px-4 py-3 rounded-xl border border-emerald-700/40 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                                />
                                <p className="text-[10px] text-slate-500">
                                    Auto-close position when profit target is hit
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ─── COMMENT CARD ──────────────────────────────── */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                            Order Comment
                        </label>
                        <input
                            type="text"
                            name="comment"
                            placeholder="Add a note for this trade..."
                            value={formData.comment ?? ""}
                            onChange={handleChange}
                            maxLength={100}
                            className="w-full px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                            {(formData.comment?.length || 0)}/100 characters
                        </p>
                    </div>

                    {/* ─── ORDER SUMMARY CARD ────────────────────────── */}
                    <div className="bg-gradient-to-br from-blue-900/20 via-slate-900/60 to-indigo-900/20 backdrop-blur rounded-2xl border border-blue-500/20 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                Order Summary
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/40">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Symbol</div>
                                <div className="text-sm font-bold text-white font-mono truncate">
                                    {formData.symbol || "—"}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/40">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Volume</div>
                                <div className="text-sm font-bold text-white font-mono">
                                    {formData.volume || "—"}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/40">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Direction</div>
                                <div className={`text-sm font-bold flex items-center gap-1 ${
                                    formData.order_type === "buy" ? "text-emerald-400" : "text-rose-400"
                                }`}>
                                    {formData.order_type === "buy" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {formData.order_type.toUpperCase()}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/40">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Est. Price</div>
                                <div className="text-sm font-bold text-amber-400 font-mono">
                                    {getCurrentPrice()?.toFixed(5) || "—"}
                                </div>
                            </div>
                        </div>

                        {(formData.sl || formData.tp) && (
                            <div className="mt-3 pt-3 border-t border-slate-700/40 flex flex-wrap gap-4 text-xs">
                                {formData.sl && (
                                    <div className="flex items-center gap-1.5">
                                        <AlertTriangle size={11} className="text-rose-400" />
                                        <span className="text-slate-400">SL:</span>
                                        <span className="text-rose-400 font-mono font-bold">{formData.sl}</span>
                                    </div>
                                )}
                                {formData.tp && (
                                    <div className="flex items-center gap-1.5">
                                        <Target size={11} className="text-emerald-400" />
                                        <span className="text-slate-400">TP:</span>
                                        <span className="text-emerald-400 font-mono font-bold">{formData.tp}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ─── SUBMIT BUTTON ─────────────────────────────── */}
                    <div>
                        <button
                            type="submit"
                            disabled={!isSymbolValid() || submitting}
                            className={`w-full font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform shadow-xl flex items-center justify-center gap-2.5 ${
                                isSymbolValid() && !submitting
                                    ? formData.order_type === 'buy'
                                        ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99]'
                                        : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/30 hover:scale-[1.01] active:scale-[0.99]'
                                    : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-700/40'
                            }`}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Placing Order...
                                </>
                            ) : (
                                <>
                                    {formData.order_type === "buy" ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                    Execute {formData.order_type === "buy" ? "BUY" : "SELL"} Order
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                        {!isSymbolValid() && formData.symbol.length >= 2 && (
                            <p className="text-xs text-rose-400 text-center mt-2">
                                Please select a valid symbol from the dropdown.
                            </p>
                        )}
                        {isSymbolValid() && !submitting && (
                            <p className="text-[10px] text-slate-500 text-center mt-2">
                                <Zap size={10} className="inline mr-1 text-yellow-400" />
                                Order will be sent to your EA instantly
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderRequestForm;
