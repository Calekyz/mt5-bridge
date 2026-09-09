import { Router } from 'express';
import { fetchOrderHistory, fetchPriceHistory } from '../../services/SocketBridgeApi';
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

router.get('/history/prices', authMiddleware, async (req: AuthRequest, res, next) => {
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
        const { symbol, time_frame, from_date, to_date } = req.query;
        const prices = await fetchPriceHistory(
            { symbol: symbol as string, time_frame: time_frame as string, from_date: from_date as string, to_date: to_date as string },
            vpsAccount.vps_address
        );
        res.json(prices);
    } catch (error) {
        next(error);
    }
});

export default router;
