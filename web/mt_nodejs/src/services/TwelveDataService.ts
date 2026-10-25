// ═══════════════════════════════════════════════════════════════════
// Twelve Data API service for OHLC candle data
// Free tier: 800 req/day, 8 req/min
// Caches per (symbol, interval) for 60s to stay under limits
// ═══════════════════════════════════════════════════════════════════

const TWELVE_BASE = 'https://api.twelvedata.com';

// ─── Cache ───
interface CacheEntry {
  data: CandleBar[];
  ts: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60s

export interface CandleBar {
  time: string;   // ISO 8601
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ═══════════════════════════════════════════════════════════════════
// SYMBOL MAPPING — broker symbol → Twelve Data symbol
// Examples:
//   XAUUSD.vcn  → XAU/USD
//   EURUSD.m    → EUR/USD
//   BTCUSD      → BTC/USD
// ═══════════════════════════════════════════════════════════════════
const METALS = new Set(['XAU', 'XAG', 'XPT', 'XPD']);
const CRYPTO = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'BNB', 'LTC', 'DOT', 'AVAX', 'MATIC', 'LINK']);

export function mapSymbol(brokerSymbol: string): string {
  // Strip common broker suffixes: .vcn, .m, .pro, .d, .raw, .ecn, .stp, etc.
  let sym = brokerSymbol
    .toUpperCase()
    .replace(/\.(VCN|M|PRO|D|RAW|ECN|STP|CASH|SPOT|IDX|MICRO|MINI|STANDARD)$/i, '')
    .replace(/[^A-Z0-9]/g, '');  // remove any other separators

  // If already formatted with slash, return as-is (uppercase)
  if (brokerSymbol.includes('/')) return brokerSymbol.toUpperCase();

  // Forex / metals: 6 chars (e.g., XAUUSD, EURUSD)
  if (sym.length === 6) {
    const base = sym.slice(0, 3);
    const quote = sym.slice(3);
    if (METALS.has(base) || (base.length === 3 && quote.length === 3)) {
      return `${base}/${quote}`;
    }
  }

  // Crypto: BTCUSD → BTC/USD
  if (sym.length >= 6 && sym.endsWith('USD')) {
    const base = sym.slice(0, -3);
    if (CRYPTO.has(base)) {
      return `${base}/USD`;
    }
  }

  // Indices / stocks — pass through (Twelve Data may need specific tickers)
  // e.g., US30 → DJI (if you want to map explicitly, add here)
  return sym;
}

// ═══════════════════════════════════════════════════════════════════
// TIMEFRAME MAPPING — MT5 timeframe → Twelve Data interval
// ═══════════════════════════════════════════════════════════════════
export function mapInterval(mt5Timeframe: string): string {
  const map: Record<string, string> = {
    M1: '1min',
    M5: '5min',
    M15: '15min',
    M30: '30min',
    H1: '1h',
    H2: '2h',
    H4: '4h',
    H8: '8h',      // Twelve Data doesn't support 8h — fallback to 4h below
    D1: '1day',
    W1: '1week',
    MN1: '1month',
  };

  const upper = mt5Timeframe.toUpperCase();
  const interval = map[upper];
  if (interval) return interval;

  // Unknown → default to 15min
  return '15min';
}

// ═══════════════════════════════════════════════════════════════════
// FETCH — call Twelve Data time_series endpoint
// ═══════════════════════════════════════════════════════════════════
export interface TwelveFetchParams {
  symbol: string;         // broker symbol (e.g., XAUUSD.vcn)
  timeframe: string;      // MT5 timeframe (e.g., M15)
  fromDate?: string;      // YYYY-MM-DD
  toDate?: string;        // YYYY-MM-DD
  count?: number;         // max bars to return (default 500)
}

export async function fetchCandles(params: TwelveFetchParams): Promise<CandleBar[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('TWELVE_DATA_API_KEY not set in environment');
  }

  const tdSymbol = mapSymbol(params.symbol);
  const interval = mapInterval(params.timeframe);
  const cacheKey = `${tdSymbol}|${interval}|${params.fromDate || ''}|${params.toDate || ''}|${params.count || 500}`;

  // ─── Cache hit? ───
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  // ─── Build request ───
  const url = new URL(`${TWELVE_BASE}/time_series`);
  url.searchParams.set('symbol', tdSymbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('order', 'asc');  // oldest → newest for chart
  url.searchParams.set('outputsize', String(Math.min(params.count || 500, 5000)));
  if (params.fromDate) url.searchParams.set('start_date', params.fromDate);
  if (params.toDate) url.searchParams.set('end_date', params.toDate);
  url.searchParams.set('timezone', 'UTC');
  url.searchParams.set('dp', '5');  // 5 decimal places

  console.log(`[TwelveData] Fetching ${tdSymbol} @ ${interval} (${params.count || 500} bars)`);

  // ─── Fetch with timeout ───
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(url.toString(), { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Twelve Data HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const json: any = await response.json();

  // ─── Handle Twelve Data error responses ───
  // They return 200 OK with { status: "error", message, code }
  if (json.status === 'error' || json.code) {
    const msg = json.message || `Twelve Data error (code ${json.code})`;
    // Code 429 = rate limit
    if (json.code === 429) {
      throw new Error('Twelve Data rate limit reached. Try again in 60s.');
    }
    // Code 404 = symbol not found
    if (json.code === 404) {
      throw new Error(`Symbol "${params.symbol}" (${tdSymbol}) not found on Twelve Data`);
    }
    throw new Error(msg);
  }

  if (!json.values || !Array.isArray(json.values)) {
    throw new Error('Twelve Data returned no values array');
  }

  // ─── Parse response to CandleBar[] ───
  const bars: CandleBar[] = json.values
    .map((v: any) => {
      // Twelve Data returns strings — parse to numbers
      const open = parseFloat(v.open);
      const high = parseFloat(v.high);
      const low = parseFloat(v.low);
      const close = parseFloat(v.close);
      const volume = v.volume ? parseFloat(v.volume) : undefined;

      // Datetime: "2024-08-22 15:59:00" (UTC) or "2024-08-22" (daily)
      // Convert to ISO 8601 so frontend `new Date()` parses correctly
      let time = v.datetime;
      if (time && time.includes(' ')) {
        // "2024-08-22 15:59:00" → "2024-08-22T15:59:00Z"
        time = time.replace(' ', 'T') + (time.endsWith('Z') ? '' : 'Z');
      } else if (time && /^\d{4}-\d{2}-\d{2}$/.test(time)) {
        // "2024-08-22" → "2024-08-22T00:00:00Z"
        time = time + 'T00:00:00Z';
      }

      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) return null;
      return { time, open, high, low, close, volume };
    })
    .filter((b: CandleBar | null): b is CandleBar => b !== null);

  // ─── Cache ───
  cache.set(cacheKey, { data: bars, ts: Date.now() });

  console.log(`[TwelveData] ✅ ${bars.length} bars returned for ${tdSymbol}`);

  return bars;
}

// ─── Cache cleanup (run periodically) ───
export function clearOldCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.ts > CACHE_TTL_MS * 10) {
      cache.delete(key);
    }
  }
}
