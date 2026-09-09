import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';

const router = Router();

// ─── 🔥 TEMPORARY FALLBACK – remove after setting env vars ───
const ADMIN_KEY = process.env.ADMIN_KEY || 'my-super-secret-admin-key-2024';
// ─────────────────────────────────────────────────────────────────

const adminKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' });
    }
    next();
};

// ─── GET /admin/users ────────────────────────────────────
// Returns unique users with their MT5 account info (login, server, vps_address)
router.get('/users', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        let result;
        try {
            // Try with vps_address column (if exists)
            result = await query(`
                SELECT DISTINCT ON (u.id) 
                    u.id, u.email, u.role, u.created_at,
                    a.login, a.server, a.vps_address
                FROM users u
                LEFT JOIN user_mt5_accounts a ON a.user_id = u.id
                ORDER BY u.id, a.id DESC
            `);
        } catch (err: any) {
            if (err.code === '42703') {
                // vps_address column missing – fallback without it
                console.warn('vps_address column missing, fallback to basic query');
                result = await query(`
                    SELECT DISTINCT ON (u.id) 
                        u.id, u.email, u.role, u.created_at,
                        a.login, a.server
                    FROM users u
                    LEFT JOIN user_mt5_accounts a ON a.user_id = u.id
                    ORDER BY u.id, a.id DESC
                `);
            } else {
                throw err;
            }
        }
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// ─── POST /admin/users ───────────────────────────────────
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

// ─── DELETE /admin/users/:id ─────────────────────────────
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

// ─── GET /admin/keys ─────────────────────────────────────
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

// ─── POST /admin/keys ────────────────────────────────────
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

// ─── DELETE /admin/keys/:id ─────────────────────────────
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

// ─── POST /admin/client ──────────────────────────────────
// Creates a new user, stores MT5 credentials, generates & binds an access key
router.post('/client', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, mt5, vps_address } = req.body;

    if (!email || !password || !mt5 || !mt5.login || !mt5.password || !mt5.server) {
        return res.status(400).json({
            error: 'Missing required fields: email, password, mt5.login, mt5.password, mt5.server'
        });
    }

    try {
        // 1. Create user
        const hashed = await bcrypt.hash(password, 10);
        await query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
            [email, hashed, 'user']
        );

        // 2. Get new user ID
        const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
        const userId = userResult.rows[0].id;

        // 3. Insert MT5 account – port column may not exist, so we omit it
        // We'll use default port 443 in the credentials later.
        let insertQuery = `
            INSERT INTO user_mt5_accounts 
            (user_id, login, password, server${vps_address !== undefined ? ', vps_address' : ''}) 
            VALUES ($1, $2, $3, $4${vps_address !== undefined ? ', $5' : ''})
        `;
        const values: any[] = [userId, mt5.login, mt5.password, mt5.server];
        if (vps_address !== undefined) {
            values.push(vps_address);
        }
        await query(insertQuery, values);

        // 4. Generate a unique access key and bind it to the user
        const keyCode = `KEY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await query(
            'INSERT INTO access_keys (key_code, used_by, used_at, created_by) VALUES ($1, $2, NOW(), $3)',
            [keyCode, userId, userId]
        );

        res.status(201).json({
            message: 'Client created successfully',
            user: { id: userId, email, role: 'user' },
            mt5: {
                login: mt5.login,
                server: mt5.server,
                port: 443, // default
                vps_address: vps_address || null,
            },
            access_key: keyCode
        });
    } catch (error) {
        console.error('Admin client creation error:', error);
        next(error);
    }
});

// ─── PATCH /admin/client/vps ─────────────────────────────
// Updates VPS address for an existing client (by email)
router.patch('/client/vps', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { email, vps_address } = req.body;
    if (!email || !vps_address) {
        return res.status(400).json({ error: 'Email and vps_address required' });
    }
    try {
        // Check if vps_address column exists
        let columnExists = true;
        try {
            await query('SELECT vps_address FROM user_mt5_accounts LIMIT 0');
        } catch (err: any) {
            if (err.code === '42703') columnExists = false;
        }

        let result;
        if (columnExists) {
            result = await query(
                `UPDATE user_mt5_accounts 
                 SET vps_address = $1 
                 WHERE user_id = (SELECT id FROM users WHERE email = $2)`,
                [vps_address, email]
            );
        } else {
            // Column doesn't exist – we can't update it, so we'll just return a message
            return res.status(400).json({ error: 'vps_address column does not exist in your database. Please run: ALTER TABLE user_mt5_accounts ADD COLUMN vps_address VARCHAR(255);' });
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found or no MT5 account linked' });
        }
        res.json({ message: 'VPS address updated successfully' });
    } catch (error) {
        console.error('Update VPS error:', error);
        next(error);
    }
});

export default router;
