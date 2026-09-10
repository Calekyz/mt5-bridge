import { Router } from 'express';
import { fetchAccount } from '../../services/SocketBridgeApi';
import { query } from '../../db';
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

router.get('/account', authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const result = await query(
            'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
            [userId]
        );
        const vpsAccount = result.rows[0];
        if (!vpsAccount || !vpsAccount.vps_address) {
            return res.status(404).json({ error: 'No VPS assigned to this user' });
        }

        const account = await fetchAccount(vpsAccount.vps_address);
        res.json(account);
    } catch (error) {
        console.error('Account route error:', error);
        next(error);
    }
});

export default router;
