import React, { useState } from 'react';
import {
    BookOpen, Rocket, Key, LayoutDashboard, Play, Square,
    Shield, TrendingDown, BarChart3, HelpCircle,
    Wrench, Star, MessageCircle, ChevronRight, Search, X,
    AlertTriangle, CheckCircle2, XCircle, DollarSign, Server,
    Info, ListOrdered, LineChart, Zap
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
            icon: <Rocket size={18} />,
            content: (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Rocket className="text-blue-400" /> Welcome to PipTrader AI
                    </h2>
                    <p className="text-slate-300 leading-relaxed">
                        PipTrader AI is a <strong>cloud-based automated trading platform</strong>. It runs
                        trading algorithms on your MetaTrader 5 account, 24 hours a day, without you needing
                        to keep your computer on.
                    </p>

                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center gap-2">
                            <Info size={18} /> How it works
                        </h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                <span>Your MT5 account is connected to a <strong>dedicated cloud server (VPS)</strong> that we manage.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                <span>The algorithms <strong>PipNex</strong> and <strong>NOVA EDGE AI</strong> run 24/7.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                <span>You control everything from this dashboard — start, stop, adjust, monitor.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                            <h4 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                                <XCircle size={16} /> You DON'T need to
                            </h4>
                            <ul className="space-y-1 text-slate-300 text-sm">
                                <li>❌ Leave your computer on</li>
                                <li>❌ Install MetaTrader 5 on your PC</li>
                                <li>❌ Watch charts all day</li>
                            </ul>
                        </div>
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                            <h4 className="font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                                <CheckCircle2 size={16} /> You DO need
                            </h4>
                            <ul className="space-y-1 text-slate-300 text-sm">
                                <li>✅ A MetaTrader 5 account</li>
                                <li>✅ This dashboard</li>
                                <li>✅ Your login credentials</li>
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
            icon: <Key size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Key className="text-blue-400" /> Getting Started — Your First Login
                    </h2>

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-semibold text-white mb-3">What You Need Before Starting</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-2 text-slate-400 font-medium">Item</th>
                                        <th className="text-left py-2 text-slate-400 font-medium">Who Provides It</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300">
                                    <tr className="border-b border-slate-700/30">
                                        <td className="py-2">Email address</td>
                                        <td className="py-2 text-emerald-400">You</td>
                                    </tr>
                                    <tr className="border-b border-slate-700/30">
                                        <td className="py-2">Password</td>
                                        <td className="py-2 text-blue-400">Admin sets it</td>
                                    </tr>
                                    <tr className="border-b border-slate-700/30">
                                        <td className="py-2">Access Key</td>
                                        <td className="py-2 text-blue-400">Admin generates it</td>
                                    </tr>
                                    <tr className="border-b border-slate-700/30">
                                        <td className="py-2">VPS Assignment</td>
                                        <td className="py-2 text-blue-400">Admin sets it up</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">MT5 Account</td>
                                        <td className="py-2 text-emerald-400">You / Admin</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <ListOrdered size={18} className="text-blue-400" /> First Login Steps
                        </h3>
                        <ol className="space-y-3 text-slate-300">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                <div>
                                    <p className="font-medium text-white">Open the login URL</p>
                                    <p className="text-sm text-slate-400">Any modern browser — Chrome, Firefox, Edge, Safari.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                <div>
                                    <p className="font-medium text-white">Enter your email and password</p>
                                    <p className="text-sm text-slate-400">Click <strong>Connect</strong>.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                <div>
                                    <p className="font-medium text-white">Check the dashboard</p>
                                    <p className="text-sm text-slate-400">
                                        You should see: VPS Address (like <code className="text-xs bg-slate-700 px-1 rounded">http://xxx.xxx.xxx.xxx:8890</code>),
                                        <span className="text-emerald-400"> EA Connected</span>,
                                        and your Balance.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                                <div>
                                    <p className="font-medium text-white">You're ready!</p>
                                    <p className="text-sm text-slate-400">Now you can start trading.</p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                        <h4 className="font-semibold text-yellow-300 mb-1 flex items-center gap-2">
                            <AlertTriangle size={16} /> If you see "EA Not Configured"
                        </h4>
                        <p className="text-sm text-slate-300">
                            Click <strong>Refresh VPS Info</strong>. If it persists, contact your administrator — your VPS hasn't been assigned yet.
                        </p>
                    </div>
                </div>
            ),
        },

        // ─── 3. DASHBOARD OVERVIEW ────────────────────────────
        {
            id: 'dashboard',
            title: 'Dashboard Overview',
            icon: <LayoutDashboard size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <LayoutDashboard className="text-blue-400" /> Understanding the Dashboard
                    </h2>

                    <div className="space-y-4">
                        {[
                            {
                                title: 'Top Bar',
                                icon: <Server size={16} />,
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
                                items: [
                                    'Balance — money from closed trades',
                                    'Equity — current total value (balance + floating P/L)',
                                    "Profit — how much you've made or lost so far",
                                ],
                            },
                            {
                                title: 'Risk Guard',
                                icon: <Shield size={16} />,
                                items: [
                                    'Stop Loss — maximum drawdown before algo auto-stops',
                                    'Take Profit — profit target before algo auto-stops',
                                    'Active status — shows if the Risk Guard is monitoring',
                                ],
                            },
                            {
                                title: 'Strategy Cards',
                                icon: <Zap size={16} />,
                                items: [
                                    'Start/Stop button — enables or disables the algo',
                                    'Parameters — settings like lot size, pip step, etc.',
                                    'Status — "Algorithm running" when active',
                                ],
                            },
                        ].map((section) => (
                            <div key={section.title} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                                    <span className="text-blue-400">{section.icon}</span>
                                    {section.title}
                                </h3>
                                <ul className="space-y-1 text-sm text-slate-300">
                                    {section.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <ChevronRight size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },

        // ─── 4. START / STOP ──────────────────────────────────
        {
            id: 'start-stop',
            title: 'Starting & Stopping',
            icon: <Play size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Play className="text-emerald-400" /> Starting and Stopping the Algorithms
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                            <h3 className="font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                                <Play size={18} /> To START
                            </h3>
                            <ol className="space-y-2 text-sm text-slate-300">
                                <li>1. Go to the <strong>Dashboard</strong></li>
                                <li>2. Scroll to the algorithm card</li>
                                <li>3. Review the parameters</li>
                                <li>4. Click green <strong>▶ Start Algo</strong></li>
                                <li>5. Card turns <span className="text-emerald-400">green</span></li>
                            </ol>
                        </div>
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                            <h3 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                                <Square size={18} /> To STOP
                            </h3>
                            <ol className="space-y-2 text-sm text-slate-300">
                                <li>1. Find the running algo card</li>
                                <li>2. Click red <strong>⏹ Stop Algo</strong></li>
                                <li>3. Card returns to grey</li>
                                <li>4. Open positions are <strong>NOT</strong> auto-closed</li>
                                <li>5. Close them manually if needed</li>
                            </ol>
                        </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-300 mb-1 flex items-center gap-2">
                            <Info size={16} /> Important
                        </h4>
                        <ul className="space-y-1 text-sm text-slate-300">
                            <li>• Stopping one algo does not affect the other</li>
                            <li>• Stopping <strong>all</strong> algos also ends the Risk Guard session</li>
                            <li>• You must click <strong>Start Algo</strong> again after an EA restart</li>
                        </ul>
                    </div>
                </div>
            ),
        },

        // ─── 5. RISK GUARD ────────────────────────────────────
        {
            id: 'risk-guard',
            title: 'Risk Guard (SL/TP)',
            icon: <Shield size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-orange-400" /> Using Risk Guard
                    </h2>
                    <p className="text-slate-300">
                        Risk Guard is your <strong>safety net</strong>. It monitors your account and auto-stops
                        your algo when you hit your limits.
                    </p>

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <ListOrdered size={18} className="text-blue-400" /> How to set it up
                        </h3>
                        <ol className="space-y-2 text-sm text-slate-300">
                            <li>1. Find the <strong>Risk Guard</strong> card on the Dashboard</li>
                            <li>2. Enter your <strong className="text-red-400">Stop Loss ($)</strong> — e.g., <code className="text-xs bg-slate-700 px-1 rounded">100</code> means "stop if I lose $100"</li>
                            <li>3. Enter your <strong className="text-emerald-400">Take Profit ($)</strong> — e.g., <code className="text-xs bg-slate-700 px-1 rounded">200</code> means "stop if I make $200"</li>
                            <li>4. Both fields are optional</li>
                            <li>5. Click <strong>Start Algo</strong> — Risk Guard activates automatically</li>
                        </ol>
                    </div>

                    <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                        <h4 className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
                            <TrendingDown size={16} /> When SL/TP hits
                        </h4>
                        <ul className="space-y-1 text-sm text-slate-300">
                            <li>• All algorithms stop immediately</li>
                            <li>• <strong>All open positions are closed automatically</strong></li>
                            <li>• You see a banner + notification</li>
                            <li>• <span className="text-red-400">⚠️ STOP LOSS HIT</span> or <span className="text-emerald-400">🎯 TARGET PROFIT HIT</span></li>
                            <li>• Banner auto-hides after 30 seconds</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                        <h4 className="font-semibold text-yellow-300 mb-1 flex items-center gap-2">
                            <AlertTriangle size={16} /> Important
                        </h4>
                        <ul className="space-y-1 text-sm text-slate-300">
                            <li>• SL/TP values are <strong>locked</strong> once the algo starts</li>
                            <li>• To change them, stop all algos first</li>
                            <li>• Your values are saved — no need to re-enter</li>
                            <li>• New algo start = new Risk Guard session</li>
                        </ul>
                    </div>
                </div>
            ),
        },

        // ─── 6. VIEWING TRADES ────────────────────────────────
        {
            id: 'trades',
            title: 'Viewing Trades',
            icon: <BarChart3 size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="text-blue-400" /> Viewing Your Trades
                    </h2>

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <ListOrdered size={18} className="text-blue-400" /> Current Open Positions
                        </h3>
                        <p className="text-sm text-slate-400 mb-2">Go to <strong className="text-white">Orders</strong> in the top menu. You'll see:</p>
                        <ul className="space-y-1 text-sm text-slate-300">
                            <li>• <strong>Ticket</strong> — unique trade ID</li>
                            <li>• <strong>Symbol</strong> — e.g., XAUUSD</li>
                            <li>• <strong>Type</strong> — BUY or SELL</li>
                            <li>• <strong>Volume</strong> — lot size</li>
                            <li>• <strong>Open Price</strong> — when it opened</li>
                            <li>• <strong>Current Price</strong> — live</li>
                            <li>• <strong>Profit</strong> — unrealized P/L</li>
                            <li>• <strong>Action</strong> — click <strong>Close</strong> to close manually</li>
                        </ul>
                    </div>

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <LineChart size={18} className="text-blue-400" /> Trade History
                        </h3>
                        <p className="text-sm text-slate-400 mb-2">Go to <strong className="text-white">History</strong>:</p>
                        <ul className="space-y-1 text-sm text-slate-300">
                            <li>• Set a date range (default: 30 days)</li>
                            <li>• Click <strong>Apply Filter</strong></li>
                            <li>• See summary: Total Trades, Win Rate, Total Profit, Avg. Trade</li>
                            <li>• Every closed trade with full details</li>
                        </ul>
                    </div>
                </div>
            ),
        },

        // ─── 7. COMMON QUESTIONS ─────────────────────────────
        {
            id: 'faq',
            title: 'FAQ',
            icon: <HelpCircle size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <HelpCircle className="text-blue-400" /> Common Questions
                    </h2>

                    <div className="space-y-3">
                        {[
                            { q: 'Do I need to keep my computer on?', a: 'No. Everything runs on our cloud servers.' },
                            { q: 'Can I close my browser?', a: 'Yes. The algo keeps running, and Risk Guard keeps monitoring.' },
                            { q: 'What happens if I forget my password?', a: 'Contact your administrator to reset it.' },
                            { q: 'What is the access key for?', a: 'It identifies your account. Never share it with anyone.' },
                            { q: 'Can I run both algorithms at the same time?', a: "Yes, but they share the account's buying power. Not recommended for beginners." },
                            { q: "What's the minimum balance I need?", a: 'PipNex: $200+. NOVA: $500+. Depends on your broker.' },
                            { q: 'What if the EA shows "Disconnected"?', a: 'Wait 30 seconds and refresh. If it stays disconnected, contact admin.' },
                            { q: 'Will the bot trade while I sleep?', a: "Yes. That's the point of automation." },
                            { q: 'Can I withdraw profits?', a: "Yes, directly from your MetaTrader 5 or the broker's portal." },
                        ].map((item, i) => (
                            <details key={i} className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden group">
                                <summary className="cursor-pointer p-4 font-medium text-white hover:bg-slate-700/30 transition flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <HelpCircle size={16} className="text-blue-400" />
                                        {item.q}
                                    </span>
                                    <ChevronRight size={18} className="text-slate-500 group-open:rotate-90 transition" />
                                </summary>
                                <div className="px-4 pb-4 text-sm text-slate-300 border-t border-slate-700/50 pt-3">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            ),
        },

        // ─── 8. TROUBLESHOOTING ──────────────────────────────
        {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            icon: <Wrench size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Wrench className="text-yellow-400" /> Troubleshooting
                    </h2>

                    <div className="space-y-4">
                        {[
                            { problem: 'EA Not Configured', cause: "Your VPS hasn't been assigned yet.", fix: 'Click "Refresh VPS Info". If it persists, contact admin.' },
                            { problem: 'EA Disconnected (red)', cause: 'The bot server is offline, or your broker is down.', fix: 'Wait 30s and refresh. If it persists 10+ minutes, contact admin.' },
                            { problem: 'Failed to send command', cause: "EA busy, or command didn't reach the server.", fix: 'Wait 5s, try again. If it keeps failing, refresh the page.' },
                            { problem: 'Risk Guard failed', cause: 'Could not reach the EA to capture starting balance.', fix: 'Ensure EA shows Connected. Try starting the algo again.' },
                            { problem: "Algo won't start", cause: 'VPS not set, EA offline, or button not clicked.', fix: 'Check VPS Address, EA status, and click Start Algo again.' },
                            { problem: "Trades aren't opening", cause: "Algo running but market conditions haven't triggered a signal.", fix: 'Wait — PipNex can wait 30+ mins. NOVA might wait hours.' },
                            { problem: 'Order history is empty', cause: 'No trades in the selected date range.', fix: 'Widen the date range (try 90 days).' },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                                <h4 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                                    <XCircle size={16} /> {item.problem}
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <p className="text-slate-400"><span className="text-slate-500">Cause:</span> {item.cause}</p>
                                    <p className="text-emerald-300"><span className="text-slate-500">Fix:</span> {item.fix}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },

        // ─── 9. BEST PRACTICES ───────────────────────────────
        {
            id: 'best-practices',
            title: 'Best Practices',
            icon: <Star size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Star className="text-yellow-400" /> Best Practices
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                            <h3 className="font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                                <CheckCircle2 size={18} /> Do This
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li>✅ Always set a Stop Loss on Risk Guard</li>
                                <li>✅ Start small — use default lot size</li>
                                <li>✅ Test on demo account first</li>
                                <li>✅ Check the dashboard once a day</li>
                                <li>✅ Keep your access key private</li>
                                <li>✅ Write down SL/TP values</li>
                            </ul>
                        </div>
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                            <h3 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                                <XCircle size={18} /> Don't Do This
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li>❌ Don't set huge lot sizes</li>
                                <li>❌ Don't run both algos on small accounts</li>
                                <li>❌ Don't ignore "EA Disconnected"</li>
                                <li>❌ Don't share your login</li>
                                <li>❌ Don't stop algo during a losing streak</li>
                                <li>❌ Don't chase losses with bigger lots</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ),
        },

        // ─── 10. NEED HELP ───────────────────────────────────
        {
            id: 'support',
            title: 'Need Help?',
            icon: <MessageCircle size={18} />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageCircle className="text-blue-400" /> Need Help?
                    </h2>

                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-blue-300 mb-3">Contact Support</h3>
                        <div className="space-y-3 text-slate-300">
                            <p className="flex items-center gap-2">
                                📧 <strong>Email:</strong>
                                <a
                                    href="mailto:pipnexcustomer@gmail.com"
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    pipnexcustomer@gmail.com
                                </a>
                            </p>
                            <p className="flex items-center gap-2">
                                💬 <strong>Telegram:</strong>
                                <a
                                    href="https://t.me/calekyz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    t.me/calekyz
                                </a>
                            </p>
                            <p>🕐 <strong>Availability:</strong> 24/7 (Telegram is fastest)</p>
                        </div>
                    </div>

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-semibold text-white mb-3">When contacting support, always include:</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li>1. Your email address</li>
                            <li>2. Screenshot of the issue</li>
                            <li>3. What you were doing when it happened</li>
                            <li>4. Any error message shown</li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-6 text-center">
                        <Rocket className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-white mb-2">You're Ready to Go!</h3>
                        <p className="text-slate-300 text-sm">
                            Remember: Start small, set Risk Guard, check daily.
                            If in doubt — stop the algo and contact support.
                        </p>
                        <p className="text-blue-300 font-semibold mt-3">
                            Welcome to PipTrader AI. Happy trading! 🚀
                        </p>
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                                <BookOpen className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    User Guide
                                </h1>
                                <p className="text-slate-400 text-sm">
                                    Everything you need to know about PipTrader AI
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 bg-slate-700 rounded-lg text-white"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <ListOrdered size={20} />}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search the guide..."
                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className={`lg:col-span-1 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 sticky top-6">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
                                Table of Contents
                            </h2>
                            <nav className="space-y-1">
                                {filteredSections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            setActiveSection(section.id);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition ${
                                            activeSection === section.id
                                                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                                                : 'text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <span className={activeSection === section.id ? 'text-blue-400' : 'text-slate-500'}>
                                            {section.icon}
                                        </span>
                                        <span className="flex-1">{section.title}</span>
                                        {activeSection === section.id && (
                                            <ChevronRight size={14} className="text-blue-400" />
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 md:p-8">
                            {activeContent ? (
                                <div>{activeContent.content}</div>
                            ) : (
                                <div className="text-center py-12">
                                    <Search className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                                    <p className="text-slate-400">No sections match your search.</p>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            )}

                            {activeContent && (
                                <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-between">
                                    {(() => {
                                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                                        const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
                                        const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
                                        return (
                                            <>
                                                {prevSection ? (
                                                    <button
                                                        onClick={() => setActiveSection(prevSection.id)}
                                                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
                                                    >
                                                        <ChevronRight size={16} className="rotate-180" />
                                                        <span>{prevSection.title}</span>
                                                    </button>
                                                ) : <div />}
                                                {nextSection && (
                                                    <button
                                                        onClick={() => setActiveSection(nextSection.id)}
                                                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
                                                    >
                                                        <span>{nextSection.title}</span>
                                                        <ChevronRight size={16} />
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
            </div>
        </div>
    );
};

export default Guide;
