// @ts-nocheck
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    Home, FileText, TrendingUp, User, Clock, BarChart3, Zap, LogOut, Settings, Users, BookOpen, Download, Plus, Key, DollarSign, Crown } from "lucide-react";

// ---- Components ----
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { Loader } from "./components/Loader";
import { AdminPanel } from "./components/AdminPanel";
import AccountInfo from "./components/AccountInfo";
import OrderRequest from "./components/OrderRequest";
import { OrdersList } from "./components/OrderList";
import OrderHistory from "./components/OrderHistory";
import { CandleChart } from "./components/CandleStickChartComp";
import WsStreaming from "./components/WsStreaming";
import { PipnexTradingSystem } from "./components/PipnexTradingSystem";
import Guide from "./components/Guide";
import InstallPrompt from "./components/InstallPrompt";
import SymbolRequest from "./components/SymbolRequest";
import Mt5DetailsPage from "./pages/Mt5Details";
import AdminMt5DetailsPage from "./pages/AdminMt5Details";
import Unsubscribe from "./pages/Unsubscribe";
import AdminUnsubscribes from "./pages/AdminUnsubscribes";
import { TermsModal } from "./components/TermsModal";
import TermsPage from "./pages/TermsPage";
import AdminTermsAcceptances from "./pages/AdminTermsAcceptances";
import { SupportWidget } from './components/SupportWidget';
import { LeftNav } from './components/LeftNav';
import { DrawerNav } from './components/DrawerNav';
import { HomeFab } from './components/HomeFab';
import AdminUsersPage from './pages/AdminUsers';
import AdminTransactions from './pages/AdminTransactions';
import SubscribePage from './pages/SubscribePage';
import { PendingPaymentBanner } from './payments/PendingPaymentBanner';

const LOGO_URL = "https://i.postimg.cc/RFMfM938/Neon-Cloud-Forex-AI-Logo.png";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

function getToken(): string | null {
    return localStorage.getItem('token');
}
function clearToken() {
    localStorage.removeItem('token');
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [showLoader, setShowLoader] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [termsChecked, setTermsChecked] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setShowLoader(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const token = getToken();
        if (!token) { setAuthChecked(true); return; }
        verifyToken(token);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        // Poll less aggressively (60s vs 10s). Also verify when tab becomes visible again.
        const interval = setInterval(() => {
            const token = getToken();
            if (!token) { handleLogout(); return; }
            verifyToken(token);
        }, 60_000);

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                const token = getToken();
                if (token) verifyToken(token);
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [isAuthenticated]);

    const verifyToken = async (token: string, opts: { retryOnNetwork?: boolean } = { retryOnNetwork: true }) => {
        try {
            const res = await fetch(`${API_URL}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            // 401 = real auth failure → logout
            if (res.status === 401) {
                clearToken();
                setIsAuthenticated(false);
                setUser(null);
                setAuthChecked(true);
                return;
            }

            // 200 = success
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setIsAuthenticated(true);
                setAuthChecked(true);
                return;
            }

            // 5xx (Render cold start, proxy error, etc.) → retry once
            if (opts.retryOnNetwork) {
                await new Promise((r) => setTimeout(r, 1500));
                return verifyToken(token, { retryOnNetwork: false });
            }

            // Still failing after retry → DO NOT log out. Keep user cached, they'll retry on next poll.
            console.warn('Auth verify returned', res.status, '— keeping session (will retry)');
            setAuthChecked(true);
        } catch (err) {
            // Network error / timeout / Render cold start — retry once
            if (opts.retryOnNetwork) {
                await new Promise((r) => setTimeout(r, 2000));
                return verifyToken(token, { retryOnNetwork: false });
            }
            // Still offline → keep the user logged in with cached state
            const cachedUser = (() => {
                try {
                    const raw = localStorage.getItem('user');
                    return raw ? JSON.parse(raw) : null;
                } catch { return null; }
            })();
            if (cachedUser) {
                setUser(cachedUser);
                setIsAuthenticated(true);
            }
            setAuthChecked(true);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setTermsChecked(false);
            setTermsAccepted(null);
            return;
        }
        (async () => {
            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/terms/status`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!res.ok) { setTermsAccepted(true); setTermsChecked(true); return; }
                const data = await res.json();
                setTermsAccepted(!!data.accepted);
                setTermsChecked(true);
            } catch {
                setTermsAccepted(true);
                setTermsChecked(true);
            }
        })();
    }, [isAuthenticated]);

    const handleLogin = (data: { token: string; user: any }) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.mt5) {
            localStorage.setItem('mt5Account', JSON.stringify(data.user.mt5));
        } else {
            localStorage.removeItem('mt5Account');
        }
        setUser(data.user);
        setIsAuthenticated(true);
        setTermsChecked(false);
        setTermsAccepted(null);
    };

    const handleLogout = () => {
        clearToken();
        localStorage.removeItem('mt5Account');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        setTermsChecked(false);
        setTermsAccepted(null);
    };

    const handleTermsAccepted = () => {
        setTermsAccepted(true);
        setTermsChecked(true);
    };

    const isAdmin = user?.email === 'caleborenge8@gmail.com';

    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path === '/unsubscribe') {
            return (
                <>
                    <Unsubscribe />
                    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
                </>
            );
        }
        if (path === '/terms') {
            return (
                <>
                    <TermsPage />
                    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
                </>
            );
        }
    }

    if (!authChecked || showLoader) return <Loader />;
    if (isAuthenticated && !termsChecked) return <Loader />;

    if (isAuthenticated && termsAccepted === false) {
        return (
            <>
                <div className="min-h-screen bg-slate-950" />
                <TermsModal onAccepted={handleTermsAccepted} onDeclined={handleLogout} />
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
            </>
        );
    }

    const sideItems = [
        { path: "/subscribe", label: "Subscribe", icon: Crown },
        { path: "/orders", label: "Orders", icon: FileText },
        { path: "/request", label: "Trade", icon: TrendingUp },
        { path: "/symbol-request", label: "Symbols", icon: Plus },
        { path: "/account", label: "Account", icon: User },
        { path: "/mt5-details", label: "MT5", icon: Key },
        { path: "/history", label: "History", icon: Clock },
        { path: "/chart", label: "Chart", icon: BarChart3 },
        { path: "/strategies", label: "Algos", icon: Settings },
        { path: "/ws", label: "WS", icon: Zap },
        { path: "/guide", label: "Guide", icon: BookOpen },
    ];
    if (isAdmin) sideItems.push({ path: "/admin", label: "Admin", icon: Users });
    if (isAdmin) sideItems.push({ path: "/admin/transactions", label: "Payments", icon: DollarSign });
    if (isAdmin) sideItems.push({ path: "/admin/users", label: "Users", icon: Users });

    const middleIndex = Math.floor(sideItems.length / 2);
    const navItems: any[] = [...sideItems];
    navItems.splice(middleIndex, 0, { path: "/", label: "Home", icon: Home, isHome: true });

    return (
        <Router>
            <div className="text-white min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

                {/* ═══════════════ GLOBAL ANIMATIONS ═══════════════ */}
                <style>{`
                    body, html, * { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
                    
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

                    /* ── Animated gradient panel ── */
                    @keyframes panelGradientFlow {
                        0%   { background-position:   0% 50%; }
                        50%  { background-position: 100% 50%; }
                        100% { background-position:   0% 50%; }
                    }
                    @keyframes panelShimmer {
                        0%   { transform: translateX(-100%); }
                        100% { transform: translateX(200%); }
                    }

                    /* ── Button hover/active effects ── */
                    @keyframes navGlowPulseGreen {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
                        50%      { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                    }
                    @keyframes navIndicatorSlide {
                        from { transform: scaleX(0); opacity: 0; }
                        to   { transform: scaleX(1); opacity: 1; }
                    }
                    @keyframes navFloatBob {
                        0%, 100% { transform: translateY(0); }
                        50%      { transform: translateY(-3px); }
                    }
                    @keyframes navHaloPulseGold {
                        0%, 100% { opacity: 0.55; transform: scale(1); }
                        50%      { opacity: 0.95; transform: scale(1.10); }
                    }
                    @keyframes homeRingSpin {
                        from { transform: rotate(0deg); }
                        to   { transform: rotate(360deg); }
                    }
                    @keyframes homeShimmer {
                        0%   { transform: translateX(-100%); }
                        100% { transform: translateX(200%); }
                    }

                    /* ── Nav item base transitions ── */
                    .nav-item { transition: all 320ms cubic-bezier(0.34, 1.56, 0.64, 1); }
                    .nav-item .nav-icon { transition: all 320ms cubic-bezier(0.34, 1.56, 0.64, 1); }
                    .nav-item:hover .nav-icon { transform: scale(1.12) translateY(-1px); }
                    .nav-item:active .nav-icon { transform: scale(0.92); }

                    .nav-item-active-green {
                        animation: navGlowPulseGreen 2.4s ease-in-out infinite;
                    }
                    .nav-indicator {
                        transform-origin: center;
                        animation: navIndicatorSlide 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
                    }

                    .nav-home-float { animation: navFloatBob 4s ease-in-out infinite; }
                    .nav-home-halo  { animation: navHaloPulseGold 3s ease-in-out infinite; }
                    .nav-home-ring  { animation: homeRingSpin 12s linear infinite; }
                    .nav-home-shimmer { animation: homeShimmer 3.5s ease-in-out infinite; }

                    /* ── Animated gradient panel class ── */
                    .nav-panel-gradient {
                        background: linear-gradient(120deg,
                            rgba(251, 191, 36, 0.12) 0%,
                            rgba(16, 185, 129, 0.14) 25%,
                            rgba(239, 68, 68, 0.10) 50%,
                            rgba(16, 185, 129, 0.14) 75%,
                            rgba(251, 191, 36, 0.12) 100%);
                        background-size: 400% 100%;
                        animation: panelGradientFlow 14s ease-in-out infinite;
                    }

                    /* ── Bigger buttons on phones ── */
                    @media (max-width: 640px) {
                        .nav-btn-base { width: 62px !important; height: 62px !important; }
                        .nav-btn-home { width: 74px !important; height: 74px !important; }
                        .nav-btn-label { font-size: 10px !important; }
                        .nav-btn-icon { width: 22px !important; height: 22px !important; }
                        .nav-btn-home-icon { width: 30px !important; height: 30px !important; }
                    }

                    /* ═══════════════════════════════════════════════════════════ */
                    /*  GLOBAL DESIGN SYSTEM — applies to ALL pages             */
                    /* ═══════════════════════════════════════════════════════════ */
                    
                    /* Typography */
                    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
                    h1, h2, h3, h4 { letter-spacing: -0.02em; }
                    
                    /* Inputs — universal refinement */
                    input[type="text"], input[type="number"], input[type="email"],
                    input[type="password"], input[type="tel"], input[type="url"],
                    textarea, select {
                        font-feature-settings: 'tnum' 1, 'lnum' 1;
                        transition: border-color 220ms ease, box-shadow 220ms ease, background 220ms ease;
                    }
                    input[type="number"] { -moz-appearance: textfield; }
                    input[type="number"]::-webkit-outer-spin-button,
                    input[type="number"]::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input:focus, textarea:focus, select:focus {
                        outline: none;
                        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
                    }
                    
                    /* Buttons — universal smooth transitions */
                    button {
                        transition: background-color 200ms ease, border-color 200ms ease,
                                    color 200ms ease, transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
                                    box-shadow 200ms ease, opacity 200ms ease;
                        -webkit-tap-highlight-color: transparent;
                    }
                    button:active:not(:disabled) { transform: scale(0.97); }
                    button:disabled { cursor: not-allowed; }
                    
                    /* Custom scrollbar — sleek, thin */
                    ::-webkit-scrollbar { width: 6px; height: 6px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb {
                        background: rgba(148, 163, 184, 0.18);
                        border-radius: 3px;
                        transition: background 200ms ease;
                    }
                    ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.35); }
                    
                    /* Selection */
                    ::selection { background: rgba(16, 185, 129, 0.3); color: #fff; }
                    
                    /* Card entrance animation */
                    @keyframes cardEnter {
                        from { opacity: 0; transform: translateY(6px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                    .card-enter { animation: cardEnter 0.4s ease-out both; }
                    
                    /* Smooth tabular numbers everywhere they matter */
                    .tabular-nums { font-variant-numeric: tabular-nums; }
                    
                    /* Link hover refinement */
                    a { transition: color 180ms ease, opacity 180ms ease, transform 150ms ease; }
                `}</style>

                {isAuthenticated ? (
                    <>
                        {/* HEADER */}
                        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50">
                            <div className="max-w-7xl mx-auto pl-32 pr-4 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-rose-500/30 blur-xl rounded-full" />
                                        <img src={LOGO_URL} alt="PipTrader AI Logo" className="relative h-9 w-auto rounded-lg shadow-lg shadow-red-600/20 ring-1 ring-slate-700/50" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-white via-red-100 to-rose-200 bg-clip-text text-transparent leading-none">
                                            PipTrader AI
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">v2.0</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { const event = new CustomEvent('trigger-install'); window.dispatchEvent(event); }}
                                        className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-white transition-all px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-red-600 border border-slate-700/60 hover:border-red-500/60 shadow-lg shadow-transparent hover:shadow-red-600/20"
                                        title="Install App"
                                    >
                                        <Download size={14} className="group-hover:scale-110 transition-transform" />
                                        <span className="hidden sm:inline">Install</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-rose-300 transition-all px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/40"
                                    >
                                        <LogOut size={14} className="group-hover:scale-110 transition-transform" />
                                        <span className="hidden sm:inline">Logout</span>
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* MAIN */}
                        <main className="flex-1 mt-16 ml-0 overflow-y-auto">
                            <PendingPaymentBanner userEmail={user?.email} />
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/subscribe" element={<SubscribePage />} />
                                <Route path="/guide" element={<Guide />} />
                                <Route path="/orders" element={<OrdersList />} />
                                <Route path="/request" element={<OrderRequest />} />
                                <Route path="/symbol-request" element={<SymbolRequest />} />
                                <Route path="/account" element={<AccountInfo />} />
                                <Route path="/mt5-details" element={<Mt5DetailsPage />} />
                                <Route path="/history" element={<OrderHistory />} />
                                <Route path="/chart" element={<CandleChart />} />
                                <Route path="/ws" element={<WsStreaming />} />
                                <Route path="/strategies" element={<PipnexTradingSystem />} />
                                <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />} />
                                <Route path="/admin/mt5-details" element={isAdmin ? <AdminMt5DetailsPage /> : <Navigate to="/" replace />} />
                                <Route path="/admin/unsubscribes" element={isAdmin ? <AdminUnsubscribes /> : <Navigate to="/" replace />} />
                                <Route path="/admin/terms-acceptances" element={isAdmin ? <AdminTermsAcceptances /> : <Navigate to="/" replace />} />
                                <Route path="/admin/transactions" element={isAdmin ? <AdminTransactions /> : <Navigate to="/" replace />} />
                                <Route path="/admin/users" element={isAdmin ? <AdminUsersPage /> : <Navigate to="/" replace />} />
                            </Routes>
                        </main>

                        {/* ═══════════════════════════════════════════════ */}
                        {/*  BOTTOM NAV — GREEN BUTTONS + ANIMATED PANEL   */}
                        {/* ═══════════════════════════════════════════════ */}
                        <DrawerNav isAdmin={isAdmin} onLogout={handleLogout} />

                        <ToastContainer style={{ width: "400px", height: "100px" }} position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
                        <InstallPrompt />
                    </>
                ) : (
                    <LoginPage onLogin={handleLogin} />
                )}

                {/* ═══ Floating Support Widget (visible everywhere) ═══ */}
                <SupportWidget />
                <HomeFab />
            </div>
        </Router>
    );
}

export default App;
