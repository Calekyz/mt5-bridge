import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';

const router = Router();

// Middleware to check admin key
const adminKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' });
    }
    next();
};

// GET /admin/users (now accessible at /v1/admin/users)
router.get('/users', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await query('SELECT id, email, role, created_at FROM users ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// POST /admin/users
router.post('/users', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        const hashed = await bcrypt.hash(password, 10);
        await query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [email, hashed, 'user']);
        res.status(201).json({ message: 'User created' });
    } catch (error) {
        next(error);
    }
});

// DELETE /admin/users/:id
router.delete('/users/:id', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id as string, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        await query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        next(error);
    }
});

// GET /admin/keys
router.get('/keys', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await query(`
            SELECT k.id, k.key_code, k.created_at, u.email AS used_by_email,
                   creator.email AS created_by_email
            FROM access_keys k
            LEFT JOIN users u ON k.used_by = u.id
            LEFT JOIN users creator ON k.created_by = creator.id
            ORDER BY k.id
        `);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// POST /admin/keys
router.post('/keys', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { count = 1 } = req.body;
    try {
        const keys = [];
        for (let i = 0; i < count; i++) {
            const code = `KEY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            await query('INSERT INTO access_keys (key_code) VALUES ($1)', [code]);
            keys.push(code);
        }
        res.status(201).json({ keys });
    } catch (error) {
        next(error);
    }
});

// DELETE /admin/keys/:id
router.delete('/keys/:id', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const keyId = parseInt(req.params.id as string, 10);
    if (isNaN(keyId)) {
        return res.status(400).json({ error: 'Invalid key ID' });
    }
    try {
        await query('DELETE FROM access_keys WHERE id = $1', [keyId]);
        res.json({ message: 'Key deleted' });
    } catch (error) {
        next(error);
    }
});

// POST /admin/client – create user + mt5 + key
router.post('/client', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, mt5 } = req.body;
    if (!email || !password || !mt5 || !mt5.login || !mt5.password || !mt5.server) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        // Create user
        const hashed = await bcrypt.hash(password, 10);
        await query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [email, hashed, 'user']);
        const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
        const userId = userResult.rows[0].id;

        // Insert MT5 account
        const port = mt5.port || 443;
        await query(
            'INSERT INTO user_mt5_accounts (user_id, login, password, server, port) VALUES ($1, $2, $3, $4, $5)',
            [userId, mt5.login, mt5.password, mt5.server, port]
        );

        // Generate access key and bind to user
        const keyCode = `KEY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await query(
            'INSERT INTO access_keys (key_code, used_by, used_at, created_by) VALUES ($1, $2, NOW(), $3)',
            [keyCode, userId, userId]
        );

        res.status(201).json({
            message: 'Client created',
            user: { id: userId, email, role: 'user' },
            mt5: { login: mt5.login, server: mt5.server, port },
            access_key: keyCode
        });
    } catch (error) {
        console.error('Admin client error:', error);
        next(error);
    }
});

export default router;
