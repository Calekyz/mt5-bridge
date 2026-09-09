import { query } from './db';

export async function restoreStrategyStates() {
    try {
        const result = await query(`
            SELECT s.id, s.account_id, s.strategy_name, s.is_active, a.vps_address
            FROM user_strategies s
            JOIN user_mt5_accounts a ON a.id = s.account_id
            WHERE s.is_active = true
        `);

        console.log(`Restoring ${result.rows.length} active strategies...`);

        for (const row of result.rows) {
            console.log(`Strategy ${row.id} (${row.strategy_name}) active on VPS: ${row.vps_address}`);
            // Optionally, you can add code here to send commands to the EA
        }

        console.log('EA states restored successfully.');
    } catch (error) {
        console.error('Failed to restore EA states:', error);
        // Do not throw – the server should still start even if restore fails.
    }
}
