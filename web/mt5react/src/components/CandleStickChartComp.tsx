import { useEffect, useState } from 'react';
import ApexChart from 'react-apexcharts';
import { getHistoricalData } from '../api/nodejsApiClient';
import { CsvExporter } from "./exprotToCsv";
import {
    BarChart3, TrendingUp, TrendingDown, Activity, RefreshCw,
    Calendar, AlertCircle, Info, Loader2, X,
    Clock, CheckCircle2, LineChart,
} from 'lucide-react';

export interface CandlePoint {
    x: number;
    y: [number, number, number, number];
}

const TIMEFRAMES = [
    { value: 'M1', label: '1 Minute' },
    { value: 'M5', label: '5 Minutes' },
    { value: 'M15', label: '15 Minutes' },
    { value: 'M30', label: '30 Minutes' },
    { value: 'H1', label: '1 Hour' },
    { value: 'H4', label: '4 Hours' },
    { value: 'D1', label: '1 Day' },
    { value: 'W1', label: '1 Week' },
];

const POPULAR_SYMBOLS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'BTCUSD', 'ETHUSD'];

const QUICK_RANGES: { value: number | 'ytd'; label: string }[] = [
    { value: 7, label: '7D' },
    { value: 14, label: '14D' },
    { value: 30, label: '30D' },
    { value: 60, label: '60D' },
    { value: 90, label: '90D' },
    { value: 180, label: '180D' },
    { value: 365, label: '1Y' },
    { value: 'ytd', label: 'YTD' },
];

const filterWeekendData = (data: CandlePoint[]): CandlePoint[] => {
    const filteredData: CandlePoint[] = [];
    let continuousIndex = 0;
    for (let i = 0; i < data.length; i++) {
        const date = new Date(data[i].x);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            filteredData.push({
                x: continuousIndex,
                y: data[i].y,
            });
            continuousIndex++;
        }
    }
    return filteredData;
};

const createCustomLabels = (originalData: CandlePoint[]): string[] => {
    const labels: string[] = [];
    for (let i = 0; i < originalData.length; i++) {
        const date = new Date(originalData[i].x);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            labels.push(date.toLocaleString());
        }
    }
    return labels;
};

export function CandleChart() {
    const [seriesData, setSeriesData] = useState<CandlePoint[]>([]);
    const [originalData, setOriginalData] = useState<CandlePoint[]>([]);
    const [customLabels, setCustomLabels] = useState<string[]>([]);
    const [timeframe, setTimeframe] = useState('H4');
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [symbol, setSymbol] = useState('XAUUSD');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
    const [quickRange, setQuickRange] = useState<number | 'ytd' | null>(30);
    const [refreshKey, setRefreshKey] = useState(0);

    const userStr = localStorage.getItem('user');
    let vpsAddress = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            vpsAddress = user.vps_address;
        } catch (e) {}
    }

    const showToast = (message: string, type: 'error' | 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchData = async (tf: string, from: string, to: string, sym: string) => {
        if (!vpsAddress) return;
        setIsLoading(true);
        try {
            const res = await getHistoricalData(sym, from, to, tf);
            const transformed: CandlePoint[] = res.data.map((item: any) => ({
                x: new Date(item.time).getTime(),
                y: [item.open, item.high, item.low, item.close],
            }));

            setOriginalData(transformed);
            const filtered = filterWeekendData(transformed);
            const labels = createCustomLabels(transformed);
            setSeriesData(filtered);
            setCustomLabels(labels);
            showToast(`Loaded ${filtered.length} bars for ${sym}`, 'success');
        } catch (error: any) {
            showToast(error?.message ?? 'Failed to fetch data', 'error');
            setSeriesData([]);
            setOriginalData([]);
            setCustomLabels([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (vpsAddress) {
            fetchData(timeframe, fromDate, toDate, symbol);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeframe, fromDate, toDate, symbol, vpsAddress, refreshKey]);

    const handleManualRefresh = () => {
        setRefreshKey((k) => k + 1);
    };

    const applyQuickRange = (value: number | 'ytd') => {
        setQuickRange(value);
        if (value === 'ytd') {
            setFromDate('2024-01-01');
            setToDate(new Date().toISOString().split('T')[0]);
        } else {
            const d = new Date();
            d.setDate(d.getDate() - value);
            setFromDate(d.toISOString().split('T')[0]);
            setToDate(new Date().toISOString().split('T')[0]);
        }
    };

    const handleDateChange = (setter: (v: string) => void, value: string) => {
        setter(value);
        setQuickRange(null);
    };

    const getOHLCStats = () => {
        if (seriesData.length === 0) return null;
        let high = -Infinity;
        let low = Infinity;
        let open = 0;
        let close = 0;
        const last = seriesData[seriesData.length - 1];
        const first = seriesData[0];
        if (last) close = last.y[3];
        if (first) open = first.y[0];
        seriesData.forEach((d) => {
            if (d.y[1] > high) high = d.y[1];
            if (d.y[2] < low) low = d.y[2];
        });
        const change = close - open;
        const changePercent = open !== 0 ? (change / open) * 100 : 0;
        return { high, low, open, close, change, changePercent };
    };

    const stats = getOHLCStats();

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'candlestick',
            height: 550,
            background: 'transparent',
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true,
                },
                autoSelected: 'zoom',
            },
            animations: {
                enabled: true,
                speed: 800,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 350 },
            },
            foreColor: '#94a3b8',
        },
        theme: { mode: 'dark' },
        title: {
            text: `${symbol} · ${TIMEFRAMES.find((tf) => tf.value === timeframe)?.label ?? timeframe}`,
            align: 'left',
            style: { fontSize: '18px', fontWeight: '700', color: '#f1f5f9' },
        },
        subtitle: {
            text: `${fromDate} → ${toDate} · ${seriesData.length} bars`,
            align: 'left',
            style: { fontSize: '12px', color: '#64748b' },
        },
        xaxis: {
            type: 'category',
            categories: customLabels,
            labels: {
                style: { colors: '#94a3b8', fontSize: '11px' },
                rotate: -45,
                rotateAlways: true,
                hideOverlappingLabels: true,
            },
            axisBorder: { color: '#1e293b' },
            axisTicks: { color: '#1e293b' },
            tickAmount: 20,
        },
        yaxis: {
            tooltip: { enabled: true },
            labels: {
                style: { colors: '#94a3b8', fontSize: '11px' },
                formatter: (value: number) => value.toFixed(5),
            },
            opposite: false,
        },
        grid: {
            borderColor: '#1e293b',
            strokeDashArray: 3,
            row: { colors: ['transparent'], opacity: 0.1 },
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#22c55e',
                    downward: '#ef4444',
                },
                wick: { useFillColor: true },
            },
        },
        tooltip: {
            theme: 'dark',
            style: { fontSize: '12px' },
            custom: ({ seriesIndex, dataPointIndex, w }) => {
                const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                const label = customLabels[dataPointIndex] || 'N/A';
                return `
                    <div class="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                        <div class="text-slate-400 text-xs mb-2">${label}</div>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div><span class="text-slate-500">Open:</span> <span class="text-white font-mono">${data.y[0].toFixed(5)}</span></div>
                            <div><span class="text-slate-500">High:</span> <span class="text-emerald-400 font-mono">${data.y[1].toFixed(5)}</span></div>
                            <div><span class="text-slate-500">Low:</span> <span class="text-red-400 font-mono">${data.y[2].toFixed(5)}</span></div>
                            <div><span class="text-slate-500">Close:</span> <span class="text-white font-mono">${data.y[3].toFixed(5)}</span></div>
                        </div>
                    </div>
                `;
            },
        },
        legend: { show: false },
    };

    const chartSeries = [{ name: symbol, data: seriesData }];

    // ─── EA Not Configured ───────────────────────────────────
    if (!vpsAddress) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6 flex items-center justify-center">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-8 max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 mb-4">
                        <AlertCircle size={28} className="text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">EA Not Configured</h2>
                    <p className="text-slate-400 text-sm">
                        Please contact the administrator to set up your VPS and EA configuration.
                    </p>
                </div>
            </div>
        );
    }

    // ─── Stat card helper ────────────────────────────────────
    const StatCard: React.FC<{
        label: string;
        value: string;
        accent?: string;
        icon?: React.ReactNode;
    }> = ({ label, value, accent = 'text-white', icon }) => (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-xl p-3 border border-slate-700/50 hover:border-slate-600/70 transition-all">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    {label}
                </span>
                {icon}
            </div>
            <div className={`font-mono text-sm font-bold ${accent}`}>{value}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-5">

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-600 to-blue-700 rounded-xl shadow-lg shadow-emerald-600/20">
                            <BarChart3 className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-emerald-100 to-blue-200 bg-clip-text text-transparent">
                                Price Chart
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Interactive candlesticks · Technical analysis · Live data
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* ─── FILTER CARD ────────────────────────────────── */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
                    {/* Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Symbol */}
                        <div className="lg:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Symbol
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    placeholder="e.g. XAUUSD"
                                    className="flex-1 min-w-0 bg-slate-900/60 border border-slate-600/60 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition font-mono uppercase"
                                />
                                <select
                                    onChange={(e) => e.target.value && setSymbol(e.target.value)}
                                    value=""
                                    className="bg-slate-900/60 border border-slate-600/60 rounded-xl px-2 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="">Popular</option>
                                    {POPULAR_SYMBOLS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Timeframe */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                <Clock size={11} />
                                Timeframe
                            </label>
                            <select
                                value={timeframe}
                                onChange={(e) => setTimeframe(e.target.value)}
                                className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer"
                                style={{ colorScheme: 'dark' }}
                            >
                                {TIMEFRAMES.map((tf) => (
                                    <option key={tf.value} value={tf.value}>{tf.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* From */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                <Calendar size={11} />
                                From
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => handleDateChange(setFromDate, e.target.value)}
                                max={toDate}
                                className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition [color-scheme:dark]"
                            />
                        </div>

                        {/* To */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                <Calendar size={11} />
                                To
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => handleDateChange(setToDate, e.target.value)}
                                min={fromDate}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full bg-slate-900/60 border border-slate-600/60 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition [color-scheme:dark]"
                            />
                        </div>

                        {/* Export */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Export
                            </label>
                            <div className="bg-slate-900/60 border border-slate-600/60 rounded-xl overflow-hidden">
                                <CsvExporter
                                    data={originalData}
                                    symbol={symbol}
                                    timeframe={timeframe}
                                    fromDate={fromDate}
                                    toDate={toDate}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick ranges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-700/40">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-2">
                            Quick Range:
                        </span>
                        {QUICK_RANGES.map((r) => {
                            const isActive = quickRange === r.value;
                            return (
                                <button
                                    key={String(r.value)}
                                    onClick={() => applyQuickRange(r.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20 scale-105'
                                            : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── LOADING ────────────────────────────────────── */}
                {isLoading && (
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 p-20 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-400 text-sm">Loading chart data...</p>
                        </div>
                    </div>
                )}

                {/* ─── CHART ──────────────────────────────────────── */}
                {!isLoading && seriesData.length > 0 && (
                    <>
                        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                            {/* Chart header */}
                            <div className="px-5 py-3 border-b border-slate-700/40 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                        Live Candlesticks
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                        <Activity size={10} className="text-blue-400" />
                                        {seriesData.length} bars
                                    </span>
                                </div>
                            </div>

                            {/* Chart body */}
                            <div className="p-2">
                                <ApexChart
                                    options={options}
                                    series={chartSeries}
                                    type="candlestick"
                                    height={550}
                                />
                            </div>
                        </div>

                        {/* ─── OHLC STATS ──────────────────────────────── */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                <StatCard
                                    label="Open"
                                    value={stats.open.toFixed(5)}
                                    accent="text-white"
                                />
                                <StatCard
                                    label="High"
                                    value={stats.high.toFixed(5)}
                                    accent="text-emerald-400"
                                    icon={<TrendingUp size={12} className="text-emerald-400" />}
                                />
                                <StatCard
                                    label="Low"
                                    value={stats.low.toFixed(5)}
                                    accent="text-rose-400"
                                    icon={<TrendingDown size={12} className="text-rose-400" />}
                                />
                                <StatCard
                                    label="Close"
                                    value={stats.close.toFixed(5)}
                                    accent="text-white"
                                />
                                <StatCard
                                    label="Change"
                                    value={`${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(5)}`}
                                    accent={stats.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                                />
                                <StatCard
                                    label="Change %"
                                    value={`${stats.changePercent >= 0 ? '+' : ''}${stats.changePercent.toFixed(2)}%`}
                                    accent={stats.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                                />
                            </div>
                        )}

                        {/* Footer hint */}
                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 py-2">
                            <Info size={10} className="text-blue-400" />
                            <span>Use the toolbar on the chart to zoom, pan, or download as image</span>
                        </div>
                    </>
                )}

                {/* ─── EMPTY STATE ────────────────────────────────── */}
                {!isLoading && seriesData.length === 0 && (
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 p-16 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/60 mb-4">
                            <LineChart size={36} className="text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">No Chart Data</h3>
                        <p className="text-slate-400 text-sm">
                            No bars found for <span className="text-white font-semibold">{symbol}</span> in the selected range.
                        </p>
                        <p className="text-slate-500 text-xs mt-3">
                            Try a wider date range or a different symbol.
                        </p>
                    </div>
                )}
            </div>

            {/* ─── TOAST ──────────────────────────────────────────── */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-[100] max-w-sm px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3 transition-all duration-300 ${
                        toast.type === 'error'
                            ? 'bg-gradient-to-br from-rose-900/60 to-red-900/40 border-rose-500/50'
                            : 'bg-gradient-to-br from-emerald-900/60 to-green-900/40 border-emerald-500/50'
                    }`}
                >
                    <div
                        className={`p-1.5 rounded-lg flex-shrink-0 border ${
                            toast.type === 'error'
                                ? 'bg-rose-500/20 border-rose-500/30'
                                : 'bg-emerald-500/20 border-emerald-500/30'
                        }`}
                    >
                        {toast.type === 'error' ? (
                            <AlertCircle size={14} className="text-rose-400" />
                        ) : (
                            <CheckCircle2 size={14} className="text-emerald-400" />
                        )}
                    </div>
                    <p
                        className={`flex-1 text-sm font-semibold ${
                            toast.type === 'error' ? 'text-rose-100' : 'text-emerald-100'
                        }`}
                    >
                        {toast.message}
                    </p>
                    <button
                        onClick={() => setToast(null)}
                        className={`flex-shrink-0 transition ${
                            toast.type === 'error'
                                ? 'text-rose-400 hover:text-white'
                                : 'text-emerald-400 hover:text-white'
                        }`}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default CandleChart;
