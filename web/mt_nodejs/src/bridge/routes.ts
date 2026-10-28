// ═══════════════════════════════════════════════════════════════════
// BRIDGE API — token-based, server-to-server
// Every endpoint requires: X-Bridge-Token: <BRIDGE_TOKEN env>
// All 9 endpoints have full rights (read + write)
// ═══════════════════════════════════════════════════════════════════
import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { query } from '../db';

import { postSendOrder, closeSendOrder } from '../services/SocketBridgeApi';
const router = Router();

const SHARED_TOKEN = process.env.BRIDGE_TOKEN || '';

// ─── Shared token middleware ───
function requireBridgeToken(req: Request, res: Response, next: NextFunction) {
  if (!SHARED_TOKEN) {
    return res.status(503).json({ ok: false, reason: 'bridge_not_configured' });
  }
  const token = String(req.headers['x-bridge-token'] || '');
  if (!token || token !== SHARED_TOKEN) {
    return res.status(401).json({ ok: false, reason: 'invalid_token' });
  }
  next();
}

router.use(requireBridgeToken);

function generateSignalId(): string {
  return (
    'SIG_' +
    Date.now().toString(36).toUpperCase() +
    '_' +
    crypto.randomBytes(3).toString('hex').toUpperCase()
  );
}

// ═══════════════════════════════════════════════════════════════════
// 1. GET /bridge/health — status check
// ═══════════════════════════════════════════════════════════════════
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const r = await query('SELECT COUNT(*)::int as n FROM bridge_links');
    res.json({
      ok: true,
      bridge_enabled: true,
      linked_users: r.rows[0]?.n || 0,
      server_time: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'db_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 2. POST /bridge/link — verify email exists, mark as linked
// Body: { email }
// ═══════════════════════════════════════════════════════════════════
router.post('/link', async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, reason: 'email_required' });

    const userRes = await query(
      'SELECT id, email, role FROM users WHERE LOWER(email) = $1',
      [email]
    );
    if (userRes.rows.length === 0) {
      return res.json({ ok: false, reason: 'unknown_email' });
    }
    const user = userRes.rows[0];

    const vpsRes = await query(
      'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    const vps = vpsRes.rows[0]?.vps_address || null;

    await query(
      `INSERT INTO bridge_links (user_email) VALUES ($1)
       ON CONFLICT (user_email) DO UPDATE SET linked_at = NOW()`,
      [email]
    );

    res.json({
      ok: true,
      user_id: user.id,
      email: user.email,
      role: user.role,
      has_vps: !!vps,
      vps_address: vps,
      status: 'linked',
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 3. POST /bridge/push-stats — EA sends live balance/equity/positions
// Body: { email, balance, equity, daily_pnl, open_positions, account?, broker?, ts? }
// ═══════════════════════════════════════════════════════════════════
router.post('/push-stats', async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, reason: 'email_required' });

    const { balance, equity, daily_pnl, open_positions, account, broker, ts } = req.body;
    const meta = { account: account ?? null, broker: broker ?? null, ts: ts ?? Date.now() };

    await query(
      `INSERT INTO bridge_links
         (user_email, last_stats_at, last_balance, last_equity, last_daily_pnl, last_open_positions, last_meta)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6)
       ON CONFLICT (user_email) DO UPDATE SET
         last_stats_at      = NOW(),
         last_balance       = COALESCE($2, bridge_links.last_balance),
         last_equity        = COALESCE($3, bridge_links.last_equity),
         last_daily_pnl     = COALESCE($4, bridge_links.last_daily_pnl),
         last_open_positions = COALESCE($5, bridge_links.last_open_positions),
         last_meta          = COALESCE($6, bridge_links.last_meta)`,
      [
        email,
        balance ?? null,
        equity ?? null,
        daily_pnl ?? null,
        open_positions ?? null,
        meta,
      ]
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 4. POST /bridge/push-signal — create signal for a user
// Body: { email, action, symbol, side?, volume?, sl?, tp?, ticket?, comment? }
// ═══════════════════════════════════════════════════════════════════
router.post('/push-signal', async (req: Request, res: Response) => {
  try {
    const { email, action, symbol, side, volume, sl, tp, ticket, comment } = req.body || {};
    if (!email || !action || !symbol) {
      return res.status(400).json({ ok: false, reason: 'missing_fields', required: ['email', 'action', 'symbol'] });
    }

    const id = generateSignalId();
    await query(
      `INSERT INTO bridge_signals
         (id, user_email, action, symbol, side, volume, sl, tp, ticket, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        String(email).toLowerCase(),
        action,
        symbol,
        side ?? null,
        volume ?? null,
        sl ?? null,
        tp ?? null,
        ticket ?? null,
        comment ?? null,
      ]
    );

    res.json({ ok: true, signal_id: id });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 5. GET /bridge/pull-signals?email=xxx — EA polls for pending signals
// ═══════════════════════════════════════════════════════════════════
router.get('/pull-signals', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, reason: 'email_required' });

    const result = await query(
      `SELECT id, action, symbol, side, volume, sl, tp, ticket, comment, created_at
       FROM bridge_signals
       WHERE user_email = $1 AND status = 'PENDING'
       ORDER BY created_at ASC
       LIMIT 20`,
      [email]
    );

    if (result.rows.length > 0) {
      const ids = result.rows.map((r: any) => r.id);
      await query(
        `UPDATE bridge_signals SET status = 'DELIVERED', delivered_at = NOW()
         WHERE id = ANY($1::text[])`,
        [ids]
      );
    }

    res.json({ ok: true, signals: result.rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 6. POST /bridge/ack-signal — EA confirms execution
// Body: { email, signal_id, ticket?, price?, ok?, error? }
// ═══════════════════════════════════════════════════════════════════
router.post('/ack-signal', async (req: Request, res: Response) => {
  try {
    const { email, signal_id, ticket, price, ok, error } = req.body || {};
    if (!email || !signal_id) {
      return res.status(400).json({ ok: false, reason: 'missing_fields', required: ['email', 'signal_id'] });
    }

    const status = ok === true ? 'EXECUTED' : 'FAILED';
    await query(
      `UPDATE bridge_signals SET
         status           = $1,
         executed_at      = NOW(),
         execution_ticket = $2,
         execution_price  = $3,
         error_message    = $4
       WHERE id = $5 AND user_email = $6`,
      [status, ticket ?? null, price ?? null, error ?? null, signal_id, String(email).toLowerCase()]
    );

    res.json({ ok: true, status });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 7. GET /bridge/user-stats?email=xxx — read latest snapshot
// ═══════════════════════════════════════════════════════════════════
router.get('/user-stats', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, reason: 'email_required' });

    const result = await query('SELECT * FROM bridge_links WHERE user_email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ ok: false, reason: 'not_linked' });
    }
    const row = result.rows[0];
    res.json({
      ok: true,
      email: row.user_email,
      linked_at: row.linked_at,
      last_stats_at: row.last_stats_at,
      balance: row.last_balance,
      equity: row.last_equity,
      daily_pnl: row.last_daily_pnl,
      open_positions: row.last_open_positions,
      meta: row.last_meta,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 8. GET /bridge/signals?email=xxx OR ?all=true — read signal history
// ═══════════════════════════════════════════════════════════════════
router.get('/signals', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    const all = req.query.all === 'true';

    let result;
    if (all) {
      result = await query(
        `SELECT * FROM bridge_signals ORDER BY created_at DESC LIMIT 200`
      );
    } else if (email) {
      result = await query(
        `SELECT * FROM bridge_signals WHERE user_email = $1 ORDER BY created_at DESC LIMIT 100`,
        [email]
      );
    } else {
      return res.status(400).json({ ok: false, reason: 'email_or_all_required' });
    }

    res.json({ ok: true, signals: result.rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 9. GET /bridge/users — list all linked users
// ═══════════════════════════════════════════════════════════════════
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM bridge_links ORDER BY last_stats_at DESC NULLS LAST, linked_at DESC`
    );
    res.json({ ok: true, users: result.rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// DIRECT EXECUTE — send order to user's SocketBridge EA on VPS
// Requires: X-Bridge-Token (already enforced by router middleware above)
// ═══════════════════════════════════════════════════════════════════
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { email, symbol, side, volume, sl, tp, comment, ticket, action } = req.body || {};
    if (!email || !symbol) {
      return res.status(400).json({ ok: false, error: 'email_and_symbol_required' });
    }

    const userRes = await query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [String(email).toLowerCase()]
    );
    if (userRes.rows.length === 0) {
      return res.json({ ok: false, error: 'user_not_found' });
    }

    const vpsRes = await query(
      'SELECT vps_address FROM user_mt5_accounts WHERE user_id = $1 LIMIT 1',
      [userRes.rows[0].id]
    );
    const vps = vpsRes.rows[0]?.vps_address;
    if (!vps) {
      return res.json({ ok: false, error: 'no_vps_assigned', email });
    }

    if (action === 'close') {
      if (!ticket) return res.status(400).json({ ok: false, error: 'ticket_required_for_close' });
      const result = await closeSendOrder({ ticket, symbol }, vps);
      console.log('[bridge/execute] CLOSE sent for', email, 'ticket', ticket);
      return res.json({ ok: true, mode: 'close', result });
    }

    const orderBody = {
      symbol,
      volume: Number(volume) || 0.01,
      order_type: String(side || 'buy').toLowerCase(),
      deviation: 5,
      sl: sl ?? undefined,
      tp: tp ?? undefined,
      comment: comment || 'PipTrader trade'
    };

    const result = await postSendOrder(orderBody, vps);
    console.log('[bridge/execute] OPEN sent for', email, symbol, side, volume);
    return res.json({ ok: true, mode: 'direct', result });
  } catch (err: any) {
    console.error('[bridge/execute] failed:', err?.message);
    return res.status(500).json({ ok: false, error: err?.message || 'execute_failed' });
  }
});

export default router;
