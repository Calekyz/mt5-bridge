import { Router } from 'express';
import { fetchOrderHistory, fetchPriceHistory } from '../../services/SocketBridgeApi';
import { fetchCandles } from '../../services/TwelveDataService';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

router.get('/history/orders', authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const result = await query(
            'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const vpsAccount = result.rows[0];
        if (!vpsAccount || !vpsAccount.vps_address) {
            return res.status(404).json({ error: 'No VPS assigned to this user' });
        }
        const { mode, from_date, to_date } = req.query;
        const history = await fetchOrderHistory(
            { mode: mode as string, from_date: from_date as string, to_date: to_date as string },
            vpsAccount.vps_address
        );
        res.json(history);
    } catch (error) {
        next(error);
    }
});

// ═══════════════════════════════════════════════════════════════════
// /history/prices — OHLC candles
// Primary: Twelve Data API (works even when EA is offline)
// Fallback: EA /v1/history/prices (if EA ever implements it)
// ═══════════════════════════════════════════════════════════════════
router.get('/history/prices', authMiddleware, async (req: AuthRequest, res, next) => {
    const { symbol, time_frame, from_date, to_date } = req.query;

    if (!symbol || !time_frame) {
        return res.status(400).json({ error: 'Missing symbol or time_frame' });
    }

    const twelveKey = process.env.TWELVE_DATA_API_KEY;

    // ─── Try Twelve Data first (primary source) ───
    if (twelveKey) {
        try {
            const bars = await fetchCandles({
                symbol: symbol as string,
                timeframe: time_frame as string,
                fromDate: from_date as string | undefined,
                toDate: to_date as string | undefined,
                count: 500,
            });

            if (bars.length > 0) {
                console.log(`[/history/prices] ✅ Twelve Data: ${bars.length} bars for ${symbol}`);
                // Frontend expects { data: [{ time, open, high, low, close }] }
                return res.json({ data: bars, source: 'twelvedata' });
            }
        } catch (err: any) {
            console.warn(`[/history/prices] Twelve Data failed: ${err.message} — trying EA fallback`);
        }
    } else {
        console.warn('[/history/prices] TWELVE_DATA_API_KEY not set — falling back to EA');
    }

    // ─── Fallback: try EA ───
    try {
        const userId = req.user!.id;
        const result = await query(
            'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const vpsAccount = result.rows[0];
        if (!vpsAccount?.vps_address) {
            return res.status(503).json({
                error: 'Chart temporarily unavailable. Twelve Data failed and no VPS configured.',
            });
        }

        const prices = await fetchPriceHistory(
            {
                symbol: symbol as string,
                time_frame: time_frame as string,
                from_date: from_date as string,
                to_date: to_date as string,
            },
            vpsAccount.vps_address
        );

        return res.json(prices);
    } catch (err: any) {
        console.error(`[/history/prices] All sources failed: ${err.message}`);
        return res.status(503).json({
            error: `Failed to load candles for ${symbol}. ${err.message}`,
        });
    }
});

export default router;
