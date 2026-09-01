import express from 'express';
import axios from 'axios';

const router = express.Router();

// Configuration – use environment variables
const MT5_HOST = process.env.MT5_HOST || 'localhost';
const MT5_PORT = process.env.MT5_PORT || '8890';
const EA_BASE_URL = `http://${MT5_HOST}:${MT5_PORT}/v1`;

// In‑memory state (replace with DB later)
interface StrategyState {
    enabled: boolean;
    settings: Record<string, any>;
}

const strategies: Record<string, StrategyState> = {
    pipnex: {
        enabled: false,
        settings: {
            Lot: 0.01,
            PipStep: 10,
            CloseProfit: 0.30,
            MaxLoss: 0.50,
            MaxLevels: 20,
            Martingale: false,
        }
    },
    newspro: {
        enabled: false,
        settings: {
            LotSize: 0.01,
            EntryDistance: 50,
            StepDistance: 25,
            TrailingStop: 20,
            TrailingPending: 50,
            NumberOfOrders: 1,
        }
    },
    nova: {
        enabled: false,
        settings: {
            LotSize: 0.05,
            SwingStrength: 30,
            RewardRisk: 3.0,
            MaxPositions: 5,
        }
    }
};

// Helper to send command to EA via global variable
async function setGlobalVariable(name: string, value: any): Promise<void> {
    try {
        await axios.post(`${EA_BASE_URL}/global/set`, {
            name,
            value: typeof value === 'boolean' ? (value ? 1 : 0) : value
        });
    } catch (err) {
        console.error(`Failed to set global ${name}:`, err);
    }
}

// Map strategy IDs to global variable prefixes
const PREFIXES: Record<string, string> = {
    pipnex: 'PipNex',
    newspro: 'NewsPro',
    nova: 'Nova',
};

// Apply all settings for a strategy (including enable/disable)
async function applyStrategy(strategyId: string, enabled: boolean) {
    const prefix = PREFIXES[strategyId];
    if (!prefix) return;

    // First, disable all strategies
    for (const id of Object.keys(strategies)) {
        const p = PREFIXES[id];
        await setGlobalVariable(`${p}_Enable`, 0);
    }

    if (enabled) {
        // Enable this one
        await setGlobalVariable(`${prefix}_Enable`, 1);
        // Apply settings
        const settings = strategies[strategyId].settings;
        for (const [key, value] of Object.entries(settings)) {
            const varName = `${prefix}_${key}`;
            await setGlobalVariable(varName, value);
        }
    }
}

// GET status
router.get('/status', (req, res) => {
    res.json(strategies);
});

// Toggle strategy (enable/disable)
router.post('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { enabled } = req.body;
    if (!strategies[id]) {
        return res.status(404).json({ error: 'Strategy not found' });
    }

    // Update state
    strategies[id].enabled = enabled;
    
    // Apply to EA
    await applyStrategy(id, enabled);

    res.json({ success: true, state: strategies[id] });
});

// Update a single setting
router.post('/:id/settings', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (!strategies[id]) {
        return res.status(404).json({ error: 'Strategy not found' });
    }

    // Update in‑memory
    Object.assign(strategies[id].settings, updates);

    // If the strategy is enabled, apply the new setting immediately
    if (strategies[id].enabled) {
        const prefix = PREFIXES[id];
        for (const [key, value] of Object.entries(updates)) {
            await setGlobalVariable(`${prefix}_${key}`, value);
        }
    }

    res.json({ success: true, state: strategies[id] });
});

export default router;
