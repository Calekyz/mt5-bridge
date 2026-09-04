import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// ─── ENVIRONMENT ───────────────────────────────────────────────
const MT5_HOST = process.env.MT5_HOST || 'localhost';
const MT5_PORT = process.env.MT5_PORT || '8890';
const EA_BASE_URL = `http://${MT5_HOST}:${MT5_PORT}/v1`;

// ─── HELPER ────────────────────────────────────────────────────
async function callEA(method: string, url: string, data?: any) {
    try {
        const response = await axios({
            method,
            url: `${EA_BASE_URL}${url}`,
            data,
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
        });
        return response.data;
    } catch (err: any) {
        if (err.response) {
            throw new Error(`EA error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
        }
        throw new Error(`EA unreachable: ${err.message}`);
    }
}

// ─── ACCOUNT ──────────────────────────────────────────────────
router.get('/account', async (req: Request, res: Response) => {
    try {
        const data = await callEA('GET', '/account');
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── QUOTE ────────────────────────────────────────────────────
router.get('/quote', async (req: Request, res: Response) => {
    try {
        const symbol = req.query.symbol;
        if (!symbol) {
            return res.status(400).json({ error: 'Missing symbol parameter' });
        }
        const data = await callEA('GET', `/quote?symbol=${symbol}`);
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── ORDER LIST ──────────────────────────────────────────────
router.get('/order/list', async (req: Request, res: Response) => {
    try {
        const data = await callEA('GET', '/order/list');
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── PLACE ORDER ──────────────────────────────────────────────
router.post('/order', async (req: Request, res: Response) => {
    try {
        const data = await callEA('POST', '/order', req.body);
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── CLOSE ORDER ──────────────────────────────────────────────
router.post('/order/close', async (req: Request, res: Response) => {
    try {
        const data = await callEA('POST', '/order/close', req.body);
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── ORDER HISTORY ────────────────────────────────────────────
router.get('/history/orders', async (req: Request, res: Response) => {
    try {
        const { mode, from_date, to_date } = req.query;
        if (!mode || !from_date || !to_date) {
            return res.status(400).json({ error: 'Missing required params: mode, from_date, to_date' });
        }
        const data = await callEA('GET', `/history/orders?mode=${mode}&from_date=${from_date}&to_date=${to_date}`);
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── HISTORICAL PRICES ────────────────────────────────────────
router.get('/history/prices', async (req: Request, res: Response) => {
    try {
        const { symbol, time_frame, from_date, to_date } = req.query;
        if (!symbol || !time_frame || !from_date || !to_date) {
            return res.status(400).json({ error: 'Missing required params: symbol, time_frame, from_date, to_date' });
        }
        const data = await callEA(
            'GET',
            `/history/prices?symbol=${symbol}&time_frame=${time_frame}&from_date=${from_date}&to_date=${to_date}`
        );
        res.json(data);
    } catch (err: any) {
        res.status(503).json({ error: err.message });
    }
});

// ─── SYMBOLS (auto‑complete) ──────────────────────────────────
router.get('/symbols', async (req: Request, res: Response) => {
    try {
        const data = await callEA('GET', '/symbol/list');
        // Extract symbol names from the response
        if (data && data.symbols && Array.isArray(data.symbols)) {
            const symbolNames = data.symbols.map((s: any) => s.name || s);
            res.json(symbolNames);
        } else {
            res.json([]);
        }
    } catch (err: any) {
        // Fallback: return common symbols if EA unreachable
        res.json([
            'XAUUSD', 'XAUUSD.m', 'EURUSD', 'GBPUSD', 'USDJPY',
            'AUDUSD', 'USDCAD', 'NZDUSD', 'BTCUSD', 'ETHUSD'
        ]);
    }
});

// ─── GLOBAL SET ─── (NEW – for Master EA commands) ────────────
router.post('/global/set', async (req: Request, res: Response) => {
    try {
        const { name, value } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Missing required field: name' });
        }
        const data = await callEA('POST', '/global/set', { name, value });
        res.json(data);
    } catch (err: any) {
        console.error('Global set error:', err.message);
        res.status(503).json({ error: 'EA unreachable or command failed' });
    }
});

export default router;
