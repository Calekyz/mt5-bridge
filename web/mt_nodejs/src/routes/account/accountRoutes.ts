import { Router, Request, Response, NextFunction } from 'express';
import { fetchAccount } from '../../services/SocketBridgeApi';
import { query } from '../../db';       // your DB query function
import { authMiddleware, AuthRequest } from '../../auth';

const router = Router();

router.get('/account', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;

        // Fetch the user's MT5 account credentials
        const mt5Result = await query(
            'SELECT login, password, server, mt5_port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        const mt5Account = mt5Result.rows[0];

        if (!mt5Account) {
            return res.status(404).json({ error: 'No MT5 account linked to this user' });
        }

        // Pass credentials to the service
        const account = await fetchAccount({
            login: mt5Account.login,
            password: mt5Account.password,
            server: mt5Account.server,
            port: mt5Account.mt5_port,
        });

        res.json(account);
    } catch (error) {
        next(error);
    }
});

export default router;
