import { Router, Request, Response, NextFunction } from 'express';
import { fetchOrderList, postSendOrder, closeSendOrder } from '../../services/SocketBridgeApi';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

// GET /order/list
router.get('/order/list', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, mt5_port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked' });
        }

        const orders = await fetchOrderList({
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: mt5Account.mt5_port,
        });
        res.json(orders);
    } catch (error) {
        next(error);
    }
});

// POST /order
router.post('/order', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, mt5_port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked' });
        }

        const body = req.body;
        const result = await postSendOrder({
            ...body,
            mt5: {
                login: mt5Account.login,
                password: mt5Account.password,
                server: mt5Account.server,
                port: mt5Account.mt5_port,
            },
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST /order/close
router.post('/order/close', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, mt5_port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked' });
        }

        const body = req.body;
        const result = await closeSendOrder({
            ...body,
            mt5: {
                login: mt5Account.login,
                password: mt5Account.password,
                server: mt5Account.server,
                port: mt5Account.mt5_port,
            },
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
