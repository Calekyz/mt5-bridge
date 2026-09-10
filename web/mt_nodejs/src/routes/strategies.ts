import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import axios from 'axios';

const router = Router();

// ─── Helper: Get the user's assigned VPS address ──────────
async function getUserVps(userId: number): Promise<string | null> {
    const result = await query(
        'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
        [userId]
    );
    return result.rows[0]?.vps_address || null;
}

// ─── Helper: Send a global variable command to a specific VPS ──
async function setGlobalVariable(baseUrl: string, name: string, value: any) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    try {
        await axios.post(
            `${cleanBase}/v1/global/set`,
            { name, value: typeof value === 'boolean' ? (value ? 1 : 0) : value },
            { timeout: 5000, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err: any) {
        console.error(`Failed to set ${name} at ${baseUrl}:`, err.message);
        throw new Error(`Failed to send command to EA at ${baseUrl}: ${err.message}`);
    }
}

// ─── GET all strategies ────────────────────────────────────
router.get('/strategies', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const result = await query(
            `SELECT s.*, a.label as account_label 
             FROM user_strategies s
             JOIN user_mt5_accounts a ON a.id = s.account_id
             WHERE s.user_id = $1`,
            [req.user!.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET strategies error:', err);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

// ─── TOGGLE strategy ──────────────────────────────────────
router.post('/strategies/:id/toggle', authMiddleware, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { enabled } = req.body;

    try {
        const vpsAddress = await getUserVps(req.user!.id);
        if (!vpsAddress) {
            return res.status(400).json({ error: 'No VPS assigned to your account' });
        }

        const result = await query(
            `SELECT s.* FROM user_strategies s
             WHERE s.id = $1 AND s.user_id = $2`,
            [id, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        const strategy = result.rows[0];
        const varName = strategy.ea_name === 'pipnex' ? 'PipNex_Enable' : 'Nova_Enable';

        await setGlobalVariable(vpsAddress, varName, enabled ? 1 : 0);

        await query(
            'UPDATE user_strategies SET is_active = $1, updated_at = NOW() WHERE id = $2',
            [enabled, id]
        );

        if (enabled) {
            const settings = strategy.settings || {};
            const prefix = strategy.ea_name === 'pipnex' ? 'PipNex_' : 'Nova_';
            for (const [key, value] of Object.entries(settings)) {
                await setGlobalVariable(vpsAddress, `${prefix}${key}`, value);
            }
        }

        const activeCheck = await query(
            'SELECT COUNT(*) FROM user_strategies WHERE user_id = $1 AND is_active = true',
            [req.user!.id]
        );
        const hasActive = parseInt(activeCheck.rows[0].count) > 0;
        await setGlobalVariable(vpsAddress, 'Master_Enabled', hasActive ? 1 : 0);

        res.json({ success: true, enabled });
    } catch (err: any) {
        console.error('Toggle strategy error:', err);
        res.status(500).json({ error: err.message || 'Failed to toggle strategy' });
    }
});

// ─── UPDATE settings ──────────────────────────────────────
router.post('/strategies/:id/settings', authMiddleware, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const vpsAddress = await getUserVps(req.user!.id);
        if (!vpsAddress) {
            return res.status(400).json({ error: 'No VPS assigned to your account' });
        }

        const result = await query(
            'SELECT * FROM user_strategies WHERE id = $1 AND user_id = $2',
            [id, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        const strategy = result.rows[0];
        const newSettings = { ...(strategy.settings || {}), ...updates };

        await query(
            'UPDATE user_strategies SET settings = $1, updated_at = NOW() WHERE id = $2',
            [newSettings, id]
        );

        if (strategy.is_active) {
            const prefix = strategy.ea_name === 'pipnex' ? 'PipNex_' : 'Nova_';
            for (const [key, value] of Object.entries(updates)) {
                await setGlobalVariable(vpsAddress, `${prefix}${key}`, value);
            }
        }

        res.json({ success: true, settings: newSettings });
    } catch (err: any) {
        console.error('Update settings error:', err);
        res.status(500).json({ error: err.message || 'Failed to update settings' });
    }
});

export default router;
