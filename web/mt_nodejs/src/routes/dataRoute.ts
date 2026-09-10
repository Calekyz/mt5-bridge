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
async function callEA(baseUrl: string, url: string, data: any) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    try {
        const response = await axios({
            method: 'POST',
            url: `${cleanBase}/v1${url}`,
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

// ─── QUOTE (used by OrderRequest.tsx) ─────────────────────
router.get('/quote', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const vpsAddress = await getUserVps(req.user!.id);
        if (!vpsAddress) return res.status(400).json({ error: 'No VPS assigned' });

        const symbol = req.query.symbol as string;
        if (!symbol) return res.status(400).json({ error: 'Missing symbol parameter' });

        const data = await callEA(vpsAddress, '/quote', { symbol });
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── SYMBOLS (used by OrderRequest.tsx) ────────────────────
router.get('/symbols', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const vpsAddress = await getUserVps(req.user!.id);
        if (!vpsAddress) {
            return res.json([
                'XAUUSD', 'XAUUSD.m', 'EURUSD', 'GBPUSD', 'USDJPY',
                'AUDUSD', 'USDCAD', 'NZDUSD', 'BTCUSD', 'ETHUSD'
            ]);
        }

        const data = await callEA(vpsAddress, '/symbol/list', {});
        if (data && data.symbols && Array.isArray(data.symbols)) {
            const symbolNames = data.symbols.map((s: any) => s.name || s);
            res.json(symbolNames);
        } else {
            res.json([]);
        }
    } catch (err) {
        // Fallback list if EA unreachable
        res.json([
            'XAUUSD', 'XAUUSD.m', 'EURUSD', 'GBPUSD', 'USDJPY',
            'AUDUSD', 'USDCAD', 'NZDUSD', 'BTCUSD', 'ETHUSD'
        ]);
    }
});

// ─── GLOBAL SET (used by Dashboard "Start Algo") ──────────
router.post('/global/set', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const vpsAddress = await getUserVps(req.user!.id);
        if (!vpsAddress) return res.status(400).json({ error: 'No VPS assigned' });

        const { name, value } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing required field: name' });

        const data = await callEA(vpsAddress, '/global/set', { name, value });
        res.json(data);
    } catch (err: any) {
        console.error('Global set error:', err.message);
        res.status(503).json({ error: err.message || 'EA unreachable or command failed' });
    }
});

export default router;
