// @ts-nocheck
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Menu, X, Home, FileText, TrendingUp, User, Clock, BarChart3,
  Zap, Settings, Users, BookOpen, Plus, Key, Crown, DollarSign,
  LogOut, Download, Shield
} from 'lucide-react';

interface DrawerNavProps {
  isAdmin: boolean;
  onLogout?: () => void;
}

export function DrawerNav({ isAdmin, onLogout }: DrawerNavProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Auto-close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Escape key closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const items = [
    { path: '/',             label: 'Home',      icon: Home,      isHome: true },
    { path: '/orders',       label: 'Orders',    icon: FileText },
    { path: '/request',      label: 'Trade',     icon: TrendingUp },
    { path: '/symbol-request', label: 'Symbols', icon: Plus },
    { path: '/account',      label: 'Account',   icon: User },
    { path: '/mt5-details',  label: 'MT5',       icon: Key },
    { path: '/history',      label: 'History',   icon: Clock },
    { path: '/chart',        label: 'Chart',     icon: BarChart3 },
    { path: '/strategies',   label: 'Algos',     icon: Settings },
    { path: '/ws',           label: 'WS',        icon: Zap },
    { path: '/guide',        label: 'Guide',     icon: BookOpen },
    { path: '/subscribe',    label: 'Subscribe', icon: Crown },
  ];

  if (isAdmin) {
    items.push(
      { path: '/admin',              label: 'Admin',    icon: Users },
      { path: '/admin/transactions', label: 'Payments', icon: DollarSign },
      { path: '/admin/users',        label: 'Users',    icon: Users },
    );
  }

  return (
    <>
      {/* ─── Hamburger button (fixed top-left) ─── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed top-4 left-4 z-[80] flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 hover:bg-slate-800 hover:border-emerald-500/40 text-white transition-all shadow-lg shadow-black/40"
      >
        <Menu size={18} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Menu</span>
      </button>

      {/* ─── Backdrop ─── */}
      <div
        className={`fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* ─── Drawer (slides in from left) ─── */}
      <aside
        className={`fixed top-0 left-0 z-[90] h-full w-[280px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-700/60 shadow-2xl transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-amber-400/60 via-emerald-400/60 to-transparent" />

        {/* Header */}
        <div className="p-4 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://i.postimg.cc/RFMfM938/Neon-Cloud-Forex-AI-Logo.png"
              alt="PipTrader"
              className="h-8 w-auto rounded-lg ring-1 ring-slate-700/50"
            />
            <div>
              <div className="text-sm font-extrabold text-white leading-none">PipTrader AI</div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">v2.0</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-0.5 p-2 overflow-y-auto h-[calc(100%-180px)] scrollbar-hide">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path + item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`p-1.5 rounded-md ${isActive ? 'bg-emerald-500/20' : 'bg-slate-800/60'}`}>
                      <Icon size={16} className={isActive ? 'text-emerald-300' : 'text-slate-400'} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/60" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700/40 bg-slate-950/80 backdrop-blur-sm">
          <button
            onClick={() => { const e = new CustomEvent('trigger-install'); window.dispatchEvent(e); setOpen(false); }}
            className="w-full mb-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
          >
            <Download size={13} />
            Install App
          </button>
          {onLogout && (
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition"
            >
              <LogOut size={13} />
              Logout
            </button>
          )}
          <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-slate-600 font-semibold uppercase tracking-widest">
            <Shield size={9} />
            Secured · Encrypted
          </div>
        </div>
      </aside>
    </>
  );
}
