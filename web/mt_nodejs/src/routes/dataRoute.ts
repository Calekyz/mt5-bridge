import { Router } from 'express';
import axios from 'axios';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

// ─── Helper: Get the user's assigned VPS address ──────────
async function getUserVps(userId: number): Promise<string | null> {
    const result = await query(
        'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
        [userId]
    );
    return result.rows[0]?.vps_address || null;
}

// ─── Helper: Call the EA at a specific VPS ────────────────
async function callEA(baseUrl: string, method: 'GET' | 'POST', url: string, data?: any) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    try {
        const response = await axios({
            method,
            url: `${cleanBase}${url}`,
            data,
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
        });
        return response.data;
    } catch (err: any) {
        if (err.response) {
            throw new Error(`EA error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
        }
        throw new Error(`EA unreachable at ${cleanBase}: ${err.message}`);
    }
}

// ─── QUOTE (GET) ──────────────────────────────────────────
router.get('/quote', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const vpsAddress = await getUserVps(req.user!.id);
        if (!vpsAddress) return res.status(400).json({ error: 'No VPS assigned' });

        const symbol = req.query.symbol as string;
        if (!symbol) return res.status(400).json({ error: 'Missing symbol parameter' });

        const data = await callEA(vpsAddress, 'GET', `/v1/quote?symbol=${encodeURIComponent(symbol)}`);
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── SYMBOLS (GET) ────────────────────────────────────────
// ─── SYMBOLS (GET) — fetch LIVE from the user's EA ─────────
// The EA exposes /v1/symbol/list which returns:
//   { symbols: [{ name: "XAUUSD.vcn", trade_mode, description, path }, ...] }
let __symbolsCache: { key: string; symbols: string[]; ts: number } | null = null;

router.get('/symbols', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const vpsAddress = await getUserVps(req.user!.id);
        if (!vpsAddress) return res.json([]);

        // Cache 30s per VPS
        const now = Date.now();
        if (__symbolsCache && __symbolsCache.key === vpsAddress && now - __symbolsCache.ts < 30000) {
            return res.json(__symbolsCache.symbols);
        }

        const data = await callEA(vpsAddress, 'GET', '/v1/symbol/list');

        // Response shape: { symbols: [{ name, trade_mode, description, path }, ...] }
        let symbols: string[] = [];
        if (data && Array.isArray(data.symbols)) {
            symbols = data.symbols
                .map((s: any) => (typeof s === 'string' ? s : s?.name))
                .filter(Boolean);
        } else if (Array.isArray(data)) {
            symbols = data.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
        }

        symbols = Array.from(new Set(symbols)).sort();
        __symbolsCache = { key: vpsAddress, symbols, ts: now };
        res.json(symbols);
    } catch (err: any) {
        console.error('Symbols endpoint error:', err?.message);
        res.json([]);
    }
});

// ─── GLOBAL SET (POST) ────────────────────────────────────
router.post('/global/set', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const vpsAddress = await getUserVps(req.user!.id);
        if (!vpsAddress) return res.status(400).json({ error: 'No VPS assigned' });

        const { name, value } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing required field: name' });

        const data = await callEA(vpsAddress, 'POST', '/v1/global/set', { name, value });
        res.json(data);
    } catch (err: any) {
        console.error('Global set error:', err.message);
        res.status(503).json({ error: err.message || 'EA unreachable or command failed' });
    }
});

export default router;
