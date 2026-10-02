-- ═══════════════════════════════════════════════════════════════════
-- MT5-BRIDGE PAYMENT SCHEMA
-- Postgres. Adds 3 tables. Does NOT touch existing users table.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipnex_payments (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT,
  user_email            TEXT NOT NULL,
  user_name             TEXT,
  product_id            TEXT NOT NULL,
  product_name          TEXT NOT NULL,
  usd_price             REAL NOT NULL,
  exchange_rate         REAL NOT NULL DEFAULT 129,
  kes_amount            REAL NOT NULL,
  payment_method        TEXT NOT NULL,
  phone_number          TEXT,
  merchant_request_id   TEXT,
  checkout_request_id   TEXT,
  external_reference    TEXT,
  mpesa_receipt_number  TEXT,
  transaction_hash      TEXT,
  binance_id            TEXT,
  sms_message           TEXT,
  notes                 TEXT,
  status                TEXT NOT NULL DEFAULT 'PENDING',
  status_message        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_email   ON pipnex_payments (user_email);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON pipnex_payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON pipnex_payments (created_at DESC);

CREATE TABLE IF NOT EXISTS pipnex_deposits (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT,
  user_email            TEXT NOT NULL,
  amount                REAL NOT NULL,
  exchange_rate         REAL,
  amount_kes            REAL,
  status                TEXT NOT NULL DEFAULT 'PENDING',
  status_message        TEXT,
  mpesa_receipt_number  TEXT,
  checkout_request_id   TEXT,
  merchant_request_id   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deposits_email ON pipnex_deposits (user_email);

CREATE TABLE IF NOT EXISTS pipnex_credit_transactions (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT,
  user_email            TEXT NOT NULL,
  amount                REAL NOT NULL,
  kind                  TEXT NOT NULL,
  reference             TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_email ON pipnex_credit_transactions (user_email);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan              TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_expires_at   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status    TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS activated_at      TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vps_id            TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vps_provisioned_at TIMESTAMPTZ DEFAULT NULL;
