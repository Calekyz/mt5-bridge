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

// ─── LOGIN (email + password only) ──────────────────────
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    // ─── Admin bypass (temporary) ──────────────────────────
    if (email === 'caleborenge8@gmail.com' && password === '@Aminlove254') {
        try {
            // Find or create user
            let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
            let user = userResult.rows[0];
            if (!user) {
                console.log('Admin user not found – creating...');
                const hashed = await bcrypt.hash(password, 10);
                await query(
                    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
                    [email, hashed, 'admin']
                );
                userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
                user = userResult.rows[0];
                console.log('Admin user created with ID:', user.id);
            }

            // Fetch the user's access key (if any)
            let accessKey = null;
            const keyResult = await query(
                'SELECT key_code FROM access_keys WHERE used_by = $1',
                [user.id]
            );
            if (keyResult.rows.length > 0) {
                accessKey = keyResult.rows[0].key_code;
            }

            // Fetch MT5 account (with vps_address fallback)
            let mt5Account = null;
            try {
                const mt5Result = await query(
                    'SELECT login, password, server, port, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                    [user.id]
                );
                mt5Account = mt5Result.rows[0] || null;
            } catch (mt5Err: any) {
                if (mt5Err.code === '42703') {
                    console.warn('vps_address column missing, fallback to basic query');
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
                    access_key: accessKey, // included but not required for login
                },
                token,
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

        // Fetch the user's access key (if any)
        let accessKey = null;
        const keyResult = await query(
            'SELECT key_code FROM access_keys WHERE used_by = $1',
            [user.id]
        );
        if (keyResult.rows.length > 0) {
            accessKey = keyResult.rows[0].key_code;
        }

        // Fetch MT5 account
        let mt5Account = null;
        try {
            const mt5Result = await query(
                'SELECT login, password, server, port, vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
                [user.id]
            );
            mt5Account = mt5Result.rows[0] || null;
        } catch (mt5Err: any) {
            if (mt5Err.code === '42703') {
                console.warn('vps_address column missing, fallback to basic query');
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
                access_key: accessKey,
            },
            token,
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
