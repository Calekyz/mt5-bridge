import { Router } from 'express';
import { fetchAccount } from '../services/SocketBridgeApi';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

router.get('/account', authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;

        // Fetch only existing columns
        let mt5Result;
        try {
            mt5Result = await query(
                'SELECT login, password, server, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                [userId]
            );
        } catch {
            // fallback without vps_address
            mt5Result = await query(
                'SELECT login, password, server FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                [userId]
            );
        }
        const mt5Account = mt5Result.rows[0];

        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        const credentials = {
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: 443, // default port
            vps_address: mt5Account.vps_address || null,
        };

        const account = await fetchAccount(credentials);
        res.json(account);
    } catch (error) {
        console.error('Account route error:', error);
        next(error);
    }
});

export default router;
