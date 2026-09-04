import React, { useState } from 'react';

interface StrategySetting {
    key: string;
    label: string;
    type: 'number' | 'checkbox' | 'text';
    step?: number;
    min?: number;
    max?: number;
    default: any;
}

interface StrategySettingsProps {
    strategy: 'pipnex' | 'newspro' | 'nova';
    onSettingsChange: (settings: Record<string, any>) => void;
    initialSettings?: Record<string, any>;
}

const STRATEGY_DEFS: Record<string, { label: string; settings: StrategySetting[] }> = {
    pipnex: {
        label: 'PipNex Algo',
        settings: [
            { key: 'lot', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.01 },
            { key: 'pipStep', label: 'Pip Step', type: 'number', step: 1, min: 1, default: 10 },
            { key: 'closeProfit', label: 'Close Profit ($)', type: 'number', step: 0.05, min: 0, default: 0.30 },
            { key: 'maxLoss', label: 'Max Loss ($)', type: 'number', step: 0.05, min: 0, default: 0.50 },
            { key: 'maxLevels', label: 'Max Levels', type: 'number', step: 1, min: 1, default: 20 },
            { key: 'martingale', label: 'Martingale', type: 'checkbox', default: false },
        ],
    },
    newspro: {
        label: 'NewsPro MX4',
        settings: [
            { key: 'lotSize', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.01 },
            { key: 'entryDistance', label: 'Entry Distance (pts)', type: 'number', step: 1, min: 1, default: 50 },
            { key: 'stepDistance', label: 'Step Distance (pts)', type: 'number', step: 1, min: 1, default: 25 },
            { key: 'trailingStop', label: 'Trailing Stop (pts)', type: 'number', step: 1, min: 0, default: 20 },
            { key: 'trailingPending', label: 'Trailing Pending (pts)', type: 'number', step: 1, min: 0, default: 50 },
            { key: 'numberOfOrders', label: 'Number of Orders', type: 'number', step: 1, min: 1, default: 1 },
        ],
    },
    nova: {
        label: 'NOVA EDGE AI',
        settings: [
            { key: 'lotSize', label: 'Lot Size', type: 'number', step: 0.01, min: 0.01, default: 0.05 },
            { key: 'swingStrength', label: 'Swing Strength', type: 'number', step: 1, min: 1, default: 30 },
            { key: 'rewardRisk', label: 'Reward/Risk', type: 'number', step: 0.1, min: 0.1, default: 3.0 },
            { key: 'maxPositions', label: 'Max Positions', type: 'number', step: 1, min: 1, default: 5 },
        ],
    },
};

export const StrategySettings: React.FC<StrategySettingsProps> = ({
    strategy,
    onSettingsChange,
    initialSettings = {},
}) => {
    const def = STRATEGY_DEFS[strategy];
    const [settings, setSettings] = useState<Record<string, any>>(() => {
        const defaults: Record<string, any> = {};
        def.settings.forEach(s => {
            defaults[s.key] = s.default;
        });
        return { ...defaults, ...initialSettings };
    });

    const handleChange = (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        onSettingsChange(newSettings);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">{def.label} Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {def.settings.map((setting) => (
                    <div key={setting.key} className="flex flex-col">
                        <label className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            {setting.label}
                        </label>
                        {setting.type === 'checkbox' ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!settings[setting.key]}
                                    onChange={(e) => handleChange(setting.key, e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                />
                                <span className="text-sm text-slate-300">Enabled</span>
                            </label>
                        ) : (
                            <input
                                type="number"
                                step={setting.step || 0.01}
                                min={setting.min}
                                max={setting.max}
                                value={settings[setting.key] ?? ''}
                                onChange={(e) => handleChange(setting.key, parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
