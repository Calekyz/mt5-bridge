import { Router } from 'express';
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
router.post('/track/prices', authMiddleware, async (req: AuthRequest, res, next) => {
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
        const resultTrack = await postTrackPrices(body, vpsAccount.vps_address);
        res.json(resultTrack);
    } catch (error) {
        console.error('Track prices error:', error);
        next(error);
    }
});

// POST /track/ohlc
router.post('/track/ohlc', authMiddleware, async (req: AuthRequest, res, next) => {
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
        const resultTrack = await postTrackOhlc(body, vpsAccount.vps_address);
        res.json(resultTrack);
    } catch (error) {
        console.error('Track OHLC error:', error);
        next(error);
    }
});

// POST /track/mbook
router.post('/track/mbook', authMiddleware, async (req: AuthRequest, res, next) => {
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
        const resultTrack = await postTrackMbook(body, vpsAccount.vps_address);
        res.json(resultTrack);
    } catch (error) {
        console.error('Track mbook error:', error);
        next(error);
    }
});

// POST /track/orders
router.post('/track/orders', authMiddleware, async (req: AuthRequest, res, next) => {
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
        const resultTrack = await postTrackOrders(body, vpsAccount.vps_address);
        res.json(resultTrack);
    } catch (error) {
        console.error('Track orders error:', error);
        next(error);
    }
});

export default router;
