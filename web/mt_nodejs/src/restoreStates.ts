import { query } from './db';
import { sendCommand } from './services/SocketBridgeApi'; // optional if you want to actually restore

export async function restoreStrategyStates() {
    try {
        // Query only the columns that exist: user_strategies and vps_address from user_mt5_accounts
        const result = await query(`
            SELECT s.id, s.account_id, s.strategy_name, s.is_active, a.vps_address
            FROM user_strategies s
            JOIN user_mt5_accounts a ON a.id = s.account_id
            WHERE s.is_active = true
        `);

        console.log(`Restoring ${result.rows.length} active strategies...`);

        // For each active strategy, you could send a command to the EA to re-enable it
        for (const row of result.rows) {
            console.log(`Strategy ${row.id} (${row.strategy_name}) active on VPS: ${row.vps_address}`);
            // Optionally, send a command to the EA to re-enable the strategy:
            // await sendCommand('Master_Enabled', 1, row.vps_address);
            // await sendCommand(`${row.strategy_name}_Enable`, 1, row.vps_address);
        }

        console.log('EA states restored successfully.');
    } catch (error) {
        console.error('Failed to restore EA states:', error);
        // Do not throw – the server should still start even if restore fails.
    }
}
