import React, { useState } from 'react';
import {
    BookOpen, Rocket, Key, LayoutDashboard, Play, Square,
    Shield, TrendingDown, BarChart3, HelpCircle,
    Wrench, Star, MessageCircle, ChevronRight, Search, X,
    AlertTriangle, CheckCircle2, XCircle, DollarSign, Server,
    Info, ListOrdered, LineChart, Zap,
    Activity, Target, Waves, Layers, Globe, Settings, Clock
} from 'lucide-react';

interface GuideSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

const Guide: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('welcome');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const sections: GuideSection[] = [
        // ─── 1. WELCOME ───────────────────────────────────────
        {
            id: 'welcome',
            title: 'Welcome',
            icon: <Rocket size={16} />,
            content: (
                <div className="space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <Rocket className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">
                                Welcome to PipTrader AI
                            </h2>
                            <p className="text-slate-500 text-xs">Cloud-based automated trading platform</p>
                        </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed">
                        PipTrader AI is a <strong className="text-white">cloud-based automated trading platform</strong>. It runs
                        trading algorithms on your MetaTrader 5 account, 24 hours a day, without you needing
                        to keep your computer on.
                    </p>

                    <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border border-blue-500/30 rounded-2xl p-5">
                        <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Info size={16} /> How it works
                        </h3>
                        <ul className="space-y-2.5 text-slate-300 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                <span>Your MT5 account is connected to a <strong className="text-white">dedicated cloud server (VPS)</strong> that we manage.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                <span>Four algorithms — <strong className="text-white">PipNex</strong>, <strong className="text-white">NOVA EDGE AI</strong>, <strong className="text-white">SMC Swing Trader</strong>, and <strong className="text-white">Punex Asian Session</strong> — run 24/7.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                <span>You control everything from this dashboard — start, stop, adjust, monitor.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-rose-900/20 to-slate-900/40 border border-rose-500/30 rounded-2xl p-5">
                            <h4 className="text-sm font-bold text-rose-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <XCircle size={16} /> You DON'T need to
                            </h4>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-rose-400 flex-shrink-0" /> Leave your computer on</li>
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-rose-400 flex-shrink-0" /> Install MetaTrader 5 on your PC</li>
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-rose-400 flex-shrink-0" /> Watch charts all day</li>
                            </ul>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900/40 border border-emerald-500/30 rounded-2xl p-5">
                            <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <CheckCircle2 size={16} /> You DO need
                            </h4>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> A MetaTrader 5 account</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> This dashboard</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> Your login credentials</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ),
        },

        // ─── 2. GETTING STARTED ───────────────────────────────
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: <Key size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <Key className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Getting Started</h2>
                            <p className="text-slate-500 text-xs">Your first login walkthrough</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">What You Need Before Starting</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700/50">
                                        <th className="text-left py-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Item</th>
                                        <th className="text-left py-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Who Provides It</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300">
                                    <tr className="border-b border-slate-700/30">
                                        <td className="py-2.5">Email address</td>
                                        <td className="py-2.5"><span className="text-emerald-400 font-semibold">You</span></td>
                                    </tr>
                                    <tr className="border-b border-slate-700/30">
                                        <td className="py-2.5">Password</td>
                                        <td className="py-2.5"><span className="text-blue-400 font-semibold">Admin sets it</span></td>
                                    </tr>
                                    <tr className="border-b border-slate-700/30">
                                        <td className="py-2.5">Access Key</td>
                                        <td className="py-2.5"><span className="text-blue-400 font-semibold">Admin generates it</span></td>
                                    </tr>
                                    <tr className="border-b border-slate-700/30">
                                        <td className="py-2.5">VPS Assignment</td>
                                        <td className="py-2.5"><span className="text-blue-400 font-semibold">Admin sets it up</span></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5">MT5 Account</td>
                                        <td className="py-2.5"><span className="text-emerald-400 font-semibold">You / Admin</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <ListOrdered size={16} className="text-blue-400" /> First Login Steps
                        </h3>
                        <ol className="space-y-4 text-slate-300">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">1</span>
                                <div>
                                    <p className="font-semibold text-white">Open the login URL</p>
                                    <p className="text-sm text-slate-400">Any modern browser — Chrome, Firefox, Edge, Safari.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">2</span>
                                <div>
                                    <p className="font-semibold text-white">Enter your email and password</p>
                                    <p className="text-sm text-slate-400">Click <strong className="text-white">Connect</strong>.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">3</span>
                                <div>
                                    <p className="font-semibold text-white">Check the dashboard</p>
                                    <p className="text-sm text-slate-400">
                                        You should see: VPS Address (like <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded font-mono text-blue-300">http://xxx.xxx.xxx.xxx:8890</code>),
                                        <span className="text-emerald-400 font-semibold"> EA Connected</span>,
                                        and your Balance.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">4</span>
                                <div>
                                    <p className="font-semibold text-white">You're ready!</p>
                                    <p className="text-sm text-slate-400">Now you can start trading.</p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-gradient-to-br from-amber-900/20 to-slate-900/40 border border-amber-500/30 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2 uppercase tracking-wider">
                            <AlertTriangle size={16} /> If you see "EA Not Configured"
                        </h4>
                        <p className="text-sm text-slate-300">
                            Click <strong className="text-white">Refresh VPS Info</strong>. If it persists, contact your administrator — your VPS hasn't been assigned yet.
                        </p>
                    </div>
                </div>
            ),
        },

        // ─── 3. DASHBOARD OVERVIEW ────────────────────────────
        {
            id: 'dashboard',
            title: 'Dashboard Overview',
            icon: <LayoutDashboard size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <LayoutDashboard className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Understanding the Dashboard</h2>
                            <p className="text-slate-500 text-xs">Every panel explained</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                title: 'Top Bar',
                                icon: <Server size={16} />,
                                color: 'blue',
                                items: [
                                    'Access Key — your personal identifier (do not share)',
                                    'VPS Address — the cloud server running your bot',
                                    'EA Connected — shows if your bot is online',
                                    'Live (1s refresh) — data updates every second',
                                ],
                            },
                            {
                                title: 'Account Stats',
                                icon: <DollarSign size={16} />,
                                color: 'emerald',
                                items: [
                                    'Balance — money from closed trades',
                                    'Equity — current total value (balance + floating P/L)',
                                    "Profit — how much you've made or lost so far",
                                ],
                            },
                            {
                                title: 'Risk Guard',
                                icon: <Shield size={16} />,
                                color: 'orange',
                                items: [
                                    'Stop Loss — maximum drawdown before algo auto-stops',
                                    'Take Profit — profit target before algo auto-stops',
                                    'Active status — shows if the Risk Guard is monitoring',
                                ],
                            },
                            {
                                title: 'Strategy Cards',
                                icon: <Zap size={16} />,
                                color: 'purple',
                                items: [
                                    'Start/Stop button — enables or disables the algo',
                                    'Parameters — settings like lot size, pip step, etc.',
                                    'Status — "Algorithm running" when active',
                                ],
                            },
                        ].map((section) => {
                            const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                                blue:    { bg: 'from-blue-900/20 to-slate-900/40',    border: 'border-blue-500/30',    text: 'text-blue-300',    badge: 'from-blue-600 to-indigo-700 shadow-blue-600/20' },
                                emerald: { bg: 'from-emerald-900/20 to-slate-900/40', border: 'border-emerald-500/30', text: 'text-emerald-300', badge: 'from-emerald-600 to-teal-700 shadow-emerald-600/20' },
                                orange:  { bg: 'from-orange-900/20 to-slate-900/40',  border: 'border-orange-500/30',  text: 'text-orange-300',  badge: 'from-orange-500 to-red-600 shadow-orange-600/20' },
                                purple:  { bg: 'from-purple-900/20 to-slate-900/40',  border: 'border-purple-500/30',  text: 'text-purple-300',  badge: 'from-purple-600 to-pink-700 shadow-purple-600/20' },
                            };
                            const c = colorMap[section.color];
                            return (
                                <div key={section.title} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 bg-gradient-to-br ${c.badge} rounded-lg shadow-lg`}>
                                            <span className="text-white">{section.icon}</span>
                                        </div>
                                        <h3 className={`text-sm font-bold uppercase tracking-wider ${c.text}`}>
                                            {section.title}
                                        </h3>
                                    </div>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <ChevronRight size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ),
        },

        // ─── 4. THE ALGORITHMS (NEW) ─────────────────────────
        {
            id: 'algorithms',
            title: 'The Algorithms',
            icon: <Activity size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <Activity className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">The Algorithms</h2>
                            <p className="text-slate-500 text-xs">What each algo does & how to configure it</p>
                        </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed">
                        PipTrader AI ships with <strong className="text-white">4 trading algorithms</strong>. Each one targets
                        a different market condition and trade style. You can run them individually or combine them, but
                        for <strong className="text-white">small accounts we recommend running just one at a time</strong>.
                    </p>

                    {/* ─── Quick comparison table ─── */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50 overflow-x-auto">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <ListOrdered size={16} className="text-blue-400" /> Quick comparison
                        </h3>
                        <table className="w-full text-sm min-w-[640px]">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="text-left py-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Algo</th>
                                    <th className="text-left py-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Type</th>
                                    <th className="text-left py-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Frequency</th>
                                    <th className="text-left py-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Best Market</th>
                                    <th className="text-left py-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Risk</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                <tr className="border-b border-slate-700/30">
                                    <td className="py-2.5 font-semibold text-white">PipNex</td>
                                    <td className="py-2.5">Grid scalper</td>
                                    <td className="py-2.5"><span className="text-amber-400">High</span> (10–50/day)</td>
                                    <td className="py-2.5">Ranging</td>
                                    <td className="py-2.5"><span className="text-rose-400 font-semibold">High</span></td>
                                </tr>
                                <tr className="border-b border-slate-700/30">
                                    <td className="py-2.5 font-semibold text-white">NOVA Edge AI</td>
                                    <td className="py-2.5">Fibonacci swing</td>
                                    <td className="py-2.5"><span className="text-blue-400">Medium</span> (1–5/day)</td>
                                    <td className="py-2.5">Trending</td>
                                    <td className="py-2.5"><span className="text-amber-400 font-semibold">Medium</span></td>
                                </tr>
                                <tr className="border-b border-slate-700/30">
                                    <td className="py-2.5 font-semibold text-white">SMC Swing Trader</td>
                                    <td className="py-2.5">Structure swing</td>
                                    <td className="py-2.5"><span className="text-blue-400">Low</span> (1–3/day)</td>
                                    <td className="py-2.5">Trending + POI</td>
                                    <td className="py-2.5"><span className="text-amber-400 font-semibold">Medium</span></td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 font-semibold text-white">Punex Asian Session</td>
                                    <td className="py-2.5">Session breakout</td>
                                    <td className="py-2.5"><span className="text-emerald-400">Very low</span> (1/day)</td>
                                    <td className="py-2.5">Volatile (news)</td>
                                    <td className="py-2.5"><span className="text-emerald-400 font-semibold">Low</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/*  ALGO 1 — PipNex                            */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="bg-gradient-to-br from-amber-900/20 via-slate-900/50 to-slate-900/60 border border-amber-500/30 rounded-2xl p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-600/30">
                                <Target className="text-white" size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-extrabold text-white">PipNex Algo</h3>
                                <p className="text-amber-300 text-xs">Scalper grid with martingale · High frequency</p>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                <AlertTriangle size={11} /> High Risk
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Info size={12} /> What it does
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    PipNex opens a **grid of trades** in one direction and adds more positions every time price
                                    moves against it by a set pip distance. When the combined profit reaches your target, all
                                    positions close together. It works best in **ranging markets** where price bounces up
                                    and down inside a zone.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Zap size={12} /> How it trades
                                </h4>
                                <ul className="space-y-1.5 text-sm text-slate-300">
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-amber-400 mt-1 flex-shrink-0" /><span>Opens first position in the selected direction</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-amber-400 mt-1 flex-shrink-0" /><span>Adds more positions every <strong className="text-white">Pip Step</strong> move against it</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-amber-400 mt-1 flex-shrink-0" /><span>Closes all when combined profit hits <strong className="text-white">Close Profit</strong></span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-amber-400 mt-1 flex-shrink-0" /><span>Optional martingale doubles lot size after N levels to recover faster</span></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Settings size={12} /> Settings explained
                                </h4>
                                <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl divide-y divide-slate-700/40">
                                    {[
                                        { key: 'Lot', desc: 'Size of the first trade. Higher = higher risk & reward.' },
                                        { key: 'Pip Step', desc: 'Distance price must move before adding a new level. Smaller = more trades.' },
                                        { key: 'Close Profit ($)', desc: 'Total profit target before closing all trades together.' },
                                        { key: 'Min Profit %', desc: 'Minimum % of trades that must be in profit before closing (safety).' },
                                        { key: 'Max Levels', desc: 'Maximum number of grid levels to open. 20 is default — higher is riskier.' },
                                        { key: 'Martingale', desc: 'Doubles lot size after N levels to recover losses faster. Risky!' },
                                        { key: 'Martingale Activation', desc: 'Which level martingale kicks in from (e.g. 7 = level 7+ uses doubled lots).' },
                                        { key: 'Martingale Batch', desc: 'How many levels before the multiplier applies again (7 = every 7 levels).' },
                                    ].map((s, i) => (
                                        <div key={i} className="px-3 py-2.5 flex flex-col sm:flex-row gap-1 sm:gap-3">
                                            <span className="text-[11px] font-mono font-bold text-amber-300 sm:w-44 flex-shrink-0">{s.key}</span>
                                            <span className="text-[11px] text-slate-400">{s.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-slate-300">
                                        <strong className="text-white">Recommended for:</strong> Accounts $500+, traders comfortable with
                                        drawdown. Use <strong className="text-white">low lot sizes</strong> (0.01) and set Risk Guard
                                        Stop Loss. <strong className="text-rose-300">Always keep martingale OFF</strong> unless you
                                        fully understand compounding risk.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/*  ALGO 2 — NOVA                              */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="bg-gradient-to-br from-blue-900/20 via-slate-900/50 to-slate-900/60 border border-blue-500/30 rounded-2xl p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/30">
                                <Waves className="text-white" size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-extrabold text-white">NOVA Edge AI</h3>
                                <p className="text-blue-300 text-xs">Fibonacci swing · RSI + ATR · Medium frequency</p>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                Medium Risk
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Info size={12} /> What it does
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    NOVA looks at the **most recent swing high and low** on your chart, draws Fibonacci retracement
                                    levels between them, and enters when price pulls back to key levels (38.2%, 61.8%, 78.6%).
                                    It uses **RSI** as a filter and **ATR-based stops** for adaptive risk. Best on **trending
                                    markets** where price pulls back then continues.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Zap size={12} /> How it trades
                                </h4>
                                <ul className="space-y-1.5 text-sm text-slate-300">
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-blue-400 mt-1 flex-shrink-0" /><span>Detects trend using higher-timeframe EMA</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-blue-400 mt-1 flex-shrink-0" /><span>Waits for price to pull back into a Fibonacci level</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-blue-400 mt-1 flex-shrink-0" /><span>Confirms with RSI (not overbought for buys, not oversold for sells)</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-blue-400 mt-1 flex-shrink-0" /><span>Sets SL based on ATR, TP based on your Reward/Risk</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-blue-400 mt-1 flex-shrink-0" /><span>Moves to break-even at 1R, trails after 500 points profit</span></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Settings size={12} /> Settings explained
                                </h4>
                                <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl divide-y divide-slate-700/40">
                                    {[
                                        { key: 'Lot Size', desc: 'Fixed lot size for each trade.' },
                                        { key: 'Swing Strength', desc: 'How many bars to look back for the swing. Higher = smoother, fewer signals.' },
                                        { key: 'Reward/Risk', desc: 'Target multiple of risk. 3.0 = aims for 3x profit vs. the loss if SL is hit.' },
                                        { key: 'Max Positions', desc: 'Maximum concurrent trades allowed. Fewer = lower exposure.' },
                                    ].map((s, i) => (
                                        <div key={i} className="px-3 py-2.5 flex flex-col sm:flex-row gap-1 sm:gap-3">
                                            <span className="text-[11px] font-mono font-bold text-blue-300 sm:w-44 flex-shrink-0">{s.key}</span>
                                            <span className="text-[11px] text-slate-400">{s.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/60 border border-blue-500/30 rounded-xl p-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-slate-300">
                                        <strong className="text-white">Recommended for:</strong> Beginners and swing traders.
                                        Works well on <strong className="text-white">EURUSD, GBPUSD, XAUUSD</strong>. Set Reward/Risk
                                        to 3.0 for a good balance. Best on H1–H4 charts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/*  ALGO 3 — SMC                               */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="bg-gradient-to-br from-purple-900/20 via-slate-900/50 to-slate-900/60 border border-purple-500/30 rounded-2xl p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl shadow-lg shadow-purple-600/30">
                                <Layers className="text-white" size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-extrabold text-white">SMC Swing Trader</h3>
                                <p className="text-purple-300 text-xs">HTF structure + Order Blocks + CHoCH · Low frequency</p>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                Medium Risk
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Info size={12} /> What it does
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    SMC (Smart Money Concepts) is a **structure-based strategy**. It identifies the higher-timeframe
                                    trend, marks unmitigated Order Blocks and Fair Value Gaps (POIs), and waits for price to
                                    return to those zones. When price returns, it looks for a **Change of Character (CHoCH)** on
                                    a lower timeframe to confirm the reversal before entering. Very selective — fires only on
                                    A+ setups.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Zap size={12} /> How it trades
                                </h4>
                                <ul className="space-y-1.5 text-sm text-slate-300">
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-purple-400 mt-1 flex-shrink-0" /><span>Reads HTF trend (HH+HL = bullish, LH+LL = bearish)</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-purple-400 mt-1 flex-shrink-0" /><span>Marks valid Order Blocks and Fair Value Gaps</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-purple-400 mt-1 flex-shrink-0" /><span>Waits for price to return to the POI</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-purple-400 mt-1 flex-shrink-0" /><span>Confirms with LTF CHoCH inside the POI</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-purple-400 mt-1 flex-shrink-0" /><span>Places market or limit order with HTF liquidity target</span></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Settings size={12} /> Settings explained
                                </h4>
                                <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl divide-y divide-slate-700/40">
                                    {[
                                        { key: 'Lot Size', desc: 'Fixed lot size for each trade.' },
                                        { key: 'Swing Strength', desc: 'Bars for fractal detection. Lower = faster CHoCH, more entries.' },
                                        { key: 'Reward/Risk', desc: 'Target multiple. SMC aims for HTF liquidity, so 3.0+ is common.' },
                                        { key: 'Max Positions', desc: 'Concurrent positions allowed. SMC stacks few trades per symbol.' },
                                    ].map((s, i) => (
                                        <div key={i} className="px-3 py-2.5 flex flex-col sm:flex-row gap-1 sm:gap-3">
                                            <span className="text-[11px] font-mono font-bold text-purple-300 sm:w-44 flex-shrink-0">{s.key}</span>
                                            <span className="text-[11px] text-slate-400">{s.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/60 border border-purple-500/30 rounded-xl p-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-slate-300">
                                        <strong className="text-white">Recommended for:</strong> Traders who can wait for quality
                                        setups. Fires <strong className="text-white">1–3 times per day</strong>. Requires patience —
                                        no trades on choppy days is normal. Best on trending pairs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/*  ALGO 4 — Punex                             */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="bg-gradient-to-br from-emerald-900/20 via-slate-900/50 to-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl shadow-lg shadow-emerald-600/30">
                                <Globe className="text-white" size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-extrabold text-white">Punex Asian Session</h3>
                                <p className="text-emerald-300 text-xs">Asian range sweep + Order Block · 1 trade/day</p>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                Low Risk
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Info size={12} /> What it does
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Punex runs <strong className="text-white">once per day</strong>. It measures the overnight
                                    (Asian session) price range, then waits for London/New York to <strong className="text-white">sweep</strong>
                                    above the high or below the low. When that happens, it looks for an Order Block and enters
                                    at a 50% retracement of the block, with the target being the opposite side of the range.
                                    Classic "liquidity grab + reversal" setup.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Clock size={12} /> When it trades
                                </h4>
                                <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl divide-y divide-slate-700/40">
                                    {[
                                        { key: 'Asian session', val: '00:00 – 06:00 (server time) — range build' },
                                        { key: 'London open', val: '06:00 onwards — sweep detection begins' },
                                        { key: 'Trade window', val: 'One setup per day. If no sweep, no trade.' },
                                        { key: 'Session ends', val: 'Auto-resets at midnight server time' },
                                    ].map((s, i) => (
                                        <div key={i} className="px-3 py-2.5 flex flex-col sm:flex-row gap-1 sm:gap-3">
                                            <span className="text-[11px] font-mono font-bold text-emerald-300 sm:w-44 flex-shrink-0">{s.key}</span>
                                            <span className="text-[11px] text-slate-400">{s.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Zap size={12} /> How it trades
                                </h4>
                                <ul className="space-y-1.5 text-sm text-slate-300">
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-emerald-400 mt-1 flex-shrink-0" /><span>Locks the Asian session high / low</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-emerald-400 mt-1 flex-shrink-0" /><span>Waits for price to sweep either side and close back inside</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-emerald-400 mt-1 flex-shrink-0" /><span>Finds the Order Block that caused the reversal</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-emerald-400 mt-1 flex-shrink-0" /><span>Enters at 50% depth of the OB</span></li>
                                    <li className="flex items-start gap-2"><ChevronRight size={13} className="text-emerald-400 mt-1 flex-shrink-0" /><span>Splits the position into 2–4 legs with separate TPs (50% at TP1, rest at TP2)</span></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Settings size={12} /> Settings explained
                                </h4>
                                <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl divide-y divide-slate-700/40">
                                    {[
                                        { key: 'Use Fixed Lot', desc: 'ON = fixed lot size (predictable). OFF = risk % of balance.' },
                                        { key: 'Lot', desc: 'Fixed lot when Use Fixed Lot is ON.' },
                                        { key: 'Risk %', desc: 'Balance % risked per setup when Use Fixed Lot is OFF.' },
                                        { key: 'Reward/Risk', desc: 'Target multiple. 2.0 is the strategy default.' },
                                        { key: 'Positions to Split', desc: 'How many legs to divide the position into. 4 = 2 at TP1, 2 at TP2.' },
                                    ].map((s, i) => (
                                        <div key={i} className="px-3 py-2.5 flex flex-col sm:flex-row gap-1 sm:gap-3">
                                            <span className="text-[11px] font-mono font-bold text-emerald-300 sm:w-44 flex-shrink-0">{s.key}</span>
                                            <span className="text-[11px] text-slate-400">{s.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-slate-300">
                                        <strong className="text-white">Recommended for:</strong> Traders who want a
                                        <strong className="text-white"> low-stress, low-frequency strategy</strong>. One trade per day
                                        = perfect for beginners and busy people. Works best on volatile pairs (XAUUSD, GBPJPY).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Running Multiple Algos ─── */}
                    <div className="bg-gradient-to-br from-amber-900/20 to-slate-900/40 border border-amber-500/30 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <AlertTriangle size={16} /> Running multiple algos at once
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-400 mt-1">•</span>
                                <span>All algos share the <strong className="text-white">same account balance and buying power</strong>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-400 mt-1">•</span>
                                <span>Running 2+ algos multiplies your <strong className="text-white">exposure and drawdown risk</strong>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-400 mt-1">•</span>
                                <span><strong className="text-white">For accounts under $1,000</strong>, run only one algo at a time.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-400 mt-1">•</span>
                                <span>Recommended combos: <strong className="text-white">NOVA + Punex</strong> (diversified) or <strong className="text-white">SMC + Punex</strong> (structure + session).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-400 mt-1">•</span>
                                <span>Risk Guard monitors <strong className="text-white">all running algos together</strong> — one SL/TP trigger stops everything.</span>
                            </li>
                        </ul>
                    </div>

                    {/* ─── Choosing Your Algo ─── */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border border-blue-500/30 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Info size={16} /> Which algo should I start with?
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-300">
                            <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 mb-1">
                                    Beginners
                                </div>
                                <div className="text-white font-bold">Start with Punex</div>
                                <p className="text-[11px] text-slate-400 mt-1">1 trade/day, low risk, easy to monitor.</p>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-blue-400 mb-1">
                                    Swing traders
                                </div>
                                <div className="text-white font-bold">NOVA or SMC</div>
                                <p className="text-[11px] text-slate-400 mt-1">1–5 trades/day, structure-based, technical.</p>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400 mb-1">
                                    Active traders
                                </div>
                                <div className="text-white font-bold">PipNex</div>
                                <p className="text-[11px] text-slate-400 mt-1">10–50 trades/day, needs watching, higher risk.</p>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-purple-400 mb-1">
                                    Experienced + funded
                                </div>
                                <div className="text-white font-bold">2 algos at once</div>
                                <p className="text-[11px] text-slate-400 mt-1">NOVA + Punex, or SMC + Punex for diversification.</p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },

        // ─── 5. START / STOP ──────────────────────────────────
        {
            id: 'start-stop',
            title: 'Starting & Stopping',
            icon: <Play size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl shadow-lg shadow-emerald-600/20">
                            <Play className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Starting and Stopping the Algorithms</h2>
                            <p className="text-slate-500 text-xs">Take control of your EA</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900/40 border border-emerald-500/30 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-emerald-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <Play size={16} /> To START
                            </h3>
                            <ol className="space-y-2.5 text-sm text-slate-300">
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] flex items-center justify-center font-bold mt-0.5">1</span><span>Go to the <strong className="text-white">Dashboard</strong></span></li>
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] flex items-center justify-center font-bold mt-0.5">2</span><span>Scroll to the algorithm card</span></li>
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] flex items-center justify-center font-bold mt-0.5">3</span><span>Review the parameters</span></li>
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] flex items-center justify-center font-bold mt-0.5">4</span><span>Click green <strong className="text-white">▶ Start Algo</strong></span></li>
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] flex items-center justify-center font-bold mt-0.5">5</span><span>Card turns <span className="text-emerald-400 font-semibold">green</span></span></li>
                            </ol>
                        </div>
                        <div className="bg-gradient-to-br from-rose-900/20 to-slate-900/40 border border-rose-500/30 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-rose-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <Square size={16} /> To STOP
                            </h3>
                            <ol className="space-y-2.5 text-sm text-slate-300">
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] flex items-center justify-center font-bold mt-0.5">1</span><span>Find the running algo card</span></li>
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] flex items-center justify-center font-bold mt-0.5">2</span><span>Click red <strong className="text-white">⏹ Stop Algo</strong></span></li>
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] flex items-center justify-center font-bold mt-0.5">3</span><span>Card returns to grey</span></li>
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] flex items-center justify-center font-bold mt-0.5">4</span><span>Open positions are <strong className="text-white">NOT</strong> auto-closed</span></li>
                                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] flex items-center justify-center font-bold mt-0.5">5</span><span>Close them manually if needed</span></li>
                            </ol>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border border-blue-500/30 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Info size={16} /> Important
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>Stopping one algo does not affect the others</span></li>
                            <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>Stopping <strong className="text-white">all</strong> algos also ends the Risk Guard session</span></li>
                            <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>You must click <strong className="text-white">Start Algo</strong> again after an EA restart</span></li>
                        </ul>
                    </div>
                </div>
            ),
        },

        // ─── 6. RISK GUARD ────────────────────────────────────
        {
            id: 'risk-guard',
            title: 'Risk Guard (SL/TP)',
            icon: <Shield size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-600/20">
                            <Shield className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Using Risk Guard</h2>
                            <p className="text-slate-500 text-xs">Your automatic safety net</p>
                        </div>
                    </div>

                    <p className="text-slate-300">
                        Risk Guard is your <strong className="text-white">safety net</strong>. It monitors your account and auto-stops
                        your algo when you hit your limits.
                    </p>

                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <ListOrdered size={16} className="text-blue-400" /> How to set it up
                        </h3>
                        <ol className="space-y-3 text-sm text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] flex items-center justify-center font-bold mt-0.5">1</span>
                                <span>Find the <strong className="text-white">Risk Guard</strong> card on the Dashboard</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] flex items-center justify-center font-bold mt-0.5">2</span>
                                <span>Enter your <strong className="text-rose-400">Stop Loss ($)</strong> — e.g., <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded font-mono text-rose-300">100</code> means "stop if I lose $100"</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] flex items-center justify-center font-bold mt-0.5">3</span>
                                <span>Enter your <strong className="text-emerald-400">Take Profit ($)</strong> — e.g., <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-300">200</code> means "stop if I make $200"</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] flex items-center justify-center font-bold mt-0.5">4</span>
                                <span>Both fields are optional</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] flex items-center justify-center font-bold mt-0.5">5</span>
                                <span>Click <strong className="text-white">Start Algo</strong> — Risk Guard activates automatically</span>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-gradient-to-br from-orange-900/20 to-slate-900/40 border border-orange-500/30 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-orange-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <TrendingDown size={16} /> When SL/TP hits
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2"><span className="text-orange-400 mt-1">•</span><span>All algorithms stop immediately</span></li>
                            <li className="flex items-start gap-2"><span className="text-orange-400 mt-1">•</span><span><strong className="text-white">All open positions are closed automatically</strong></span></li>
                            <li className="flex items-start gap-2"><span className="text-orange-400 mt-1">•</span><span>You see a banner + notification</span></li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1">•</span>
                                <span>
                                    <span className="text-rose-400 font-semibold">⚠ STOP LOSS HIT</span> or <span className="text-emerald-400 font-semibold">🎯 TARGET PROFIT HIT</span>
                                </span>
                            </li>
                            <li className="flex items-start gap-2"><span className="text-orange-400 mt-1">•</span><span>Banner auto-hides after 30 seconds</span></li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-amber-900/20 to-slate-900/40 border border-amber-500/30 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <AlertTriangle size={16} /> Important
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2"><span className="text-amber-400 mt-1">•</span><span>SL/TP values are <strong className="text-white">locked</strong> once the algo starts</span></li>
                            <li className="flex items-start gap-2"><span className="text-amber-400 mt-1">•</span><span>To change them, stop all algos first</span></li>
                            <li className="flex items-start gap-2"><span className="text-amber-400 mt-1">•</span><span>Your values are saved — no need to re-enter</span></li>
                            <li className="flex items-start gap-2"><span className="text-amber-400 mt-1">•</span><span>New algo start = new Risk Guard session</span></li>
                        </ul>
                    </div>
                </div>
            ),
        },

        // ─── 7. VIEWING TRADES ────────────────────────────────
        {
            id: 'trades',
            title: 'Viewing Trades',
            icon: <BarChart3 size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <BarChart3 className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Viewing Your Trades</h2>
                            <p className="text-slate-500 text-xs">Open positions & history</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <ListOrdered size={16} className="text-emerald-400" /> Current Open Positions
                        </h3>
                        <p className="text-sm text-slate-400 mb-3">Go to <strong className="text-white">Orders</strong> in the top menu. You'll see:</p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span><strong className="text-white">Ticket</strong> — unique trade ID</span></li>
                            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span><strong className="text-white">Symbol</strong> — e.g., XAUUSD</span></li>
                            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span><strong className="text-white">Type</strong> — BUY or SELL</span></li>
                            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span><strong className="text-white">Volume</strong> — lot size</span></li>
                            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span><strong className="text-white">Open Price</strong> — when it opened</span></li>
                            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span><strong className="text-white">Current Price</strong> — live</span></li>
                            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span><strong className="text-white">Profit</strong> — unrealized P/L</span></li>
                            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span><strong className="text-white">Action</strong> — click <strong className="text-white">Close</strong> to close manually</span></li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <LineChart size={16} className="text-blue-400" /> Trade History
                        </h3>
                        <p className="text-sm text-slate-400 mb-3">Go to <strong className="text-white">History</strong>:</p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>Set a date range (default: <strong className="text-white">48 hours</strong>)</span></li>
                            <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>Use quick preset buttons: <strong className="text-white">24h · 48h · 7d · 30d · 90d</strong></span></li>
                            <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>Click <strong className="text-white">Apply Filter</strong></span></li>
                            <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>See summary: Total Trades, Win Rate, Total Profit, Avg. Trade</span></li>
                            <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>Every closed trade with full details</span></li>
                        </ul>
                    </div>
                </div>
            ),
        },

        // ─── 8. COMMON QUESTIONS ─────────────────────────────
        {
            id: 'faq',
            title: 'FAQ',
            icon: <HelpCircle size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <HelpCircle className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Common Questions</h2>
                            <p className="text-slate-500 text-xs">Quick answers to frequent asks</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {[
                            { q: 'Do I need to keep my computer on?', a: 'No. Everything runs on our cloud servers.' },
                            { q: 'Can I close my browser?', a: 'Yes. The algo keeps running, and Risk Guard keeps monitoring.' },
                            { q: 'What happens if I forget my password?', a: 'Contact your administrator to reset it.' },
                            { q: 'What is the access key for?', a: 'It identifies your account. Never share it with anyone.' },
                            { q: 'Can I run multiple algorithms at the same time?', a: "Yes, but they share the account's buying power. Not recommended for accounts under $1,000." },
                            { q: "What's the minimum balance I need?", a: 'PipNex: $500+. NOVA: $300+. SMC: $300+. Punex: $200+. Depends on your broker.' },
                            { q: 'What if the EA shows "Disconnected"?', a: 'Wait 30 seconds and refresh. If it stays disconnected, contact admin.' },
                            { q: 'Will the bot trade while I sleep?', a: "Yes. That's the point of automation." },
                            { q: 'Can I withdraw profits?', a: "Yes, directly from your MetaTrader 5 or the broker's portal." },
                            { q: 'Which algo should I choose?', a: 'Beginners: start with Punex (1 trade/day, low risk). Swing traders: NOVA or SMC. Active traders: PipNex.' },
                        ].map((item, i) => (
                            <details key={i} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden group">
                                <summary className="cursor-pointer p-4 font-semibold text-white hover:bg-slate-700/30 transition flex items-center justify-between list-none">
                                    <span className="flex items-center gap-3">
                                        <span className="p-1.5 bg-blue-500/15 border border-blue-500/30 rounded-lg flex-shrink-0">
                                            <HelpCircle size={14} className="text-blue-400" />
                                        </span>
                                        {item.q}
                                    </span>
                                    <ChevronRight size={18} className="text-slate-500 group-open:rotate-90 transition-transform flex-shrink-0" />
                                </summary>
                                <div className="px-4 pb-4 text-sm text-slate-300 border-t border-slate-700/50 pt-3 ml-10">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            ),
        },

        // ─── 9. TROUBLESHOOTING ──────────────────────────────
        {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            icon: <Wrench size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-600/20">
                            <Wrench className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Troubleshooting</h2>
                            <p className="text-slate-500 text-xs">Fixes for common issues</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { problem: 'EA Not Configured', cause: "Your VPS hasn't been assigned yet.", fix: 'Click "Refresh VPS Info". If it persists, contact admin.' },
                            { problem: 'EA Disconnected (red)', cause: 'The bot server is offline, or your broker is down.', fix: 'Wait 30s and refresh. If it persists 10+ minutes, contact admin.' },
                            { problem: 'Failed to send command', cause: "EA busy, or command didn't reach the server.", fix: 'Wait 5s, try again. If it keeps failing, refresh the page.' },
                            { problem: 'Risk Guard failed', cause: 'Could not reach the EA to capture starting balance.', fix: 'Ensure EA shows Connected. Try starting the algo again.' },
                            { problem: "Algo won't start", cause: 'VPS not set, EA offline, or button not clicked.', fix: 'Check VPS Address, EA status, and click Start Algo again.' },
                            { problem: "Trades aren't opening", cause: "Algo running but market conditions haven't triggered a signal.", fix: 'Wait — PipNex can wait 30+ mins. NOVA/SMC might wait hours. Punex waits until London open.' },
                            { problem: 'Order history is empty', cause: 'No trades in the selected date range.', fix: 'Widen the date range — try the 90-day preset or a custom range.' },
                        ].map((item, i) => (
                            <div key={i} className="bg-gradient-to-br from-rose-900/10 via-slate-800/40 to-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="p-1.5 bg-rose-500/15 border border-rose-500/30 rounded-lg flex-shrink-0">
                                        <XCircle size={14} className="text-rose-400" />
                                    </span>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                                        {item.problem}
                                    </h4>
                                </div>
                                <div className="space-y-2 text-sm pl-9">
                                    <p className="text-slate-400">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mr-2">Cause:</span>
                                        {item.cause}
                                    </p>
                                    <p className="text-emerald-300 flex items-start gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <span>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mr-2">Fix:</span>
                                            {item.fix}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },

        // ─── 10. BEST PRACTICES ──────────────────────────────
        {
            id: 'best-practices',
            title: 'Best Practices',
            icon: <Star size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-600/20">
                            <Star className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Best Practices</h2>
                            <p className="text-slate-500 text-xs">Tips from experienced traders</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900/40 border border-emerald-500/30 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-emerald-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <CheckCircle2 size={16} /> Do This
                            </h3>
                            <ul className="space-y-2.5 text-sm text-slate-300">
                                {[
                                    'Always set a Stop Loss on Risk Guard',
                                    'Start small — use default lot size',
                                    'Test on demo account first',
                                    'Check the dashboard once a day',
                                    'Keep your access key private',
                                    'Write down SL/TP values',
                                    'Start with Punex if you are a beginner',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gradient-to-br from-rose-900/20 to-slate-900/40 border border-rose-500/30 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-rose-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <XCircle size={16} /> Don't Do This
                            </h3>
                            <ul className="space-y-2.5 text-sm text-slate-300">
                                {[
                                    "Don't set huge lot sizes",
                                    "Don't run multiple algos on small accounts",
                                    "Don't ignore 'EA Disconnected'",
                                    "Don't share your login",
                                    "Don't stop algo during a losing streak",
                                    "Don't chase losses with bigger lots",
                                    "Don't enable martingale without understanding it",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <XCircle size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ),
        },

        // ─── 11. NEED HELP ───────────────────────────────────
        {
            id: 'support',
            title: 'Need Help?',
            icon: <MessageCircle size={16} />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <MessageCircle className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Need Help?</h2>
                            <p className="text-slate-500 text-xs">We're here 24/7</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border border-blue-500/30 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-blue-300 mb-4 uppercase tracking-wider">Contact Support</h3>
                        <div className="space-y-3 text-slate-300">
                            <div className="flex items-center gap-3 bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                <div className="p-2 bg-blue-500/15 border border-blue-500/30 rounded-lg flex-shrink-0">
                                    <MessageCircle size={16} className="text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Email</div>
                                    <a
                                        href="mailto:pipnexcustomer@gmail.com"
                                        className="text-blue-400 hover:text-blue-300 underline text-sm font-mono truncate block"
                                    >
                                        pipnexcustomer@gmail.com
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex-shrink-0">
                                    <MessageCircle size={16} className="text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Telegram (fastest)</div>
                                    <a
                                        href="https://t.me/calekyz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 underline text-sm font-mono truncate block"
                                    >
                                        t.me/calekyz
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                <div className="p-2 bg-purple-500/15 border border-purple-500/30 rounded-lg flex-shrink-0">
                                    <Zap size={16} className="text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Availability</div>
                                    <div className="text-white text-sm font-semibold">24/7 Support</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">When contacting support, always include:</h3>
                        <ul className="space-y-2.5 text-sm text-slate-300">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs flex items-center justify-center font-bold">1</span>
                                <span>Your email address</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs flex items-center justify-center font-bold">2</span>
                                <span>Screenshot of the issue</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs flex items-center justify-center font-bold">3</span>
                                <span>What you were doing when it happened</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs flex items-center justify-center font-bold">4</span>
                                <span>Any error message shown</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-slate-900/40 border border-blue-500/40 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
                        <div className="relative">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 shadow-lg shadow-blue-600/30 mb-4">
                                <Rocket className="text-white" size={28} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">You're Ready to Go!</h3>
                            <p className="text-slate-300 text-sm max-w-md mx-auto">
                                Remember: Start small, set Risk Guard, check daily.
                                If in doubt — stop the algo and contact support.
                            </p>
                            <p className="text-blue-300 font-bold mt-4">
                                Welcome to PipTrader AI. Happy trading! 🚀
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    const filteredSections = searchTerm
        ? sections.filter(s =>
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(s.content).toLowerCase().includes(searchTerm.toLowerCase())
        )
        : sections;

    const activeContent = sections.find(s => s.id === activeSection);
    const activeIndex = sections.findIndex(s => s.id === activeSection);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ─── HEADER ─────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl shadow-lg shadow-blue-600/20">
                            <BookOpen className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                                User Guide
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Everything you need to know about PipTrader AI
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                        {mobileMenuOpen ? <X size={16} /> : <ListOrdered size={16} />}
                        {mobileMenuOpen ? 'Close' : 'Contents'}
                    </button>
                </div>

                {/* ─── SEARCH ─────────────────────────────────────── */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search the guide..."
                        className="w-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl pl-12 pr-12 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                        >
                            <X size={18} />
                        </button>
                    )}
                    {searchTerm && (
                        <div className="absolute right-14 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            {filteredSections.length} result{filteredSections.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* ─── LAYOUT ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* ─── SIDEBAR (TOC) ──────────────────────────────── */}
                    <div className={`lg:col-span-1 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-3 lg:sticky lg:top-6">
                            <div className="flex items-center gap-2 px-3 py-2 mb-2">
                                <ListOrdered size={14} className="text-blue-400" />
                                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Contents
                                </h2>
                                <span className="text-[10px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded ml-auto">
                                    {filteredSections.length}
                                </span>
                            </div>
                            <nav className="space-y-1">
                                {filteredSections.map((section, idx) => {
                                    const isActive = activeSection === section.id;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => {
                                                setActiveSection(section.id);
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-600/10'
                                                    : 'text-slate-300 hover:bg-slate-700/40 border border-transparent'
                                            }`}
                                        >
                                            <span className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                                                isActive
                                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30'
                                                    : 'bg-slate-800/60 text-slate-500'
                                            }`}>
                                                {section.icon}
                                            </span>
                                            <span className="flex-1 truncate font-medium">{section.title}</span>
                                            <span className={`text-[10px] font-mono ${isActive ? 'text-blue-300' : 'text-slate-600'}`}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Progress */}
                            {!searchTerm && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50 px-3 pb-1">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                                        <span>Progress</span>
                                        <span className="text-blue-400 font-mono">
                                            {activeIndex + 1} / {sections.length}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                            style={{ width: `${((activeIndex + 1) / sections.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── CONTENT ────────────────────────────────────── */}
                    <div className="lg:col-span-3">
                        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 p-6 md:p-8">
                            {activeContent ? (
                                <div>{activeContent.content}</div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-4">
                                        <Search className="text-slate-500" size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">No sections match your search</h3>
                                    <p className="text-slate-400 text-sm mb-4">Try a different keyword.</p>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-600/20"
                                    >
                                        <X size={14} />
                                        Clear search
                                    </button>
                                </div>
                            )}

                            {/* ─── PREV / NEXT NAV ─────────────────────────── */}
                            {activeContent && !searchTerm && (
                                <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                                    {(() => {
                                        const prevSection = activeIndex > 0 ? sections[activeIndex - 1] : null;
                                        const nextSection = activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null;
                                        return (
                                            <>
                                                {prevSection ? (
                                                    <button
                                                        onClick={() => setActiveSection(prevSection.id)}
                                                        className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600/60 px-4 py-3 rounded-xl"
                                                    >
                                                        <ChevronRight size={16} className="rotate-180 text-slate-500 group-hover:text-blue-400 transition" />
                                                        <div className="text-left">
                                                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                                                Previous
                                                            </div>
                                                            <div className="font-semibold">{prevSection.title}</div>
                                                        </div>
                                                    </button>
                                                ) : <div />}
                                                {nextSection && (
                                                    <button
                                                        onClick={() => setActiveSection(nextSection.id)}
                                                        className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600/60 px-4 py-3 rounded-xl sm:ml-auto"
                                                    >
                                                        <div className="text-right">
                                                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                                                Next
                                                            </div>
                                                            <div className="font-semibold">{nextSection.title}</div>
                                                        </div>
                                                        <ChevronRight size={16} className="text-slate-500 group-hover:text-blue-400 transition" />
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── FOOTER HINT ────────────────────────────────── */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 py-2">
                    <Info size={10} className="text-blue-400" />
                    <span>Can't find what you need? Contact support from the Need Help section</span>
                </div>
            </div>
        </div>
    );
};

export default Guide;
