// @ts-nocheck
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconAccent?: 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber' | 'blue';
  actions?: React.ReactNode;
}

const ACCENTS = {
  cyan:    { bg: 'from-cyan-500/20 to-blue-600/10',    border: 'border-cyan-500/30',    text: 'text-cyan-300' },
  violet:  { bg: 'from-violet-500/20 to-purple-600/10', border: 'border-violet-500/30', text: 'text-violet-300' },
  emerald: { bg: 'from-emerald-500/20 to-teal-600/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
  rose:    { bg: 'from-rose-500/20 to-pink-600/10',    border: 'border-rose-500/30',    text: 'text-rose-300' },
  amber:   { bg: 'from-amber-500/20 to-orange-600/10', border: 'border-amber-500/30',   text: 'text-amber-300' },
  blue:    { bg: 'from-blue-500/20 to-indigo-600/10',  border: 'border-blue-500/30',    text: 'text-blue-300' },
};

export function PageHeader({
  title,
  subtitle,
  icon,
  iconAccent = 'cyan',
  actions,
}: PageHeaderProps) {
  const accent = ACCENTS[iconAccent];

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-5 border-b border-slate-800/60">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`relative p-2.5 rounded-xl bg-gradient-to-br ${accent.bg} border ${accent.border} shadow-lg shadow-black/30`}>
            <div className={`relative ${accent.text}`}>{icon}</div>
          </div>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-slate-500 text-[11px] mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
