import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import {
    fetchAccount,
    setGlobalVariable,
    fetchOrderList,
    closeSendOrder,
} from '../services/SocketBridgeApi';

const router = Router();

// ─── Helper: Get user's VPS address ──────────────────────
async function getUserVps(userId: number): Promise<string | null> {
    const result = await query(
        'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
        [userId]
    );
    return result.rows[0]?.vps_address || null;
}

// ─── POST /v1/risk/start ──────────────────────────────────
router.post('/risk/start', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { sl, tp } = req.body;

        const vpsAddress = await getUserVps(userId);
        if (!vpsAddress) {
            return res.status(400).json({ error: 'No VPS assigned' });
        }

        let account;
        try {
            account = await fetchAccount(vpsAddress);
        } catch (err: any) {
            return res.status(503).json({ error: 'Cannot reach EA: ' + err.message });
        }

        await query(
            'UPDATE user_risk_settings SET is_active = false, trigger_reason = $1 WHERE user_id = $2 AND is_active = true',
            ['replaced', userId]
        );

        const result = await query(
            `INSERT INTO user_risk_settings 
             (user_id, starting_balance, starting_equity, sl_amount, tp_amount, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id, starting_balance, starting_equity, sl_amount, tp_amount, created_at`,
            [
                userId,
                account.balance,
                account.equity,
                sl && sl > 0 ? sl : null,
                tp && tp > 0 ? tp : null,
            ]
        );

        res.json({
            success: true,
            session: result.rows[0],
            current: {
                balance: account.balance,
                equity: account.equity,
            },
        });
    } catch (err: any) {
        console.error('Risk start error:', err);
        res.status(500).json({ error: err.message || 'Failed to start risk session' });
    }
});

// ─── POST /v1/risk/stop ───────────────────────────────────
router.post('/risk/stop', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        await query(
            `UPDATE user_risk_settings 
             SET is_active = false, trigger_reason = 'manual_stop', triggered_at = NOW()
             WHERE user_id = $1 AND is_active = true`,
            [userId]
        );
        res.json({ success: true });
    } catch (err: any) {
        console.error('Risk stop error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /v1/risk/status ─────────────────────────────────
router.get('/risk/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const result = await query(
            `SELECT id, starting_balance, starting_equity, sl_amount, tp_amount,
                    is_active, trigger_reason, triggered_at, created_at
             FROM user_risk_settings
             WHERE user_id = $1
             ORDER BY id DESC
             LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({ active: false, session: null });
        }

        const session = result.rows[0];

        let current = null;
        if (session.is_active) {
            const vpsAddress = await getUserVps(userId);
            if (vpsAddress) {
                try {
                    const account = await fetchAccount(vpsAddress);
                    const drawdown = session.starting_equity - account.equity;
                    const profit = account.equity - session.starting_equity;
                    current = {
                        balance: account.balance,
                        equity: account.equity,
                        drawdown: Math.max(0, drawdown),
                        profit: Math.max(0, profit),
                        raw_drawdown: drawdown,
                        raw_profit: profit,
                    };
                } catch (err) {
                    // EA offline — skip
                }
            }
        }

        res.json({
            active: session.is_active,
            session,
            current,
        });
    } catch (err: any) {
        console.error('Risk status error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /v1/risk/dismiss ────────────────────────────────
router.post('/risk/dismiss', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        await query(
            `UPDATE user_risk_settings 
             SET trigger_reason = NULL
             WHERE user_id = $1 AND trigger_reason IN ('sl_hit', 'tp_hit')`,
            [userId]
        );
        res.json({ success: true });
    } catch (err: any) {
        console.error('Risk dismiss error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Helper: Close all open positions on a VPS ────────────
async function closeAllPositions(vpsAddress: string): Promise<{ closed: number; failed: number }> {
    let closed = 0;
    let failed = 0;

    try {
        // Get list of open positions from EA
        const orders = await fetchOrderList(vpsAddress);
        const opened = orders?.opened || [];

        if (opened.length === 0) {
            console.log(`   → No open positions to close`);
            return { closed: 0, failed: 0 };
        }

        console.log(`   → Closing ${opened.length} open position(s)...`);

        // Close each sequentially
        for (const order of opened) {
            try {
                await closeSendOrder({ ticket: order.ticket }, vpsAddress);
                console.log(`   ✓ Closed ticket #${order.ticket}`);
                closed++;
            } catch (closeErr: any) {
                console.error(`   ✗ Failed to close ticket #${order.ticket}: ${closeErr.message}`);
                failed++;
            }
        }
    } catch (err: any) {
        console.error(`   ⚠ Failed to fetch open orders: ${err.message}`);
    }

    return { closed, failed };
}

// ─── Internal monitor function ────────────────────────────
export async function monitorRiskSessions() {
    try {
        const sessions = await query(`
            SELECT r.*, a.vps_address
            FROM user_risk_settings r
            JOIN user_mt5_accounts a ON a.user_id = r.user_id
            WHERE r.is_active = true AND a.vps_address IS NOT NULL
        `);

        for (const s of sessions.rows) {
            try {
                const account = await fetchAccount(s.vps_address);
                const equity = account.equity;
                const drawdown = s.starting_equity - equity;
                const profit = equity - s.starting_equity;

                let trigger: string | null = null;
                let message = '';

                if (s.sl_amount && drawdown >= s.sl_amount) {
                    trigger = 'sl_hit';
                    message = `Drawdown of $${drawdown.toFixed(2)} exceeded SL of $${s.sl_amount.toFixed(2)}`;
                } else if (s.tp_amount && profit >= s.tp_amount) {
                    trigger = 'tp_hit';
                    message = `Profit of $${profit.toFixed(2)} hit TP of $${s.tp_amount.toFixed(2)}`;
                }

                if (trigger) {
                    console.log(`🛑 Risk triggered for user ${s.user_id}: ${message}`);

                    // Step 1: Stop the master EA FIRST (prevents new trades during close loop)
                    try {
                        await setGlobalVariable('Master_Enabled', 0, s.vps_address);
                        console.log(`   → Master_Enabled set to 0`);
                    } catch (err: any) {
                        console.error(`   ⚠ Failed to stop master: ${err.message}`);
                    }

                    // Step 2: Close all open positions
                    const result = await closeAllPositions(s.vps_address);
                    console.log(`   ✅ Closed ${result.closed} position(s), ${result.failed} failed`);

                    // Step 3: Mark session as triggered
                    await query(
                        `UPDATE user_risk_settings 
                         SET is_active = false, trigger_reason = $1, triggered_at = NOW() 
                         WHERE id = $2`,
                        [trigger, s.id]
                    );
                }
            } catch (err: any) {
                // EA offline — skip this session
                console.warn(`Risk monitor: cannot reach VPS ${s.vps_address} for user ${s.user_id}:`, err.message);
            }
        }
    } catch (err: any) {
        console.error('Risk monitor error:', err);
    }
}

export default router;
