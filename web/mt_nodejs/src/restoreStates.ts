import { query } from './db';
import axios from 'axios';

const MT5_HOST = process.env.MT5_HOST || 'localhost';
const MT5_PORT = process.env.MT5_PORT || '8890';
const EA_BASE_URL = `http://${MT5_HOST}:${MT5_PORT}/v1`;

async function setGlobalVariable(name: string, value: any) {
    try {
        await axios.post(`${EA_BASE_URL}/global/set`, {
            name,
            value: typeof value === 'boolean' ? (value ? 1 : 0) : value
        });
    } catch (err) {
        console.error(`Failed to set ${name}:`, err);
    }
}

export async function restoreStrategyStates() {
    try {
        // Get all active strategies across all users
        const result = await query(
            `SELECT s.*, a.login, a.server 
             FROM user_strategies s
             JOIN user_mt5_accounts a ON a.id = s.account_id
             WHERE s.is_active = true`
        );

        console.log(`Restoring ${result.rows.length} active strategies...`);

        for (const strategy of result.rows) {
            const varName = strategy.ea_name === 'pipnex' ? 'PipNex_Enable' : 'Nova_Enable';
            await setGlobalVariable(varName, 1);

            const prefix = strategy.ea_name === 'pipnex' ? 'PipNex_' : 'Nova_';
            for (const [key, value] of Object.entries(strategy.settings)) {
                await setGlobalVariable(`${prefix}${key}`, value);
            }

            console.log(`Restored ${strategy.ea_name} for user ${strategy.user_id}`);
        }

        // Set Master_Enabled if any strategy is active
        if (result.rows.length > 0) {
            await setGlobalVariable('Master_Enabled', 1);
        }

        console.log('EA states restored successfully.');
    } catch (err) {
        console.error('Failed to restore EA states:', err);
    }
}
