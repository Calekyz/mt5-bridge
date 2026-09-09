import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import axios from 'axios';

const router = Router();

router.get('/ea/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const result = await query(
            'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const vpsAccount = result.rows[0];
        if (!vpsAccount || !vpsAccount.vps_address) {
            return res.json({ connected: false, reason: 'No VPS configured' });
        }
        try {
            await axios.get(`${vpsAccount.vps_address}/v1/account`, { timeout: 5000 });
            return res.json({ connected: true });
        } catch (error: any) {
            return res.json({ connected: false, reason: error.message });
        }
    } catch (error) {
        console.error('EA status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
