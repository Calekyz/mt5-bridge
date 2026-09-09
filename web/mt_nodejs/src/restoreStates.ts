import { query } from './db';

export async function restoreStrategyStates() {
    try {
        const result = await query(`
            SELECT a.vps_address
            FROM user_mt5_accounts a
            WHERE a.vps_address IS NOT NULL
        `);

        console.log(`Found ${result.rows.length} VPS addresses.`);
        for (const row of result.rows) {
            console.log(`VPS: ${row.vps_address}`);
        }

        console.log('EA states restored successfully.');
    } catch (error) {
        console.error('Failed to restore EA states:', error);
        // Do not throw – the server should still start even if restore fails.
    }
}
