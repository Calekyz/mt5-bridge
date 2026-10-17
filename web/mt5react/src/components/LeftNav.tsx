// @ts-nocheck
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, FileText, TrendingUp, User, Clock, BarChart3, Zap,
  Settings, Users, BookOpen, Plus, Key, Crown, DollarSign,
  ChevronDown
} from 'lucide-react';

const STORAGE_KEY = 'nav_expanded_groups';

function buildGroups(isAdmin: boolean) {
  const groups = [
    {
      id: 'trading',
      label: 'Trading',
      icon: TrendingUp,
      items: [
        { path: '/orders',         label: 'Orders',  icon: FileText },
        { path: '/request',        label: 'Trade',   icon: TrendingUp },
        { path: '/symbol-request', label: 'Symbols', icon: Plus },
        { path: '/history',        label: 'History', icon: Clock },
        { path: '/chart',          label: 'Chart',   icon: BarChart3 },
        { path: '/strategies',     label: 'Algos',   icon: Settings },
      ],
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      items: [
        { path: '/account',     label: 'Account',   icon: User },
        { path: '/mt5-details', label: 'MT5',       icon: Key },
        { path: '/subscribe',   label: 'Subscribe', icon: Crown },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: Zap,
      items: [
        { path: '/ws',    label: 'WS',    icon: Zap },
        { path: '/guide', label: 'Guide', icon: BookOpen },
      ],
    },
  ];
  if (isAdmin) {
    groups.push({
      id: 'admin',
      label: 'Admin',
      icon: Users,
      items: [
        { path: '/admin',              label: 'Admin',    icon: Users },
        { path: '/admin/transactions', label: 'Payments', icon: DollarSign },
        { path: '/admin/users',        label: 'Users',    icon: Users },
      ],
    });
  }
  return groups;
}

export function LeftNav({ isAdmin }: { isAdmin: boolean }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const toggleGroup = (id: string) => {
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const groups = buildGroups(isAdmin);
  const isGroupActive = (g: any) =>
    g.items.some((it: any) =>
      location.pathname === it.path || location.pathname.startsWith(it.path + '/')
    );

  return (
    <nav className="fixed left-0 top-16 bottom-0 z-40 w-16 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto scrollbar-hide">
      <div className="nav-panel-gradient absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/85 pointer-events-none" />
      <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-amber-400/60 via-emerald-400/60 to-red-400/60" />

      <div className="relative flex flex-col items-center gap-1 py-3">

        {/* ─── Home (always visible) ─── */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `nav-item nav-home-float group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 text-white shadow-2xl shadow-amber-600/60 ring-2 ring-slate-950 border border-amber-200/50 hover:scale-105 active:scale-95 ${isActive ? 'ring-amber-400/40' : ''}`
          }
        >
          {() => (
            <>
              <span className="nav-home-ring absolute inset-[-3px] rounded-[16px] border border-dashed border-amber-200/50 pointer-events-none" />
              <span className="nav-home-halo absolute inset-[-6px] rounded-[19px] bg-amber-400/30 blur-lg pointer-events-none" />
              <span className="nav-icon relative flex items-center justify-center">
                <Home size={18} strokeWidth={2.5} />
              </span>
              <span className="relative text-[7px] font-bold mt-0.5 tracking-wider uppercase text-white">Home</span>
            </>
          )}
        </NavLink>

        {/* ─── Groups ─── */}
        {groups.map(group => {
          const GroupIcon = group.icon;
          const open = !!expanded[group.id];
          const active = isGroupActive(group);

          return (
            <div key={group.id} className="flex flex-col items-center w-full">

              {/* Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`nav-item group relative flex flex-col items-center justify-center w-12 h-11 rounded-lg transition-all ${
                  open
                    ? 'bg-slate-800/60 text-emerald-300 border border-slate-700/60'
                    : active
                      ? 'bg-slate-800/40 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
                title={`${open ? 'Collapse' : 'Expand'} ${group.label}`}
              >
                <span className="nav-icon relative flex items-center justify-center">
                  <GroupIcon size={16} strokeWidth={2} />
                  {active && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/60" />
                  )}
                </span>
                <span className="relative text-[7px] font-bold mt-0.5 tracking-wider uppercase">
                  {group.label}
                </span>
                <ChevronDown
                  size={8}
                  className={`absolute top-0.5 right-0.5 transition-transform duration-200 ${open ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`}
                />
              </button>

              {/* Items (only when expanded) */}
              {open && (
                <div className="flex flex-col items-center gap-0.5 w-full mt-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `nav-item group relative flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all ${
                            isActive
                              ? 'nav-item-active-green bg-gradient-to-br from-emerald-500/25 via-teal-500/20 to-green-500/25 text-white border border-emerald-400/50'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="nav-indicator absolute -right-0.5 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-gradient-to-b from-emerald-300 to-emerald-300 shadow-lg shadow-emerald-500/70" />
                            )}
                            <span className="nav-icon relative flex items-center justify-center">
                              {isActive && (
                                <span className="absolute inset-[-4px] rounded-full bg-emerald-500/30 blur-md pointer-events-none" />
                              )}
                              <Icon size={13} strokeWidth={isActive ? 2.5 : 2} className="relative" />
                            </span>
                            <span className={`relative text-[7px] font-bold mt-0.5 tracking-wider ${isActive ? 'text-emerald-200' : 'text-slate-500 group-hover:text-slate-300'}`}>
                              {item.label}
                            </span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
