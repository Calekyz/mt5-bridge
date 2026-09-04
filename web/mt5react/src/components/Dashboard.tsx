import React, { useState, useEffect } from 'react';
import { useAccount, sendCommand } from '../hooks/useApi';
import { AccountStats } from './AccountStats';
import { StrategySettings } from './StrategySettings';
import { Loader2, Power, PowerOff, AlertCircle } from 'lucide-react';

type Strategy = 'pipnex' | 'nova';

export const Dashboard: React.FC = () => {
    const { account, loading, error, refetch } = useAccount();
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('pipnex');
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [commandError, setCommandError] = useState<string | null>(null);

    const handleStartStop = async () => {
        setIsToggling(true);
        setCommandError(null);
        try {
            await sendCommand('Master_Strategy', selectedStrategy);
            await sendCommand('Master_Settings', JSON.stringify(settings));
            const newState = !isRunning;
            await sendCommand('Master_Enabled', newState ? 1 : 0);
            setIsRunning(newState);
        } catch (err: any) {
            setCommandError(err.message || 'Failed to toggle strategy');
        } finally {
            setIsToggling(false);
        }
    };

    useEffect(() => {
        setSettings({});
    }, [selectedStrategy]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        📊 Trading Dashboard
                    </h1>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="text-slate-300">Live</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button onClick={refetch} className="ml-auto text-sm underline">Retry</button>
                    </div>
                ) : account ? (
                    <AccountStats
                        balance={account.balance}
                        equity={account.equity}
                        profit={account.equity - account.balance}
                        currency={account.currency || '$'}
                    />
                ) : null}

                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="text-slate-300 font-medium text-sm">Select Strategy:</label>
                        <div className="flex flex-wrap gap-2">
                            {(['pipnex', 'nova'] as Strategy[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedStrategy(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        selectedStrategy === s
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    {s === 'pipnex' ? 'PipNex' : 'NOVA'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 md:p-6">
                    <StrategySettings
                        strategy={selectedStrategy}
                        onSettingsChange={setSettings}
                        initialSettings={settings}
                    />
                </div>

                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">Status:</span>
                        <span className={`font-semibold ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
                            {isRunning ? 'Running' : 'Stopped'}
                        </span>
                        {isRunning && <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>}
                    </div>
                    <button
                        onClick={handleStartStop}
                        disabled={isToggling}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                            isRunning
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
                        }`}
                    >
                        {isToggling ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isRunning ? (
                            <>
                                <PowerOff size={18} /> Stop
                            </>
                        ) : (
                            <>
                                <Power size={18} /> Start
                            </>
                        )}
                    </button>
                </div>

                {commandError && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{commandError}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
