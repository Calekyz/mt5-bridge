// web/mt_nodejs/src/routes/admin.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db'; // correct import for db

const router = Router();

// Admin middleware
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-key-change-this';

function adminMiddleware(req: any, res: any, next: any) {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Forbidden: Invalid admin key' });
    }
    next();
}

router.get('/admin/users', adminMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT id, email, created_at FROM users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/admin/users', adminMiddleware, async (req, res) => {
    const { email, password } = req.body;
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
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, hashed]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Add user error:', err);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

router.delete('/admin/users/:id', adminMiddleware, async (req, res) => {
    const { id } = req.params;
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

export default router;
