import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export function generateToken(userId: number, email: string): string {
    return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { id: number; email: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    } catch {
        return null;
    }
}

export interface AuthRequest extends Request {
    user?: { id: number; email: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    req.user = user;
    next();
}

const router = Router();

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
        await query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [email, hashed, 'user']);
        res.status(201).json({ message: 'Account created. Admin will assign a VPS.' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    // ─── Admin bypass ──────────────────────────
    if (email === 'caleborenge8@gmail.com' && password === '@Aminlove254') {
        try {
            let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
            let user = userResult.rows[0];
            if (!user) {
                const hashed = await bcrypt.hash(password, 10);
                await query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [email, hashed, 'admin']);
                userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
                user = userResult.rows[0];
            }

            // Fetch the latest VPS address
            let vpsAddress = null;
            try {
                const vpsResult = await query(
                    'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
                    [user.id]
                );
                if (vpsResult.rows.length > 0) {
                    vpsAddress = vpsResult.rows[0].vps_address;
                }
            } catch (err) {
                console.warn('Could not fetch VPS address:', err);
            }

            const token = generateToken(user.id, user.email);
            return res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    vps_address: vpsAddress,
                },
                token,
            });
        } catch (err: any) {
            console.error('Admin bypass error:', err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }

    // ─── Normal login ──────────────────────────
    try {
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        // Fetch the latest VPS address
        let vpsAddress = null;
        try {
            const vpsResult = await query(
                'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
                [user.id]
            );
            if (vpsResult.rows.length > 0) {
                vpsAddress = vpsResult.rows[0].vps_address;
            }
        } catch (err) {
            console.warn('Could not fetch VPS address:', err);
        }

        const token = generateToken(user.id, user.email);
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                vps_address: vpsAddress,
            },
            token,
        });
    } catch (err: any) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

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
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user, valid: true });
    } catch (err: any) {
        return res.status(401).json({ error: 'Invalid token', details: err.message });
    }
});

// ─── GET /auth/me ────────────────────────────────────
// Returns the current authenticated user's info (including VPS address)
// Used by the Dashboard's "Refresh VPS Info" button.
router.get('/auth/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const userResult = await query('SELECT id, email, role FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let vpsAddress = null;
        try {
            const vpsResult = await query(
                'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
                [userId]
            );
            if (vpsResult.rows.length > 0) {
                vpsAddress = vpsResult.rows[0].vps_address;
            }
        } catch (err) {
            console.warn('Could not fetch VPS address:', err);
        }

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            vps_address: vpsAddress,
        });
    } catch (err: any) {
        console.error('Auth me error:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

export default router;
