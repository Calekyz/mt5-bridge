import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface AccountStatsProps {
    balance: number;
    equity: number;
    profit: number;
    currency?: string;
}

export const AccountStats: React.FC<AccountStatsProps> = ({
    balance,
    equity,
    profit,
    currency = '$',
}) => {
    const isProfit = profit >= 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Wallet size={16} />
                    Balance
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                    {currency}{balance.toFixed(2)}
                </div>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Wallet size={16} />
                    Equity
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                    {currency}{equity.toFixed(2)}
                </div>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    Profit
                </div>
                <div className={`text-2xl font-bold mt-1 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{currency}{profit.toFixed(2)}
                </div>
            </div>
        </div>
    );
};
