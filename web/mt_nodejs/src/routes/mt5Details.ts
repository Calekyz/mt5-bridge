import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// ─── Helper: getUserVps (matches risk.ts pattern) ─────────
async function getUserVps(userId: number): Promise<string | null> {
    const result = await query(
        'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
        [userId]
    );
    return result.rows[0]?.vps_address || null;
}

// ─── Helper: fetch chart symbols from the EA bridge on VPS ─
async function fetchChartSymbolsFromVps(vpsAddress: string): Promise<{
    symbols: { symbol: string; chart_id?: number; period?: string }[];
    raw?: any;
    error?: string;
}> {
    try {
        const base = vpsAddress.startsWith('http') ? vpsAddress : `http://${vpsAddress}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${base}/symbols`, { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) return { symbols: [], error: `Bridge returned ${res.status}` };

        const data = await res.json();

        // Try multiple possible shapes (bridge API may vary)
        if (Array.isArray(data)) {
            return {
                symbols: data
                    .map((s: any) => typeof s === 'string' ? { symbol: s } : s)
                    .filter((s: any) => s.symbol),
                raw: data,
            };
        }
        if (Array.isArray(data.symbols)) {
            return {
                symbols: data.symbols
                    .map((s: any) => typeof s === 'string' ? { symbol: s } : s)
                    .filter((s: any) => s.symbol),
                raw: data,
            };
        }
        if (Array.isArray(data.charts)) {
            return {
                symbols: data.charts
                    .map((c: any) => ({
                        symbol: c.symbol || c.Symbol,
                        chart_id: c.chart_id || c.id,
                        period: c.period || c.Period,
                    }))
                    .filter((s: any) => s.symbol),
                raw: data,
            };
        }
        return { symbols: [], raw: data };
    } catch (err: any) {
        return { symbols: [], error: err.message || 'Bridge unreachable' };
    }
}

// ═══════════════════════════════════════════════════════════
//  USER ROUTES
// ═══════════════════════════════════════════════════════════

// ─── GET /v1/mt5-details — get own details ────────────────
router.get('/mt5-details', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const result = await query(
            `SELECT id, label, mt5_login, mt5_password, mt5_server, notes, created_at, updated_at
             FROM user_mt5_details
             WHERE user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.json({ details: null, can_create: true });
        }
        res.json({ details: result.rows[0], can_create: false });
    } catch (err: any) {
        console.error('Get mt5 details error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /v1/mt5-details — create (only if none) ────────
router.post('/mt5-details', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { label, mt5_login, mt5_password, mt5_server, notes } = req.body;

        if (!mt5_login || !mt5_password || !mt5_server) {
            return res.status(400).json({ error: 'MT5 login, password and server are required' });
        }

        const existing = await query(
            'SELECT id FROM user_mt5_details WHERE user_id = $1',
            [userId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'You already have MT5 details on file. Edit it instead, or contact admin to remove.' });
        }

        const result = await query(
            `INSERT INTO user_mt5_details
             (user_id, label, mt5_login, mt5_password, mt5_server, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, label, mt5_login, mt5_password, mt5_server, notes, created_at, updated_at`,
            [userId, label || null, mt5_login, mt5_password, mt5_server, notes || null]
        );

        res.status(201).json({ details: result.rows[0] });
    } catch (err: any) {
        console.error('Create mt5 details error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /v1/mt5-details — update own ─────────────────────
router.put('/mt5-details', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { label, mt5_login, mt5_password, mt5_server, notes } = req.body;

        if (!mt5_login || !mt5_password || !mt5_server) {
            return res.status(400).json({ error: 'MT5 login, password and server are required' });
        }

        const result = await query(
            `UPDATE user_mt5_details
             SET label = $1, mt5_login = $2, mt5_password = $3, mt5_server = $4, notes = $5
             WHERE user_id = $6
             RETURNING id, label, mt5_login, mt5_password, mt5_server, notes, created_at, updated_at`,
            [label || null, mt5_login, mt5_password, mt5_server, notes || null, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No MT5 details found. Create one first.' });
        }

        res.json({ details: result.rows[0] });
    } catch (err: any) {
        console.error('Update mt5 details error:', err);
        res.status(500).json({ error: err.message });
    }
});

// NOTE: No DELETE route for users — intentional (admin-only removal).

// ─── GET /v1/mt5-details/symbols — chart symbols on VPS ──
router.get('/mt5-details/symbols', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const vpsAddress = await getUserVps(userId);
        if (!vpsAddress) {
            return res.json({ connected: false, symbols: [], error: 'No VPS assigned' });
        }

        const result = await fetchChartSymbolsFromVps(vpsAddress);
        res.json({
            connected: !result.error,
            vps: vpsAddress,
            symbols: result.symbols,
            error: result.error || null,
            fetched_at: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('Fetch symbols error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════

// ─── GET /v1/admin/mt5-details — list all ────────────────
router.get('/admin/mt5-details', authMiddleware, adminAuth, async (req: AuthRequest, res) => {
    try {
        const result = await query(
            `SELECT d.id, d.user_id, d.label, d.mt5_login, d.mt5_password,
                    d.mt5_server, d.notes, d.created_at, d.updated_at,
                    u.email AS user_email
             FROM user_mt5_details d
             JOIN users u ON u.id = d.user_id
             ORDER BY d.created_at DESC`
        );
        res.json({ details: result.rows });
    } catch (err: any) {
        console.error('Admin list mt5 details error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /v1/admin/mt5-details/:id — remove ───────────
router.delete('/admin/mt5-details/:id', authMiddleware, adminAuth, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;
        const { reason } = req.body || {};

        const existing = await query(
            `SELECT id, user_id, mt5_login FROM user_mt5_details WHERE id = $1`,
            [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        const target = existing.rows[0];

        await query(`DELETE FROM user_mt5_details WHERE id = $1`, [id]);

        // Optional: log to admin_audit_log if the table exists
        try {
            await query(
                `INSERT INTO admin_audit_log (admin_id, action, target_user_id, target_id, reason)
                 VALUES ($1, 'remove_user_mt5_details', $2, $3, $4)`,
                [adminId, target.user_id, target.id, reason || null]
            );
        } catch { /* audit table may not exist — safe to skip */ }

        res.json({ success: true, removed: { id: target.id, user_id: target.user_id, mt5_login: target.mt5_login } });
    } catch (err: any) {
        console.error('Admin remove mt5 details error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
