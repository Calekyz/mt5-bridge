import { Router } from 'express';
import { fetchOrderHistory, fetchPriceHistory } from '../../services/SocketBridgeApi';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

router.get('/history/orders', authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        let mt5Result;
        try {
            mt5Result = await query(
                'SELECT login, password, server, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                [userId]
            );
        } catch {
            mt5Result = await query(
                'SELECT login, password, server FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                [userId]
            );
        }
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked' });
        }

        const credentials = {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: 443,
            vps_address: mt5Account.vps_address || null,
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

router.get('/history/prices', authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        let mt5Result;
        try {
            mt5Result = await query(
                'SELECT login, password, server, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                [userId]
            );
        } catch {
            mt5Result = await query(
                'SELECT login, password, server FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                [userId]
            );
        }
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked' });
        }

        const credentials = {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: 443,
            vps_address: mt5Account.vps_address || null,
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
