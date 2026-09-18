import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth';

// Comma-separated list of admin emails in .env
// e.g. ADMIN_EMAILS=you@example.com,partner@example.com
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

export function adminAuth(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: No user' });
    }
    const email = (req.user.email || '').toLowerCase();
    if (ADMIN_EMAILS.length === 0) {
        console.warn('⚠️  ADMIN_EMAILS not set — all admin routes will be locked');
        return res.status(503).json({ error: 'Admin access not configured' });
    }
    if (!ADMIN_EMAILS.includes(email)) {
        return res.status(403).json({ error: 'Forbidden: admin only' });
    }
    next();
}
