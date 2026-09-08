import { Router, Request } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';

// ─── Custom request interface with adminId ────────────────
interface AdminRequest extends Request {
    adminId?: number;
}

const router = Router();

// ─── Admin middleware ──────────────────────────────────────
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-key-change-this';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'caleborenge8@gmail.com';

async function adminMiddleware(req: AdminRequest, res: any, next: any) {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Forbidden: Invalid admin key' });
    }
    try {
        // Ensure admin user exists
        let adminUser = await query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
        if (adminUser.rows.length === 0) {
            const hashed = await bcrypt.hash('admin123', 10);
            const ins = await query(
                'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
                [ADMIN_EMAIL, hashed, 'admin']
            );
            req.adminId = ins.rows[0].id;
        } else {
            req.adminId = adminUser.rows[0].id;
        }
        next();
    } catch (err) {
        console.error('Admin middleware error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// ─── GET all users ─────────────────────────────────────────
router.get('/admin/users', adminMiddleware, async (req: AdminRequest, res) => {
    try {
        const result = await query('SELECT id, email, role, created_at FROM users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ─── ADD a new user ────────────────────────────────────────
router.post('/admin/users', adminMiddleware, async (req: AdminRequest, res) => {
    const { email, password, role = 'user' } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const result = await query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
            [email, hashed, role]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Add user error:', err);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

// ─── DELETE a user ─────────────────────────────────────────
router.delete('/admin/users/:id', adminMiddleware, async (req: AdminRequest, res) => {
    // ✅ FIX: explicitly convert id to string
    const id = req.params.id as string;
    try {
        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, id: parseInt(id) });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ─── GET all access keys ────────────────────────────────────
router.get('/admin/keys', adminMiddleware, async (req: AdminRequest, res) => {
    try {
        const result = await query(
            `SELECT k.*, u.email as created_by_email, u2.email as used_by_email
             FROM access_keys k
             LEFT JOIN users u ON k.created_by = u.id
             LEFT JOIN users u2 ON k.used_by = u2.id
             ORDER BY k.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get keys error:', err);
        res.status(500).json({ error: 'Failed to fetch access keys' });
    }
});

// ─── Generate new access keys ──────────────────────────────
router.post('/admin/keys', adminMiddleware, async (req: AdminRequest, res) => {
    const { count = 1 } = req.body;
    const adminId = req.adminId;
    if (!adminId) {
        return res.status(500).json({ error: 'Admin ID not found' });
    }
    try {
        const keys = [];
        for (let i = 0; i < count; i++) {
            const keyCode = `KEY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            await query(
                'INSERT INTO access_keys (key_code, created_by) VALUES ($1, $2)',
                [keyCode, adminId]
            );
            keys.push(keyCode);
        }
        res.status(201).json({ keys });
    } catch (err) {
        console.error('Generate keys error:', err);
        res.status(500).json({ error: 'Failed to generate keys' });
    }
});

// ─── DELETE an access key ───────────────────────────────────
router.delete('/admin/keys/:id', adminMiddleware, async (req: AdminRequest, res) => {
    // ✅ FIX: explicitly convert id to string
    const id = req.params.id as string;
    try {
        await query('DELETE FROM access_keys WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete key error:', err);
        res.status(500).json({ error: 'Failed to delete key' });
    }
});

export default router;
