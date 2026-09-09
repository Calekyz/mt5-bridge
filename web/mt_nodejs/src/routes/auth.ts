import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { generateToken } from '../auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// ─── REGISTER ─────────────────────────────────────────────
router.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);
        await query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
            [email, hashed, 'user']
        );

        res.status(201).json({
            message: 'Account created. Please contact admin for an access key to log in.'
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── LOGIN ─────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
    const { email, password, access_key } = req.body;
    console.log('Login attempt:', { email, access_key });

    if (!email || !password || !access_key) {
        return res.status(400).json({ error: 'Email, password, and access key required' });
    }

    // ─── Admin bypass (temporary) ──────────────────────────
    if (email === 'caleborenge8@gmail.com' && password === '@Aminlove254') {
        try {
            // Find or create user
            let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
            let user = userResult.rows[0];
            if (!user) {
                const hashed = await bcrypt.hash(password, 10);
                await query(
                    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
                    [email, hashed, 'admin']
                );
                userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
                user = userResult.rows[0];
            }

            // Validate access key
            const keyResult = await query(
                'SELECT id, key_code, used_by FROM access_keys WHERE key_code = $1',
                [access_key.trim()]
            );
            if (keyResult.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid access key' });
            }
            const key = keyResult.rows[0];
            if (key.used_by !== null && key.used_by !== user.id) {
                return res.status(400).json({ error: 'Access key already used by another user' });
            }
            if (key.used_by === null) {
                await query(
                    'UPDATE access_keys SET used_by = $1, used_at = NOW() WHERE id = $2',
                    [user.id, key.id]
                );
            }

            // Fetch MT5 account – handle missing column gracefully
            let mt5Account = null;
            try {
                const mt5Result = await query(
                    'SELECT login, password, server, port, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                    [user.id]
                );
                mt5Account = mt5Result.rows[0] || null;
            } catch (mt5Err: any) {
                // If column missing, fallback to query without vps_address
                if (mt5Err.code === '42703') { // undefined column
                    console.warn('vps_address column missing, falling back to basic query');
                    const mt5Result = await query(
                        'SELECT login, password, server, port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                        [user.id]
                    );
                    mt5Account = mt5Result.rows[0] || null;
                } else {
                    throw mt5Err;
                }
            }

            const token = generateToken(user.id, user.email);
            return res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    mt5: mt5Account,
                },
                token,
                access_key: key.key_code,
            });
        } catch (err: any) {
            console.error('Admin bypass error:', err);
            return res.status(500).json({
                error: 'Internal server error',
                details: err.message,
            });
        }
    }

    // ─── Normal login flow ──────────────────────────────────
    try {
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const keyResult = await query(
            'SELECT id, key_code, used_by FROM access_keys WHERE key_code = $1',
            [access_key.trim()]
        );
        if (keyResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid access key' });
        }
        const key = keyResult.rows[0];
        if (key.used_by !== null && key.used_by !== user.id) {
            return res.status(400).json({ error: 'Access key already used by another user' });
        }
        if (key.used_by === null) {
            await query(
                'UPDATE access_keys SET used_by = $1, used_at = NOW() WHERE id = $2',
                [user.id, key.id]
            );
        }

        // Fetch MT5 account – handle missing column gracefully
        let mt5Account = null;
        try {
            const mt5Result = await query(
                'SELECT login, password, server, port, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                [user.id]
            );
            mt5Account = mt5Result.rows[0] || null;
        } catch (mt5Err: any) {
            if (mt5Err.code === '42703') {
                console.warn('vps_address column missing, falling back to basic query');
                const mt5Result = await query(
                    'SELECT login, password, server, port FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                    [user.id]
                );
                mt5Account = mt5Result.rows[0] || null;
            } else {
                throw mt5Err;
            }
        }

        const token = generateToken(user.id, user.email);
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                mt5: mt5Account,
            },
            token,
            access_key: key.key_code,
        });
    } catch (err: any) {
        console.error('Login error:', err);
        res.status(500).json({
            error: 'Internal server error',
            details: err.message,
        });
    }
});

// ─── VERIFY TOKEN ──────────────────────────────────────────
router.get('/auth/verify', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
        const result = await query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user, valid: true });
    } catch (err: any) {
        console.error('Verify error:', err);
        return res.status(401).json({
            error: 'Invalid token',
            details: err.message,
        });
    }
});

export default router;
