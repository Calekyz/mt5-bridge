import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from './db'; // fixed path (was '../db')

export interface AuthRequest extends Request {
    user?: { id: number; email: string };
}

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
