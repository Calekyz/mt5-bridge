import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// ═══════════════════════════════════════════════════════════
//  PUBLIC ROUTES (no auth — users click from email)
// ═══════════════════════════════════════════════════════════

// ─── GET /v1/unsubscribe/check?email=... ─────────────────
// Public. Tells the page whether the email is already unsubscribed.
router.get('/unsubscribe/check', async (req, res) => {
    try {
        const email = String(req.query.email || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ error: 'Email required' });

        const result = await query(
            `SELECT id, email, unsubscribed_at
             FROM email_unsubscribes
             WHERE lower(email) = $1
             LIMIT 1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.json({ unsubscribed: false, email });
        }

        res.json({
            unsubscribed: true,
            email: result.rows[0].email,
            unsubscribed_at: result.rows[0].unsubscribed_at,
        });
    } catch (err: any) {
        console.error('Unsubscribe check error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /v1/unsubscribe ────────────────────────────────
// Public. Body: { email, reason? }
router.post('/unsubscribe', async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const reason = req.body?.reason ? String(req.body.reason).slice(0, 500) : null;

        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Basic email shape guard
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Try to link to an existing user (optional)
        let userId: number | null = null;
        try {
            const userRow = await query(
                `SELECT id FROM users WHERE lower(email) = $1 LIMIT 1`,
                [email]
            );
            if (userRow.rows.length > 0) userId = userRow.rows[0].id;
        } catch { /* user table quirks — ignore */ }

        // Idempotent insert
        const result = await query(
            `INSERT INTO email_unsubscribes (user_id, email, reason)
             VALUES ($1, $2, $3)
             ON CONFLICT (email)
             DO UPDATE SET
                reason = COALESCE(EXCLUDED.reason, email_unsubscribes.reason),
                unsubscribed_at = NOW()
             RETURNING id, email, unsubscribed_at`,
            [userId, email, reason]
        );

        res.json({
            success: true,
            email: result.rows[0].email,
            unsubscribed_at: result.rows[0].unsubscribed_at,
        });
    } catch (err: any) {
        console.error('Unsubscribe error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════

// ─── GET /v1/admin/unsubscribes ──────────────────────────
router.get('/admin/unsubscribes', authMiddleware, adminAuth, async (req: AuthRequest, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.email, u.reason, u.unsubscribed_at, u.user_id,
                    us.email AS user_account_email
             FROM email_unsubscribes u
             LEFT JOIN users us ON us.id = u.user_id
             ORDER BY u.unsubscribed_at DESC`
        );
        res.json({ unsubscribes: result.rows });
    } catch (err: any) {
        console.error('Admin list unsubscribes error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /v1/admin/unsubscribes/:id ───────────────────
// Admin removes an unsubscribe record — user will start receiving emails again.
router.delete('/admin/unsubscribes/:id', authMiddleware, adminAuth, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const existing = await query(
            `SELECT id, email FROM email_unsubscribes WHERE id = $1`,
            [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        await query(`DELETE FROM email_unsubscribes WHERE id = $1`, [id]);

        // Optional audit log
        try {
            await query(
                `INSERT INTO admin_audit_log (admin_id, action, target_id, reason)
                 VALUES ($1, 'restore_email_subscription', $2, $3)`,
                [req.user!.id, existing.rows[0].id, `Restored ${existing.rows[0].email}`]
            );
        } catch { /* audit table optional */ }

        res.json({ success: true, restored: existing.rows[0] });
    } catch (err: any) {
        console.error('Admin remove unsubscribe error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
