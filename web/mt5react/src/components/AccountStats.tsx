// @ts-nocheck
import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface AccountStatsProps {
    balance: number;
    equity: number;
    profit: number;
    currency?: string;
}

function formatMoney(n: number): string {
    return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const AccountStats: React.FC<AccountStatsProps> = ({
    balance,
    equity,
    profit,
    currency = '$',
}) => {
    const isProfit = profit >= 0;
    const profitPct = balance > 0 ? (profit / balance) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* ═══════ HERO — BALANCE ═══════ */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-xl shadow-black/40 group">
                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

                <div className="relative p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/30">
                                <Wallet size={12} className="text-cyan-300" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                                Balance
                            </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 tracking-wider">
                            ACCOUNT
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-medium text-slate-500 tabular-nums">{currency}</span>
                        <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none tabular-nums">
                            {formatMoney(balance)}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="w-1 h-1 rounded-full bg-cyan-400/70" />
                        <span className="font-medium">Total account value</span>
                    </div>
                </div>
            </div>

            {/* ═══════ EQUITY ═══════ */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-xl shadow-black/40 group">
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-violet-500/12 to-purple-600/8 blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

                <div className="relative p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/30">
                                <Activity size={12} className="text-violet-300" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                                Equity
                            </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 tracking-wider">
                            LIVE
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-medium text-slate-500 tabular-nums">{currency}</span>
                        <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none tabular-nums">
                            {formatMoney(equity)}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="w-1 h-1 rounded-full bg-violet-400/70" />
                        <span className="font-medium">Balance + floating</span>
                    </div>
                </div>
            </div>

            {/* ═══════ PROFIT / LOSS ═══════ */}
            <div className={`relative rounded-2xl overflow-hidden border shadow-xl shadow-black/40 group transition-all ${
                isProfit
                    ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950'
                    : 'border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-950'
            }`}>
                <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
                    isProfit
                        ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/10'
                        : 'bg-gradient-to-br from-rose-500/20 to-red-600/10'
                }`} />
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                    isProfit ? 'via-emerald-400/60' : 'via-rose-400/60'
                }`} />

                <div className="relative p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg border ${
                                isProfit
                                    ? 'bg-emerald-500/20 border-emerald-500/40'
                                    : 'bg-rose-500/20 border-rose-500/40'
                            }`}>
                                {isProfit
                                    ? <TrendingUp size={12} className="text-emerald-300" />
                                    : <TrendingDown size={12} className="text-rose-300" />
                                }
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                                {isProfit ? 'Profit' : 'Loss'}
                            </span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${
                            isProfit
                                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                                : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                        }`}>
                            {isProfit ? '+' : ''}{profitPct.toFixed(2)}%
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-sm font-medium tabular-nums ${isProfit ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                            {isProfit ? '+' : '-'}{currency}
                        </span>
                        <span className={`text-3xl md:text-4xl font-extrabold tracking-tight leading-none tabular-nums ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                            {formatMoney(profit)}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-[10px]">
                        <span className={`w-1 h-1 rounded-full ${isProfit ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className={`font-medium ${isProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                            {isProfit ? 'Floating gain' : 'Floating loss'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
