import { useEffect, useState } from 'react';
import ApexChart from 'react-apexcharts';
import { getHistoricalData } from '../api/nodejsApiClient.ts';
import { CsvExporter } from "./exprotToCsv.tsx";

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

const filterWeekendData = (data: CandlePoint[]): CandlePoint[] => {
    const filteredData: CandlePoint[] = [];
    let continuousIndex = 0;
    for (let i = 0; i < data.length; i++) {
        const date = new Date(data[i].x);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            filteredData.push({
                x: continuousIndex,
                y: data[i].y
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
    const [symbol, setSymbol] = useState('XAUUSD');
    const [isLoading, setIsLoading] = useState(false);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

    const showToast = (message: string, type: 'error' | 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchData = async (tf: string, from: string, to: string, sym: string) => {
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
        fetchData(timeframe, fromDate, toDate, symbol);
    }, [timeframe, fromDate, toDate, symbol]);

    const getOHLCStats = () => {
        if (seriesData.length === 0) return null;
        let high = -Infinity,
            low = Infinity;
        let open = 0,
            close = 0;
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
            background: '#0f172a',
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
        theme: {
            mode: 'dark',
        },
        title: {
            text: `${symbol} | ${TIMEFRAMES.find(tf => tf.value === timeframe)?.label}`,
            align: 'left',
            style: {
                fontSize: '20px',
                fontWeight: '700',
                color: '#f1f5f9',
            },
        },
        subtitle: {
            text: `${fromDate} → ${toDate} • ${seriesData.length} bars`,
            align: 'left',
            style: {
                fontSize: '13px',
                color: '#64748b',
            },
        },
        xaxis: {
            type: 'category',
            categories: customLabels,
            labels: {
                style: {
                    colors: '#94a3b8',
                    fontSize: '11px',
                },
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
                style: {
                    colors: '#94a3b8',
                    fontSize: '11px',
                },
                formatter: (value: number) => value.toFixed(5),
            },
            opposite: false,
        },
        grid: {
            borderColor: '#1e293b',
            strokeDashArray: 3,
            row: {
                colors: ['transparent'],
                opacity: 0.1,
            },
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#22c55e',
                    downward: '#ef4444',
                },
                wick: {
                    useFillColor: true,
                },
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
        legend: {
            show: false,
        },
    };

    const chartSeries = [{ name: symbol, data: seriesData }];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">

                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                        📈 Price Chart
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Interactive candlestick chart with technical analysis tools
                    </p>
                </div>

                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 mb-6">
                    <div className="flex flex-wrap items-end gap-4">

                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                Symbol
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition font-mono"
                                    placeholder="e.g. XAUUSD"
                                />
                                <select
                                    onChange={(e) => setSymbol(e.target.value)}
                                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition cursor-pointer"
                                    style={{ color: '#f1f5f9' }}
                                >
                                    <option value="">Popular</option>
                                    {POPULAR_SYMBOLS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="min-w-[130px]">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                Timeframe
                            </label>
                            <select
                                value={timeframe}
                                onChange={(e) => setTimeframe(e.target.value)}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition cursor-pointer"
                                style={{ color: '#f1f5f9' }}
                            >
                                {TIMEFRAMES.map((tf) => (
                                    <option key={tf.value} value={tf.value}>{tf.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-[140px]">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                From
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                max={toDate}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                            />
                        </div>

                        <div className="min-w-[140px]">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                To
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                min={fromDate}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                            />
                        </div>

                        <div className="min-w-[100px]">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                Export
                            </label>
                            <CsvExporter
                                data={originalData}
                                symbol={symbol}
                                timeframe={timeframe}
                                fromDate={fromDate}
                                toDate={toDate}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {[7, 14, 30, 60, 90, 180, 365].map((days) => (
                            <button
                                key={days}
                                onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - days);
                                    setFromDate(d.toISOString().split('T')[0]);
                                    setToDate(new Date().toISOString().split('T')[0]);
                                }}
                                className="px-3 py-1 text-xs rounded-lg bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 transition"
                            >
                                {days}d
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setFromDate('2024-01-01');
                                setToDate(new Date().toISOString().split('T')[0]);
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 transition"
                        >
                            YTD
                        </button>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex items-center gap-3 text-slate-400">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            Loading chart data...
                        </div>
                    </div>
                )}

                {!isLoading && seriesData.length > 0 && (
                    <>
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-1 overflow-hidden">
                            <ApexChart
                                options={options}
                                series={chartSeries}
                                type="candlestick"
                                height={550}
                            />
                        </div>

                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Open</div>
                                    <div className="text-white font-mono text-sm">{stats.open.toFixed(5)}</div>
                                </div>
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">High</div>
                                    <div className="text-emerald-400 font-mono text-sm">{stats.high.toFixed(5)}</div>
                                </div>
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Low</div>
                                    <div className="text-red-400 font-mono text-sm">{stats.low.toFixed(5)}</div>
                                </div>
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Close</div>
                                    <div className="text-white font-mono text-sm">{stats.close.toFixed(5)}</div>
                                </div>
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Change</div>
                                    <div className={`font-mono text-sm ${stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(5)}
                                    </div>
                                </div>
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Change %</div>
                                    <div className={`font-mono text-sm ${stats.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {toast && (
                    <div
                        className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 backdrop-blur-sm transition-all duration-300 ${
                            toast.type === 'error'
                                ? 'bg-red-900/80 border-l-red-500 text-red-200'
                                : 'bg-green-900/80 border-l-green-500 text-green-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="mr-3">{toast.type === 'error' ? '⚠️' : '✅'}</span>
                                <p className="font-medium">{toast.message}</p>
                            </div>
                            <button onClick={() => setToast(null)} className="ml-4 text-slate-400 hover:text-white transition">
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
