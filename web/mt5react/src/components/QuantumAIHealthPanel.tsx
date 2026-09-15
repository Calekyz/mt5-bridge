import React, { useState, useMemo } from 'react';
import {
    Brain, ChevronDown, ChevronUp, Shield, Activity
} from 'lucide-react';
import {
    scoreTradeHealth, summarizeHealth,
    type TradeHealth
} from './quantumAI';

interface QuantumAIHealthPanelProps {
    positions: any[];
    riskSession: any | null;
}

export const QuantumAIHealthPanel: React.FC<QuantumAIHealthPanelProps> = ({
    positions,
    riskSession,
}) => {
    const [expanded, setExpanded] = useState(false);

    const scores: TradeHealth[] = useMemo(
        () => (positions || []).map(p => scoreTradeHealth(p, positions, riskSession)),
        [positions, riskSession]
    );

    const summary = useMemo(() => summarizeHealth(scores), [scores]);

    // Don't render if no positions
    if (scores.length === 0) return null;

    const healthColorMap = {
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-400' },
        amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   dot: 'bg-amber-400' },
        orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/40',  dot: 'bg-orange-400' },
        rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    dot: 'bg-rose-400' },
    };

    const avgColor: 'emerald' | 'amber' | 'orange' | 'rose' =
        summary.avgScore >= 80 ? 'emerald'
        : summary.avgScore >= 60 ? 'amber'
        : summary.avgScore >= 40 ? 'orange'
        : 'rose';

    const ac = healthColorMap[avgColor];

    return (
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-purple-500/30 overflow-hidden">
            {/* ─── HEADER (always visible) ─────────────────────── */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/40 transition"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-pink-700 shadow-lg shadow-purple-600/30">
                        <Brain size={14} className="text-white" />
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-2">
                            Quantum AI Health
                            <span className={`${ac.text} font-mono`}>
                                avg {summary.avgScore}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            {summary.healthy > 0 && (
                                <span className="text-[10px] text-emerald-400 font-bold">
                                    🟢 {summary.healthy} healthy
                                </span>
                            )}
                            {summary.watch > 0 && (
                                <span className="text-[10px] text-amber-400 font-bold">
                                    🟡 {summary.watch} watch
                                </span>
                            )}
                            {summary.caution > 0 && (
                                <span className="text-[10px] text-orange-400 font-bold">
                                    🟠 {summary.caution} caution
                                </span>
                            )}
                            {summary.highRisk > 0 && (
                                <span className="text-[10px] text-rose-400 font-bold">
                                    🔴 {summary.highRisk} high risk
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="hidden sm:inline text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        {expanded ? 'Collapse' : 'Expand'}
                    </span>
                    {expanded
                        ? <ChevronUp size={16} className="text-slate-500" />
                        : <ChevronDown size={16} className="text-slate-500" />
                    }
                </div>
            </button>

            {/* ─── EXPANDED DETAIL ─────────────────────────────── */}
            {expanded && (
                <div className="border-t border-slate-700/40 p-4 space-y-3">
                    {/* Summary strip */}
                    <div className={`${ac.bg} ${ac.border} border rounded-xl p-3 flex items-center gap-3`}>
                        <Activity size={14} className={ac.text} />
                        <div className="flex-1">
                            <div className={`text-[10px] uppercase tracking-wider font-bold ${ac.text}`}>
                                Overall Basket · {summary.avgScore >= 80 ? 'Healthy' : summary.avgScore >= 60 ? 'Watch' : summary.avgScore >= 40 ? 'Caution' : 'High Risk'}
                            </div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                                Average score {summary.avgScore}/100 across {summary.total} position{summary.total !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    {/* Per-trade cards */}
                    {scores.map((t) => {
                        const tc = healthColorMap[t.color];
                        const isProfit = t.profit >= 0;
                        return (
                            <div
                                key={t.ticket}
                                className={`${tc.bg} ${tc.border} border rounded-xl p-3`}
                            >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2 h-2 rounded-full ${tc.dot} flex-shrink-0`} />
                                        <span className="font-mono text-[10px] text-slate-400">
                                            #{t.ticket}
                                        </span>
                                        <span className="text-xs font-bold text-white">
                                            {t.symbol}
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                            t.direction === 'BUY'
                                                ? 'bg-emerald-500/15 text-emerald-400'
                                                : 'bg-rose-500/15 text-rose-400'
                                        }`}>
                                            {t.direction}
                                        </span>
                                        <span className={`text-[10px] font-mono font-bold ${
                                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                            {isProfit ? '+' : ''}${t.profit.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className={`text-sm font-mono font-bold ${tc.text} flex-shrink-0`}>
                                        {t.score}
                                        <span className="text-[9px] text-slate-500 ml-1">
                                            {t.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {t.reasons.map((r, i) => (
                                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                                            <span className="text-slate-600 mt-0.5">•</span>
                                            <span>{r}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Disclaimer */}
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1">
                        <Shield size={10} className="text-slate-600" />
                        Health scores are risk ratings, not profit predictions.
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuantumAIHealthPanel;
