// @ts-nocheck
import { useLocation, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export function HomeFab() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on dashboard home
  if (location.pathname === '/') return null;

  return (
    <button
      onClick={() => navigate('/')}
      aria-label="Back to Dashboard"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[75] group flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-600 text-white font-extrabold shadow-2xl shadow-amber-600/60 hover:scale-105 active:scale-95 transition-all ring-2 ring-slate-950 border border-amber-200/50"
    >
      <span className="relative p-1.5 rounded-full bg-white/25 flex items-center justify-center">
        <Home size={14} strokeWidth={2.8} />
      </span>
      <span className="text-[11px] uppercase tracking-wider">Home</span>
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}
