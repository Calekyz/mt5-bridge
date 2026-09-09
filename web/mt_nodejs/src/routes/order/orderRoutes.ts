import { Router, Request, Response, NextFunction } from 'express';
import { fetchOrderList, postSendOrder, closeSendOrder } from '../../services/SocketBridgeApi';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

// Helper function to get MT5 credentials with fallback
async function getMt5Credentials(userId: number) {
    const mt5Result = await query(
        'SELECT login, password, server, port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
        [userId]
    );
    const account = mt5Result.rows[0];
    if (!account) return null;
    return {
        login: account.login,
        password: account.password,
        server: account.server,
        port: account.port || 443,
    };
}

// GET /order/list
router.get('/order/list', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5 = await getMt5Credentials(userId);
        if (!mt5) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const orders = await fetchOrderList(mt5);
        res.json(orders);
    } catch (error) {
        console.error('Order list error:', error);
        next(error);
    }
});

// POST /order
router.post('/order', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5 = await getMt5Credentials(userId);
        if (!mt5) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const body = req.body;
        const result = await postSendOrder(body, mt5);
        res.json(result);
    } catch (error) {
        console.error('Place order error:', error);
        next(error);
    }
});

// POST /order/close
router.post('/order/close', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5 = await getMt5Credentials(userId);
        if (!mt5) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const body = req.body;
        const result = await closeSendOrder(body, mt5);
        res.json(result);
    } catch (error) {
        console.error('Close order error:', error);
        next(error);
    }
});

export default router;
