// ═══════════════════════════════════════════════════════════════════
// Auto-migrate bridge schema on boot (idempotent)
// ═══════════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import { query } from '../db';

let alreadyRan = false;

export async function autoMigrateBridge(): Promise<void> {
  if (alreadyRan) return;
  alreadyRan = true;

  if (process.env.BRIDGE_ENABLED !== 'true') {
    console.log('🌉 Bridge disabled — skipping schema migrate');
    return;
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn('⚠️  bridge/schema.sql not found — skipping migrate');
    return;
  }

  const raw = fs.readFileSync(schemaPath, 'utf8');
  const cleaned = raw
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');

  const statements = cleaned
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
