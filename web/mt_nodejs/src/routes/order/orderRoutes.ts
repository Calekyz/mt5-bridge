import { Router } from 'express';
import { fetchOrderList, postSendOrder, closeSendOrder } from '../../services/SocketBridgeApi';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

router.get('/order/list', authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, port, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
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
            vps_address: mt5Account.vps_address,
        };

        const orders = await fetchOrderList(credentials);
        res.json(orders);
    } catch (error) {
        console.error('Order list error:', error);
        next(error);
    }
});

router.post('/order', authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, port, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
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
            vps_address: mt5Account.vps_address,
        };

        const body = req.body;
        const result = await postSendOrder(body, credentials);
        res.json(result);
    } catch (error) {
        console.error('Place order error:', error);
        next(error);
    }
});

router.post('/order/close', authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, port, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
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
            vps_address: mt5Account.vps_address,
        };

        const body = req.body;
        const result = await closeSendOrder(body, credentials);
        res.json(result);
    } catch (error) {
        console.error('Close order error:', error);
        next(error);
    }
});

export default router;
