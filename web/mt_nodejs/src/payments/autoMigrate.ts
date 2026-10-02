// ═══════════════════════════════════════════════════════════════════
// Auto-migrate: runs schema.sql on server boot (idempotent).
// Safe to run every time — uses CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS.
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { query } from '../db';

let alreadyRan = false;

export async function autoMigratePayments(): Promise<void> {
  if (alreadyRan) return;
  alreadyRan = true;

  if (process.env.PAYMENTS_ENABLED !== 'true') {
    console.log('💤 Payments disabled — skipping schema migrate');
    return;
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn('⚠️  schema.sql not found — skipping migrate');
    return;
  }

  const raw = fs.readFileSync(schemaPath, 'utf8');

  // Strip line comments and split by semicolon
  const cleaned = raw
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');

  const statements = cleaned
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`💳 Running ${statements.length} schema statement(s)...`);

  let applied = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await query(stmt);
      applied++;
    } catch (err: any) {
      // Postgres codes we can safely ignore:
      //   42P07 = relation already exists
      //   42710 = duplicate_object
      //   42701 = column already exists (but IF NOT EXISTS handles this)
      const safe = ['42P07', '42710', '42701', '42P16'];
      if (safe.includes(err?.code)) {
        skipped++;
        continue;
      }
      console.error('❌ Schema statement failed:', err?.message);
      console.error('   SQL:', stmt.slice(0, 120), '...');
    }
  }
  console.log(`✅ Payments schema ready (applied: ${applied}, skipped: ${skipped})`);
}
