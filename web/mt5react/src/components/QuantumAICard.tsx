import React, { useState, useMemo } from 'react';
import {
    Brain, Sparkles, Shield,
    ChevronDown, ChevronUp, CheckCircle2, Info, Zap, RefreshCw
} from 'lucide-react';
import {
    analyzeAccount, suggestPipnexSettings, suggestNovaSettings, suggestSmcSettings,
    scoreTradeHealth, summarizeHealth,
    RISK_LEVELS, STRATEGY_MODES,
    type RiskLevel, type StrategyMode,
    type PipnexSuggestion, type NovaSuggestion, type SmcSuggestion,
} from './quantumAI';

interface QuantumAICardProps {
    balance: number;
    equity: number;
    positions: any[];
    riskSession: any | null;
    onApplyPipnex: (settings: PipnexSuggestion) => Promise<void> | void;
    onApplyNova: (settings: NovaSuggestion) => Promise<void> | void;
    onApplySmc: (settings: SmcSuggestion) => Promise<void> | void;
    disabled?: boolean;
}

export const QuantumAICard: React.FC<QuantumAICardProps> = ({
    balance,
    equity,
    positions,
    riskSession,
    onApplyPipnex,
    onApplyNova,
    onApplySmc,
    disabled = false,
}) => {
    const [expanded, setExpanded] = useState(false);
    const [mode, setMode] = useState<StrategyMode>('pipnex');
    const [risk, setRisk] = useState<RiskLevel>('moderate');
    const [analyzed, setAnalyzed] = useState(false);
    const [applying, setApplying] = useState(false);
    const [showHealth, setShowHealth] = useState(false);

    const account = useMemo(
        () => analyzeAccount(balance, equity, positions),
        [balance, equity, positions]
    );

    const pipnexSuggestion = useMemo(
        () => suggestPipnexSettings(balance, risk, positions?.length ?? 0),
        [balance, risk, positions]
    );

    const novaSuggestion = useMemo(
        () => suggestNovaSettings(balance, risk),
        [balance, risk]
    );

    const smcSuggestion = useMemo(
        () => suggestSmcSettings(balance, risk),
        [balance, risk]
    );

    const tradeScores = useMemo(
        () => (positions || []).map(p => scoreTradeHealth(p, positions, riskSession)),
        [positions, riskSession]
    );

    const summary = useMemo(() => summarizeHealth(tradeScores), [tradeScores]);

    const handleAnalyze = () => {
        setAnalyzed(true);
    };

    const handleApply = async () => {
        setApplying(true);
        try {
            if (mode === 'pipnex') {
                await onApplyPipnex(pipnexSuggestion);
            } else if (mode === 'nova') {
                await onApplyNova(novaSuggestion);
            } else {
                await onApplySmc(smcSuggestion);
            }
        } finally {
            setApplying(false);
        }
    };

    const currentSuggestion =
        mode === 'pipnex' ? pipnexSuggestion :
        mode === 'nova'   ? novaSuggestion   :
                            smcSuggestion;

    const currentReasons = currentSuggestion.reasons;

    const healthColorMap = {
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-400' },
        blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    dot: 'bg-blue-400' },
        amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   dot: 'bg-amber-400' },
        rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    dot: 'bg-rose-400' },
        orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/40',  dot: 'bg-orange-400' },
    };

    const ac = healthColorMap[account.color];

    return (
        <div className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border overflow-hidden transition-all ${
            expanded ? 'border-amber-500/40 shadow-lg shadow-amber-500/10' : 'border-amber-500/25 hover:border-amber-500/50'
        }`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-800/40 transition group"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 shadow-lg shadow-amber-500/40 group-hover:shadow-amber-500/60 transition-all group-hover:scale-105">
                        <Brain size={20} className="text-white" />
                    </div>
                    <div className="text-left min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base md:text-lg font-extrabold bg-gradient-to-r from-yellow-200 via-amber-200 to-orange-300 bg-clip-text text-transparent">
                                Quantum AI
                            </h2>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 uppercase font-bold tracking-wider">
                                Beta
                            </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5 truncate">
                            Smart advisor · Balance analysis · Trade health · Settings suggestions
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="hidden sm:inline text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        {expanded ? 'Close' : 'Open'}
                    </span>
                    <div className={`p-1.5 rounded-lg transition-all ${
                        expanded
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25'
                    }`}>
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-slate-700/40">
                    <div className="px-5 pt-5">
                        <div className={`${ac.bg} ${ac.border} border rounded-xl p-3 flex items-center gap-3`}>
                            <div className={`w-2 h-2 rounded-full ${ac.dot} animate-pulse flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <div className={`text-[10px] uppercase tracking-wider font-bold ${ac.text}`}>
                                    Account · {account.label}
                                </div>
                                <div className="text-slate-300 text-xs mt-0.5 truncate">
                                    {account.description}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 pt-4 space-y-3">
                        <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">
                                Strategy
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {STRATEGY_MODES.map((m) => (
                                    <button
                                        key={m.value}
                                        onClick={() => { setMode(m.value); setAnalyzed(false); }}
                                        disabled={disabled}
                                        className={`px-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                            mode === m.value
                                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]'
                                                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">
                                Risk Profile
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {RISK_LEVELS.map((r) => (
                                    <button
                                        key={r.value}
                                        onClick={() => { setRisk(r.value); setAnalyzed(false); }}
                                        disabled={disabled}
                                        className={`px-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                            risk === r.value
                                                ? r.value === 'conservative'
                                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30'
                                                    : r.value === 'moderate'
                                                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                                        : 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg shadow-rose-600/30'
                                                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={disabled || analyzed}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                analyzed
                                    ? 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-default'
                                    : 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 hover:from-yellow-300 hover:via-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 hover:scale-[1.02] active:scale-[0.98] border border-amber-300/40'
                            } disabled:cursor-not-allowed`}
                        >
                            {analyzed ? (
                                <>
                                    <CheckCircle2 size={14} />
                                    Analysis Complete
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} />
                                    Analyze Now
                                </>
                            )}
                        </button>
                    </div>

                    {analyzed && (
                        <div className="px-5 pt-4 pb-5 space-y-4 border-t border-slate-700/40 mt-4">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap size={12} className="text-amber-400" />
                                    <h3 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                        Suggested Settings · {mode === 'pipnex' ? 'PipNex' : mode === 'nova' ? 'NOVA' : 'SMC Trader'}
                                    </h3>
                                </div>

                                <div className="bg-slate-900/50 rounded-xl border border-slate-700/40 divide-y divide-slate-700/40">
                                    {Object.entries(currentSuggestion).map(([key, value]) => {
                                        if (key === 'reasons') return null;
                                        if (key === 'MaxLoss') return null;
                                        const reasonText = currentReasons[key];
                                        const displayValue = typeof value === 'boolean'
                                            ? (value ? 'ON' : 'OFF')
                                            : (typeof value === 'number' && (key.toLowerCase().includes('profit') || key.toLowerCase().includes('loss'))
                                                ? `$${Number(value).toFixed(2)}`
                                                : String(value));

                                        return (
                                            <div key={key} className="px-3 py-2.5 flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                        {key}
                                                    </div>
                                                    {reasonText && (
                                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                                            {reasonText}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm font-mono font-bold text-white flex-shrink-0">
                                                    {displayValue}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleApply}
                                    disabled={applying || disabled}
                                    className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {applying ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Applying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={14} />
                                            Apply to {mode === 'pipnex' ? 'PipNex' : mode === 'nova' ? 'NOVA' : 'SMC Trader'}
                                        </>
                                    )}
                                </button>
                            </div>

                            {tradeScores.length > 0 && (
                                <div>
                                    <button
                                        onClick={() => setShowHealth(!showHealth)}
                                        className="w-full flex items-center justify-between bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 transition"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Shield size={12} className="text-amber-400" />
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                Running Trades ({tradeScores.length})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-emerald-400 font-bold">🟢 {summary.healthy}</span>
                                            <span className="text-[10px] text-amber-400 font-bold">🟡 {summary.watch}</span>
                                            {summary.caution > 0 && <span className="text-[10px] text-orange-400 font-bold">🟠 {summary.caution}</span>}
                                            {summary.highRisk > 0 && <span className="text-[10px] text-rose-400 font-bold">🔴 {summary.highRisk}</span>}
                                            {showHealth ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                                        </div>
                                    </button>

                                    {showHealth && (
                                        <div className="mt-2 space-y-2">
                                            {tradeScores.map((t) => {
                                                const tc = healthColorMap[t.color];
                                                return (
                                                    <div key={t.ticket} className={`${tc.bg} ${tc.border} border rounded-xl p-2.5`}>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className={`w-2 h-2 rounded-full ${tc.dot} flex-shrink-0`} />
                                                                <span className="font-mono text-[10px] text-slate-400">#{t.ticket}</span>
                                                                <span className="text-xs font-bold text-white">{t.symbol}</span>
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                                    t.direction === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                                                                }`}>{t.direction}</span>
                                                            </div>
                                                            <div className={`text-xs font-bold ${tc.text} flex-shrink-0`}>{t.score}</div>
                                                        </div>
                                                        <div className="mt-1.5 text-[10px] text-slate-400 space-y-0.5">
                                                            {t.reasons.map((r, i) => (
                                                                <div key={i} className="flex items-start gap-1.5">
                                                                    <span className="text-slate-600 mt-0.5">•</span>
                                                                    <span>{r}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-2.5 flex items-start gap-2">
                                <Info size={12} className="text-slate-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-500">
                                    Quantum AI analyzes your account and suggests settings — it does not predict market direction or guarantee profits. Always review before applying.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuantumAICard;
