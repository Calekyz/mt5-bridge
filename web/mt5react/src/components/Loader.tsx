import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#050a14] overflow-hidden">
      <style>{`
        @keyframes ldrRing {
          0% { stroke-dashoffset: 283; }
          50% { stroke-dashoffset: 70; }
          100% { stroke-dashoffset: 283; }
        }
        @keyframes ldrPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.06); }
        }
        @keyframes ldrShimmer {
          0% { background-position: -200% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes ldrBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes ldrFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ldrGrid {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }
      `}</style>

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          animation: 'ldrGrid 10s linear infinite',
        }}
      />

      {/* Ambient radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220,38,38,0.18) 0%, rgba(244,63,94,0.06) 40%, transparent 70%)',
            animation: 'ldrPulse 4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center" style={{ animation: 'ldrFadeUp 0.6s ease-out' }}>

        {/* Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1.5" />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="url(#ldrGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="283"
              style={{ animation: 'ldrRing 2.2s ease-in-out infinite' }}
            />
            <defs>
              <linearGradient id="ldrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative w-14 h-14 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 flex items-center justify-center shadow-2xl shadow-red-950/50">
            <img
              src="https://i.postimg.cc/4ygqTvHz/Chat-GPT-Image-Sep-7-2026-02-38-09-AM.png"
              alt="PipTrader AI"
              className="w-9 h-9 object-contain"
            />
          </div>
        </div>

        {/* Brand */}
        <div className="mt-8 text-center">
          <h1
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-500 via-white to-slate-500 bg-clip-text text-transparent"
            style={{ backgroundSize: '200% 100%', animation: 'ldrShimmer 3s linear infinite' }}
          >
            PipTrader AI
          </h1>
          <p className="mt-2 text-[10px] font-medium tracking-[0.35em] text-slate-600 uppercase">
            Cloud Trading Platform
          </p>
        </div>

        {/* Status */}
        <div className="mt-10 flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
          <span>Establishing secure session</span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-48 h-[2px] bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full w-24 bg-gradient-to-r from-transparent via-red-400 to-transparent"
            style={{ animation: 'ldrBar 1.8s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[9px] font-medium tracking-[0.4em] text-slate-700 uppercase">
          Secured · Encrypted · Automated
        </p>
      </div>
    </div>
  );
};
