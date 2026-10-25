-- ═══════════════════════════════════════════════════════════════════
-- BRIDGE SCHEMA — token-based API between piptraderai.com ↔ mt5-bridge
-- Idempotent (CREATE TABLE IF NOT EXISTS)
-- To undo: DROP TABLE bridge_links, bridge_signals;
-- ═══════════════════════════════════════════════════════════════════

-- ─── One row per linked user ───
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

-- ─── One row per signal ───
CREATE TABLE IF NOT EXISTS bridge_signals (
  id                 TEXT PRIMARY KEY,
  user_email         TEXT NOT NULL,
  action             TEXT NOT NULL,          -- 'open' | 'close' | 'modify'
  symbol             TEXT NOT NULL,
  side               TEXT,                   -- 'buy' | 'sell' (for 'open')
  volume             REAL,
  sl                 REAL,
  tp                 REAL,
  ticket             INTEGER,                -- for 'close' / 'modify'
  comment            TEXT,
  status             TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | DELIVERED | EXECUTED | FAILED | CANCELLED
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
