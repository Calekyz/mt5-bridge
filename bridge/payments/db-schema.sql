-- ═══════════════════════════════════════════════════════════════
-- PAYMENT SYSTEM — Postgres schema
-- Run in your new Neon project's SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipnex_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  usd_price REAL NOT NULL,
  exchange_rate REAL NOT NULL,
  kes_amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  phone_number TEXT,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  external_reference TEXT,
  mpesa_receipt_number TEXT,
  transaction_hash TEXT,
  binance_id TEXT,
  sms_message TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  status_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_email ON pipnex_payments (user_email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON pipnex_payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON pipnex_payments (created_at DESC);

CREATE TABLE IF NOT EXISTS pipnex_deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  amount REAL NOT NULL,
  exchange_rate REAL,
  amount_kes REAL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  status_message TEXT,
  mpesa_receipt_number TEXT,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deposits_email ON pipnex_deposits (user_email);

-- Referral columns (for the referrer's balance)
ALTER TABLE pipnex_users
  ADD COLUMN IF NOT EXISTS referral_balance REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_withdrawn REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_history JSONB DEFAULT '[]'::jsonb;
