// ═══════════════════════════════════════════════════════════════════
// Auto-migrate bridge schema on boot (idempotent)
// SQL is inlined so it works in production (tsc doesn't copy .sql)
// ═══════════════════════════════════════════════════════════════════
import { query } from '../db';

let alreadyRan = false;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS bridge_links (
  user_email         TEXT PRIMARY KEY,
  linked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_stats_at      TIMESTAMPTZ,
  last_balance       REAL,
  last_equity        REAL,
  last_daily_pnl     REAL,
  last_open_positions INT,
  last_meta          JSONB
);

CREATE INDEX IF NOT EXISTS idx_bridge_links_stats ON bridge_links (last_stats_at DESC);

CREATE TABLE IF NOT EXISTS bridge_signals (
  id                 TEXT PRIMARY KEY,
  user_email         TEXT NOT NULL,
  action             TEXT NOT NULL,
  symbol             TEXT NOT NULL,
  side               TEXT,
  volume             REAL,
  sl                 REAL,
  tp                 REAL,
  ticket             INTEGER,
  comment            TEXT,
  status             TEXT NOT NULL DEFAULT 'PENDING',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at       TIMESTAMPTZ,
  executed_at        TIMESTAMPTZ,
  execution_ticket   INTEGER,
  execution_price    REAL,
  error_message      TEXT
);

CREATE INDEX IF NOT EXISTS idx_bridge_signals_email   ON bridge_signals (user_email);
CREATE INDEX IF NOT EXISTS idx_bridge_signals_status  ON bridge_signals (status);
CREATE INDEX IF NOT EXISTS idx_bridge_signals_created ON bridge_signals (created_at DESC);
`;

export async function autoMigrateBridge(): Promise<void> {
  if (alreadyRan) return;
  alreadyRan = true;

  if (process.env.BRIDGE_ENABLED !== 'true') {
    console.log('🌉 Bridge disabled — skipping schema migrate');
    return;
  }

  const statements = SCHEMA_SQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`🌉 Running ${statements.length} bridge schema statement(s)...`);

  let applied = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await query(stmt);
      applied++;
    } catch (err: any) {
      const safe = ['42P07', '42710', '42701', '42P16'];
      if (safe.includes(err?.code)) {
        skipped++;
        continue;
      }
      console.error('❌ Bridge schema statement failed:', err?.message);
    }
  }
  console.log(`✅ Bridge schema ready (applied: ${applied}, skipped: ${skipped})`);
}
