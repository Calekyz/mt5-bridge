import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db'; // we'll create this later, or use in-memory for now

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Temporary in-memory user store (replace with database later)
// For now, we'll store users in memory (lost on restart)
const users: { id: number; email: string; password_hash: string; created_at: Date }[] = [];
let userIdCounter = 1;

// ─── REGISTER ──────────────────────────────────────────────
router.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
        id: userIdCounter++,
        email,
        password_hash: hashed,
        created_at: new Date(),
    };
    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { id: newUser.id, email: newUser.email }, token });
});

// ─── LOGIN ─────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email }, token });
});

// ─── VERIFY TOKEN (protected route) ──────────────────────
router.get('/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: { id: user.id, email: user.email, created_at: user.created_at } });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
