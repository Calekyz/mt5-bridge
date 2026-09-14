import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">

            {/* ─── Ambient background glows ───────────────────── */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

            {/* ─── Grid overlay (subtle) ──────────────────────── */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                }}
            />

            {/* ─── Center content ─────────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Animated rings + logo */}
                <div className="relative w-32 h-32 flex items-center justify-center">

                    {/* Outer glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl" />

                    {/* Outer spinning ring — blue */}
                    <div className="absolute inset-0 rounded-full border-[3px] border-slate-800 border-t-blue-500 border-r-blue-400/50 animate-spin-slow" />

                    {/* Middle ring — purple, opposite direction */}
                    <div className="absolute inset-2 rounded-full border-[3px] border-slate-800 border-b-purple-500 border-l-purple-400/50 animate-spin-reverse" />

                    {/* Inner ring — emerald accent */}
                    <div className="absolute inset-5 rounded-full border-[2px] border-slate-800 border-t-emerald-500/80 animate-spin-slow" />

                    {/* Center logo */}
                    <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 shadow-lg shadow-blue-600/20">
                        <img
                            src="https://i.postimg.cc/4ygqTvHz/Chat-GPT-Image-Sep-7-2026-02-38-09-AM.png"
                            alt="PipTrader AI"
                            className="w-9 h-9 object-contain animate-pulse-soft"
                        />
                    </div>
                </div>

                {/* ─── Brand name with shimmer ─────────────────── */}
                <div className="mt-8 text-center">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer tracking-tight">
                        PipTrader AI
                    </h1>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                        Cloud Trading Platform
                    </p>
                </div>

                {/* ─── Loading dots ────────────────────────────── */}
                <div className="mt-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot shadow-lg shadow-blue-500/60" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce-dot shadow-lg shadow-purple-500/60" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot shadow-lg shadow-blue-500/60" style={{ animationDelay: '0.4s' }} />
                </div>

                {/* ─── Status text ─────────────────────────────── */}
                <p className="mt-6 text-xs text-slate-500 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Initializing secure session...
                </p>
            </div>

            {/* ─── Bottom brand footer ────────────────────────── */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-slate-700" />
                <span>Secured · Encrypted · Automated</span>
                <span className="w-8 h-px bg-gradient-to-l from-transparent to-slate-700" />
            </div>
        </div>
    );
};
