import { Router, Request, Response, NextFunction } from 'express';
import {
    postTrackPrices,
    postTrackOhlc,
    postTrackMbook,
    postTrackOrders,
} from '../../services/SocketBridgeApi';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

// POST /track/prices
router.post('/track/prices', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, mt5_port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const body = req.body;
        const result = await postTrackPrices(body, {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: mt5Account.mt5_port,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST /track/ohlc
router.post('/track/ohlc', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, mt5_port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const body = req.body;
        const result = await postTrackOhlc(body, {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: mt5Account.mt5_port,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST /track/mbook
router.post('/track/mbook', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, mt5_port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const body = req.body;
        const result = await postTrackMbook(body, {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: mt5Account.mt5_port,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST /track/orders
router.post('/track/orders', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const mt5Result = await query(
            'SELECT login, password, server, mt5_port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const body = req.body;
        const result = await postTrackOrders(body, {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: mt5Account.mt5_port,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
