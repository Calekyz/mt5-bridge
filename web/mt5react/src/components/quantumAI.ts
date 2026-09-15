export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';
export type StrategyMode = 'scalper' | 'swing';

export const RISK_LEVELS: { value: RiskLevel; label: string; description: string }[] = [
    { value: 'conservative', label: 'Conservative', description: 'Safest lot sizing, wider grid, fewer levels' },
    { value: 'moderate',     label: 'Moderate',     description: 'Balanced risk-to-reward' },
    { value: 'aggressive',   label: 'Aggressive',   description: 'Higher lots, tighter grid, more levels' },
];

export const STRATEGY_MODES: { value: StrategyMode; label: string; description: string }[] = [
    { value: 'scalper', label: 'Scalper', description: 'PipNex grid · high frequency' },
    { value: 'swing',   label: 'Swing',   description: 'NOVA AI · Fibonacci levels' },
];

export interface AccountHealth {
    label: 'Strong' | 'Stable' | 'Stretched' | 'At Risk';
    color: 'emerald' | 'blue' | 'amber' | 'rose';
    floating: number;
    floatingPct: number;
    description: string;
}

export interface PipnexSuggestion {
    Lot: number;
    PipStep: number;
    CloseProfit: number;
    MinProfitPercent: number;
    MaxLevels: number;
    Martingale: boolean;
    reasons: Record<string, string>;
}

export interface NovaSuggestion {
    LotSize: number;
    SwingStrength: number;
    RewardRisk: number;
    MaxPositions: number;
    reasons: Record<string, string>;
}

export interface TradeHealth {
    ticket: number;
    symbol: string;
    direction: string;
    profit: number;
    score: number;
    label: 'Healthy' | 'Watch' | 'Caution' | 'High Risk';
    color: 'emerald' | 'amber' | 'orange' | 'rose';
    reasons: string[];
}

const roundLot = (n: number) => Math.max(0.01, Math.round(n * 100) / 100);
const fmt = (n: number) => `$${n.toFixed(2)}`;

export function analyzeAccount(
    balance: number,
    equity: number,
    positions: any[]
): AccountHealth {
    const floating = equity - balance;
    const floatingPct = balance > 0 ? (floating / balance) * 100 : 0;
    const openCount = positions?.length ?? 0;

    let label: AccountHealth['label'] = 'Stable';
    let color: AccountHealth['color'] = 'blue';
    let description = 'Account is stable. Safe to run.';

    if (floatingPct >= 5) {
        label = 'Strong';
        color = 'emerald';
        description = `Account is up ${floatingPct.toFixed(1)}% on open trades.`;
    } else if (floatingPct >= -2 && floatingPct <= 5) {
        label = 'Stable';
        color = 'blue';
        description = 'Balanced. Normal risk exposure.';
    } else if (floatingPct >= -10) {
        label = 'Stretched';
        color = 'amber';
        description = `Down ${Math.abs(floatingPct).toFixed(1)}% — consider reducing exposure.`;
    } else {
        label = 'At Risk';
        color = 'rose';
        description = `Down ${Math.abs(floatingPct).toFixed(1)}% — high risk. Reduce lot or add funds.`;
    }

    if (openCount > 15) {
        description += ` ${openCount} positions open — very high exposure.`;
    } else if (openCount > 8) {
        description += ` ${openCount} positions open.`;
    }

    return { label, color, floating, floatingPct, description };
}

export function suggestPipnexSettings(
    balance: number,
    risk: RiskLevel,
    openCount: number = 0
): PipnexSuggestion {
    const lotDivisor = risk === 'conservative' ? 10000 : risk === 'moderate' ? 5000 : 2500;
    let lot = roundLot(balance / lotDivisor);

    const lotCap = openCount > 8 ? 0.02 : 0.10;
    const cappedLot = Math.min(lot, lotCap);

    const pipStep = risk === 'conservative' ? 15 : risk === 'moderate' ? 12 : 8;

    const closeProfit = Math.max(1.0, Math.round(cappedLot * 100 * 100) / 100);

    const minProfitPercent = risk === 'conservative' ? 70 : risk === 'moderate' ? 60 : 50;

    const maxLevels = risk === 'conservative' ? 10 : risk === 'moderate' ? 15 : 20;

    const martingale = false;

    return {
        Lot: cappedLot,
        PipStep: pipStep,
        CloseProfit: closeProfit,
        MinProfitPercent: minProfitPercent,
        MaxLevels: maxLevels,
        Martingale: martingale,
        reasons: {
            Lot: `Balance ${fmt(balance)} ÷ ${lotDivisor} (${risk} risk) = ${cappedLot.toFixed(2)} lots`,
            PipStep: `${risk} mode uses a ${pipStep}-pip spacing between grid levels`,
            CloseProfit: `Target = ${cappedLot.toFixed(2)} lots × 100 pips ≈ ${fmt(closeProfit)}`,
            MinProfitPercent: `${risk} mode requires ${minProfitPercent}% of positions in profit before closing`,
            MaxLevels: `${risk} mode allows up to ${maxLevels} grid levels`,
            Martingale: 'Disabled by default — martingale compounds losses exponentially',
        },
    };
}

export function suggestNovaSettings(
    balance: number,
    risk: RiskLevel
): NovaSettingsResult {
    const lotDivisor = risk === 'conservative' ? 20000 : risk === 'moderate' ? 10000 : 5000;
    const lotSize = roundLot(balance / lotDivisor);

    const swingStrength = risk === 'conservative' ? 40 : risk === 'moderate' ? 30 : 20;

    const rewardRisk = risk === 'conservative' ? 2.0 : risk === 'moderate' ? 3.0 : 4.0;

    const maxPositions = risk === 'conservative' ? 2 : risk === 'moderate' ? 3 : 5;

    return {
        LotSize: lotSize,
        SwingStrength: swingStrength,
        RewardRisk: rewardRisk,
        MaxPositions: maxPositions,
        reasons: {
            LotSize: `Balance ${fmt(balance)} ÷ ${lotDivisor} (${risk} risk) = ${lotSize.toFixed(2)} lots`,
            SwingStrength: `${swingStrength} bars for swing detection — ${
                risk === 'conservative' ? 'smoother, fewer false signals' :
                risk === 'moderate' ? 'balanced responsiveness' :
                'faster reaction, more signals'
            }`,
            RewardRisk: `Targets ${rewardRisk.toFixed(1)}× the risk — ${
                risk === 'conservative' ? 'higher win rate required' :
                risk === 'moderate' ? 'standard R:R' :
                'higher reward per win'
            }`,
            MaxPositions: `${maxPositions} concurrent trades — ${
                risk === 'conservative' ? 'low exposure' :
                risk === 'moderate' ? 'balanced' :
                'higher exposure'
            }`,
        },
    };
}

export type NovaSettingsResult = NovaSuggestion;

export function scoreTradeHealth(
    pos: any,
    allPositions: any[],
    riskSession: any | null
): TradeHealth {
    const ticket = pos.ticket ?? 0;
    const symbol = pos.symbol ?? '—';
    const direction = pos.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL';
    const profit = pos.profit ?? 0;

    let score = 100;
    const reasons: string[] = [];

    const inferredMaxLoss = riskSession?.sl_amount && riskSession.sl_amount > 0
        ? riskSession.sl_amount
        : (pos.volume || 0.01) * 500;

    if (profit < 0) {
        const lossRatio = Math.abs(profit) / inferredMaxLoss;
        if (lossRatio >= 0.8) {
            score -= 45;
            reasons.push(`Near max loss (${(lossRatio * 100).toFixed(0)}% of guard)`);
        } else if (lossRatio >= 0.5) {
            score -= 25;
            reasons.push(`Moderate drawdown (${(lossRatio * 100).toFixed(0)}% of guard)`);
        } else if (lossRatio >= 0.2) {
            score -= 10;
            reasons.push('Small drawdown');
        }
    }

    const openTime = pos.time ?? pos.open_time ?? 0;
    if (openTime > 0) {
        const ageHours = (Date.now() / 1000 - openTime) / 3600;
        if (ageHours > 24) {
            score -= 20;
            reasons.push(`Open ${(ageHours / 24).toFixed(1)} days — stale`);
        } else if (ageHours > 4) {
            score -= 10;
            reasons.push(`Open ${ageHours.toFixed(1)}h`);
        }
    }

    const totalPositions = allPositions?.length ?? 1;
    if (totalPositions > 15) {
        score -= 20;
        reasons.push(`${totalPositions} levels open — very high exposure`);
    } else if (totalPositions > 10) {
        score -= 12;
        reasons.push(`${totalPositions} levels open`);
    } else if (totalPositions > 6) {
        score -= 5;
        reasons.push(`${totalPositions} levels open`);
    }

    const winners = (allPositions || []).filter((p: any) => (p.profit ?? 0) > 0).length;
    const winRatio = totalPositions > 0 ? winners / totalPositions : 0;

    if (winRatio >= 0.7) {
        score += 10;
        reasons.push(`${winners}/${totalPositions} in profit`);
    } else if (winRatio <= 0.2) {
        score -= 15;
        reasons.push(`Only ${winners}/${totalPositions} in profit`);
    }

    if (profit > 0 && profit >= inferredMaxLoss * 0.5) {
        score += 5;
        reasons.push(`Well in profit (${fmt(profit)})`);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let label: TradeHealth['label'];
    let color: TradeHealth['color'];
    if (score >= 80)      { label = 'Healthy';   color = 'emerald'; }
    else if (score >= 60) { label = 'Watch';     color = 'amber';   }
    else if (score >= 40) { label = 'Caution';   color = 'orange';  }
    else                  { label = 'High Risk'; color = 'rose';    }

    if (reasons.length === 0) reasons.push('No issues detected');

    return { ticket, symbol, direction, profit, score, label, color, reasons };
}

export function summarizeHealth(scores: TradeHealth[]): {
    total: number;
    healthy: number;
    watch: number;
    caution: number;
    highRisk: number;
    avgScore: number;
} {
    const total = scores.length;
    const healthy = scores.filter(s => s.label === 'Healthy').length;
    const watch = scores.filter(s => s.label === 'Watch').length;
    const caution = scores.filter(s => s.label === 'Caution').length;
    const highRisk = scores.filter(s => s.label === 'High Risk').length;
    const avgScore = total > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / total)
        : 0;
    return { total, healthy, watch, caution, highRisk, avgScore };
}
