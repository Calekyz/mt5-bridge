import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import axios from 'axios';

const router = Router();
const MT5_HOST = process.env.MT5_HOST || 'localhost';
const MT5_PORT = process.env.MT5_PORT || '8890';
const EA_BASE_URL = `http://${MT5_HOST}:${MT5_PORT}/v1`;

// Helper to send global variable command to EA
async function setGlobalVariable(name: string, value: any) {
    try {
        await axios.post(`${EA_BASE_URL}/global/set`, {
            name,
            value: typeof value === 'boolean' ? (value ? 1 : 0) : value
        });
    } catch (err) {
        console.error(`Failed to set ${name}:`, err);
    }
}

// ─── GET all strategies for current user ──────────────────
router.get('/strategies', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const result = await query(
            `SELECT s.*, a.login, a.server, a.label as account_label 
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
        // Get the strategy and its account details
        const result = await query(
            `SELECT s.*, a.login, a.password, a.server 
             FROM user_strategies s
             JOIN user_mt5_accounts a ON a.id = s.account_id
             WHERE s.id = $1 AND s.user_id = $2`,
            [id, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        const strategy = result.rows[0];
        const varName = strategy.ea_name === 'pipnex' ? 'PipNex_Enable' : 'Nova_Enable';

        // Send command to EA
        await setGlobalVariable(varName, enabled ? 1 : 0);

        // Update database
        await query(
            'UPDATE user_strategies SET is_active = $1, updated_at = NOW() WHERE id = $2',
            [enabled, id]
        );

        // If enabling, also apply settings
        if (enabled) {
            const settings = strategy.settings;
            const prefix = strategy.ea_name === 'pipnex' ? 'PipNex_' : 'Nova_';
            for (const [key, value] of Object.entries(settings)) {
                await setGlobalVariable(`${prefix}${key}`, value);
            }
        }

        // Also update Master_Enabled based on any active strategy for this user
        // (We'll keep Master_Enabled as an overall switch for all strategies)
        // For multiple users, we need per‑user isolation – but EA runs on a single MT5.
        // We'll handle this by storing user_id in the global variable.
        // For simplicity, we use Master_Enabled as a global on/off.
        const activeCheck = await query(
            'SELECT COUNT(*) FROM user_strategies WHERE user_id = $1 AND is_active = true',
            [req.user!.id]
        );
        const hasActive = parseInt(activeCheck.rows[0].count) > 0;
        await setGlobalVariable('Master_Enabled', hasActive ? 1 : 0);

        res.json({ success: true, enabled });
    } catch (err) {
        console.error('Toggle strategy error:', err);
        res.status(500).json({ error: 'Failed to toggle strategy' });
    }
});

// ─── UPDATE strategy settings ────────────────────────────
router.post('/strategies/:id/settings', authMiddleware, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const result = await query(
            'SELECT * FROM user_strategies WHERE id = $1 AND user_id = $2',
            [id, req.user!.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        const strategy = result.rows[0];
        const newSettings = { ...strategy.settings, ...updates };

        await query(
            'UPDATE user_strategies SET settings = $1, updated_at = NOW() WHERE id = $2',
            [newSettings, id]
        );

        // If strategy is active, apply settings immediately
        if (strategy.is_active) {
            const prefix = strategy.ea_name === 'pipnex' ? 'PipNex_' : 'Nova_';
            for (const [key, value] of Object.entries(updates)) {
                await setGlobalVariable(`${prefix}${key}`, value);
            }
        }

        res.json({ success: true, settings: newSettings });
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
