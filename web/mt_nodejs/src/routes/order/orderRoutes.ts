import { Router } from 'express';
import { fetchOrderList, postSendOrder, closeSendOrder } from '../../services/SocketBridgeApi';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

router.get('/order/list', authMiddleware, async (req: AuthRequest, res, next) => {
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
        const orders = await fetchOrderList(vpsAccount.vps_address);
        res.json(orders);
    } catch (error) {
        next(error);
    }
});

router.post('/order', authMiddleware, async (req: AuthRequest, res, next) => {
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
        const body = req.body;
        const resultOrder = await postSendOrder(body, vpsAccount.vps_address);
        res.json(resultOrder);
    } catch (error) {
        next(error);
    }
});

router.post('/order/close', authMiddleware, async (req: AuthRequest, res, next) => {
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
        const body = req.body;
        const resultClose = await closeSendOrder(body, vpsAccount.vps_address);
        res.json(resultClose);
    } catch (error) {
        next(error);
    }
});

export default router;
