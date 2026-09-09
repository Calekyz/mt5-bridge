import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import axios from 'axios';

const router = Router();

router.get('/ea/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        const mt5Result = await query(
            'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];
        if (!mt5Account || !mt5Account.vps_address) {
            return res.json({ connected: false, reason: 'No VPS configured' });
        }

        const vpsUrl = mt5Account.vps_address;
        try {
            const response = await axios.get(`${vpsUrl}/v1/account`, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' },
            });
            return res.json({ connected: true });
        } catch (error: any) {
            return res.json({ connected: false, reason: error.message });
        }
    } catch (error) {
        console.error('EA status check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
