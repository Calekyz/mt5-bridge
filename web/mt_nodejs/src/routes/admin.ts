import { authMiddleware, AuthRequest } from '../auth';
import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';

const router = Router();
const ADMIN_KEY = process.env.ADMIN_KEY || 'my-super-secret-admin-key-2024';

const adminKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' });
    }
    next();
};

// ─── GET /admin/users ────────────────────────────────────
router.get('/users', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await query(`
            SELECT u.id, u.email, u.role, u.created_at,
                   a.vps_address
            FROM users u
            LEFT JOIN user_mt5_accounts a ON a.user_id = u.id
            ORDER BY u.id
        `);
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
router.post('/client', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, vps_address } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        // Create user
        const hashed = await bcrypt.hash(password, 10);
        await query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [email, hashed, 'user']);

        // Get user ID
        const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
        const userId = userResult.rows[0].id;

        // Insert VPS address (with label = email to satisfy NOT NULL)
        if (vps_address) {
            await query(
                'INSERT INTO user_mt5_accounts (user_id, label, vps_address) VALUES ($1, $2, $3)',
                [userId, email, vps_address]
            );
        }

        // Generate access key and bind to user
        const keyCode = `KEY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await query(
            'INSERT INTO access_keys (key_code, used_by, used_at, created_by) VALUES ($1, $2, NOW(), $3)',
            [keyCode, userId, userId]
        );

        res.status(201).json({
            message: 'Client created successfully',
            user: { id: userId, email, role: 'user' },
            vps_address: vps_address || null,
            access_key: keyCode,
        });
    } catch (error) {
        console.error('Admin client error:', error);
        next(error);
    }
});

// ─── PATCH /admin/client/vps ─────────────────────────────
router.patch('/client/vps', adminKeyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { email, vps_address } = req.body;
    if (!email || !vps_address) {
        return res.status(400).json({ error: 'Email and vps_address required' });
    }
    try {
        const trimmedEmail = email.trim();
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = userCheck.rows[0].id;

        // Check if VPS row exists
        const vpsCheck = await query('SELECT id FROM user_mt5_accounts WHERE user_id = $1', [userId]);
        if (vpsCheck.rows.length === 0) {
            // Insert new VPS row with label = email
            await query(
                'INSERT INTO user_mt5_accounts (user_id, label, vps_address) VALUES ($1, $2, $3)',
                [userId, trimmedEmail, vps_address]
            );
            return res.json({ message: 'VPS address assigned successfully' });
        }

        // Update existing
        await query('UPDATE user_mt5_accounts SET vps_address = $1 WHERE user_id = $2', [vps_address, userId]);
        res.json({ message: 'VPS address updated successfully' });
    } catch (error) {
        console.error('Update VPS error:', error);
        next(error);
    }
});


// ═══════════════════════════════════════════════════════════════════
// USER MANAGEMENT — search + bulk delete
// Guarded: only caleborenge8@gmail.com (hardcoded super-admin)
// ═══════════════════════════════════════════════════════════════════
const SUPER_ADMIN_EMAIL = 'caleborenge8@gmail.com';

function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user || req.user.email !== SUPER_ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Super-admin only' });
    }
    next();
}

// ─── GET /admin/users/search?filter=all|configured|not_configured&q=xxx ───
router.get(
    '/users/search',
    authMiddleware,
    requireSuperAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const filter = String(req.query.filter || 'all');
            const q = String(req.query.q || '').trim().toLowerCase();

            const rows = await query(
                `SELECT u.id, u.email, u.role, u.created_at,
                        u.plan, u.payment_status, u.activated_at,
                        a.vps_address, a.label as account_label
                 FROM users u
                 LEFT JOIN user_mt5_accounts a ON a.user_id = u.id
                 WHERE u.role != 'admin'
                    OR u.email = $1
                 ORDER BY u.id ASC`,
                [SUPER_ADMIN_EMAIL]
            );

            let users = rows.rows.filter((u: any) => u.email !== SUPER_ADMIN_EMAIL);

            // Filter by configured
            if (filter === 'configured') {
                users = users.filter((u: any) => !!u.vps_address);
            } else if (filter === 'not_configured') {
                users = users.filter((u: any) => !u.vps_address);
            }

            // Search by email OR vps_address
            if (q) {
                users = users.filter((u: any) =>
                    (u.email || '').toLowerCase().includes(q) ||
                    (u.vps_address || '').toLowerCase().includes(q)
                );
            }

            res.json({
                success: true,
                total: users.length,
                users: users.map((u: any) => ({
                    id: u.id,
                    email: u.email,
                    role: u.role,
                    createdAt: u.created_at,
                    plan: u.plan,
                    paymentStatus: u.payment_status,
                    activatedAt: u.activated_at,
                    vpsAddress: u.vps_address,
                    accountLabel: u.account_label,
                    isConfigured: !!u.vps_address,
                })),
            });
        } catch (err: any) {
            console.error('user search error:', err);
            next(err);
        }
    }
);

// ─── DELETE /admin/users/:id (single user + their mt5 accounts) ───
router.delete(
    '/users/:id/safe',
    authMiddleware,
    requireSuperAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const id = String(req.params.id);

            // Fetch the target user
            const target = await query('SELECT email, role FROM users WHERE id = $1', [id]);
            if (target.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (target.rows[0].role === 'admin' || target.rows[0].email === SUPER_ADMIN_EMAIL) {
                return res.status(400).json({ error: 'Cannot delete admin' });
            }

            // Delete MT5 accounts first (or set user_id null — hard delete here)
            await query('DELETE FROM user_mt5_accounts WHERE user_id = $1', [id]);
            await query('DELETE FROM users WHERE id = $1', [id]);

            res.json({ success: true, deleted: target.rows[0].email });
        } catch (err: any) {
            console.error('delete user error:', err);
            next(err);
        }
    }
);

// ─── DELETE /admin/users/bulk/all-non-admin ───
// Requires body: { confirm: "DELETE_ALL_USERS" }
router.delete(
    '/users/bulk/all-non-admin',
    authMiddleware,
    requireSuperAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const confirm = String(req.body?.confirm || '');
            if (confirm !== 'DELETE_ALL_USERS') {
                return res.status(400).json({
                    error: 'Confirmation required. Send { "confirm": "DELETE_ALL_USERS" }',
                });
            }

            // Count first
            const countBefore = await query(
                `SELECT COUNT(*)::int as n FROM users WHERE email != $1 AND role != 'admin'`,
                [SUPER_ADMIN_EMAIL]
            );
            const n = countBefore.rows[0]?.n || 0;

            // Delete dependent data first
            await query(
                `DELETE FROM user_mt5_accounts
                 WHERE user_id IN (SELECT id FROM users WHERE email != $1 AND role != 'admin')`,
                [SUPER_ADMIN_EMAIL]
            );
            await query(
                `DELETE FROM users WHERE email != $1 AND role != 'admin'`,
                [SUPER_ADMIN_EMAIL]
            );

            res.json({ success: true, deleted: n });
        } catch (err: any) {
            console.error('bulk delete error:', err);
            next(err);
        }
    }
);


// ─── POST /admin/users/bulk/delete-selected  { ids: [1,2,3] } ───
router.post(
    '/users/bulk/delete-selected',
    authMiddleware,
    requireSuperAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((x: any) => Number(x)).filter((x: number) => Number.isFinite(x)) : [];
            if (ids.length === 0) {
                return res.status(400).json({ error: 'No user IDs provided' });
            }

            // Never delete admin
            const check = await query(
                `SELECT id, email, role FROM users WHERE id = ANY($1::int[])`,
                [ids]
            );
            const deletable = check.rows.filter(
                (u: any) => u.role !== 'admin' && u.email !== SUPER_ADMIN_EMAIL
            );
            const protectedCount = check.rows.length - deletable.length;
            const deletableIds = deletable.map((u: any) => u.id);

            if (deletableIds.length === 0) {
                return res.json({ success: true, deleted: 0, protected: protectedCount });
            }

            await query(
                `DELETE FROM user_mt5_accounts WHERE user_id = ANY($1::int[])`,
                [deletableIds]
            );
            await query(
                `DELETE FROM users WHERE id = ANY($1::int[])`,
                [deletableIds]
            );

            res.json({
                success: true,
                deleted: deletableIds.length,
                protected: protectedCount,
            });
        } catch (err: any) {
            console.error('bulk delete selected error:', err);
            next(err);
        }
    }
);

export default router;
