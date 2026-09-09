import { Router, Request, Response, NextFunction } from 'express';
import { fetchOrderHistory, fetchPriceHistory } from '../../services/SocketBridgeApi';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

// GET /history/orders
router.get('/history/orders', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const credentials = {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: mt5Account.port || 443,
        };

        const { mode, from_date, to_date } = req.query;

        const history = await fetchOrderHistory({
            mode: mode as string,
            from_date: from_date as string,
            to_date: to_date as string,
            mt5: credentials,
        });

        res.json(history);
    } catch (error) {
        console.error('Order history error:', error);
        next(error);
    }
});

// GET /history/prices
router.get('/history/prices', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const credentials = {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: mt5Account.port || 443,
        };

        const { symbol, time_frame, from_date, to_date } = req.query;

        const prices = await fetchPriceHistory({
            symbol: symbol as string,
            time_frame: time_frame as string,
            from_date: from_date as string,
            to_date: to_date as string,
            mt5: credentials,
        });

        res.json(prices);
    } catch (error) {
        console.error('Price history error:', error);
        next(error);
    }
});

export default router;
