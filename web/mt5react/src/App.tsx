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
import AdminTransactions from './pages/AdminTransactions';
import SubscribePage from './pages/SubscribePage';
import { PendingPaymentBanner } from './payments/PendingPaymentBanner';

const LOGO_URL = "https://i.postimg.cc/YCzbHFXH/Chat-GPT-Image-Sep-7-2026-02-38-09-AM.png";
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
        const interval = setInterval(() => {
            const token = getToken();
            if (!token) { handleLogout(); return; }
            verifyToken(token);
        }, 10000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const verifyToken = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setIsAuthenticated(true);
            } else {
                clearToken();
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch {
            clearToken();
            setIsAuthenticated(false);
            setUser(null);
        } finally { setAuthChecked(true); }
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

    const middleIndex = Math.floor(sideItems.length / 2);
    const navItems: any[] = [...sideItems];
    navItems.splice(middleIndex, 0, { path: "/", label: "Home", icon: Home, isHome: true });

    return (
        <Router>
            <div className="text-white min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

                {/* ═══════════════ GLOBAL ANIMATIONS ═══════════════ */}
                <style>{`
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
                `}</style>

                {isAuthenticated ? (
                    <>
                        {/* HEADER */}
                        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50">
                            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
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
                        <main className="flex-1 mt-16 ml-16 overflow-y-auto">
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
                            </Routes>
                        </main>

                        {/* ═══════════════════════════════════════════════ */}
                        {/*  BOTTOM NAV — GREEN BUTTONS + ANIMATED PANEL   */}
                        {/* ═══════════════════════════════════════════════ */}
                        <nav className="fixed left-0 top-16 bottom-0 z-40 w-16 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto scrollbar-hide">
                            <div className="nav-panel-gradient absolute inset-0 pointer-events-none" />
                            <div className="absolute inset-0 bg-slate-950/85 pointer-events-none" />
                            <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-amber-400/60 via-emerald-400/60 to-red-400/60" />
                            <div className="relative flex flex-col items-center gap-1.5 py-3">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isHome = item.isHome;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => {
                                                if (isHome) {
                                                    return `nav-item nav-home-float group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 text-white shadow-2xl shadow-amber-600/60 ring-2 ring-slate-950 border border-amber-200/50 hover:scale-105 active:scale-95 ${isActive ? 'ring-amber-400/40' : ''}`;
                                                }
                                                return `nav-item group relative flex flex-col items-center justify-center w-11 h-11 rounded-lg ${isActive ? 'nav-item-active-green bg-gradient-to-br from-emerald-500/25 via-teal-500/20 to-green-500/25 text-white border border-emerald-400/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent'}`;
                                            }}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {isHome && (
                                                        <>
                                                            <span className="nav-home-ring absolute inset-[-3px] rounded-[19px] border border-dashed border-amber-200/50 pointer-events-none" />
                                                            <span className="nav-home-halo absolute inset-[-6px] rounded-[22px] bg-amber-400/30 blur-lg pointer-events-none" />
                                                        </>
                                                    )}
                                                    {isActive && !isHome && (
                                                        <span className="nav-indicator absolute -right-1 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-gradient-to-b from-emerald-300 via-teal-300 to-emerald-300 shadow-lg shadow-emerald-500/70" />
                                                    )}
                                                    <span className="nav-icon nav-btn-icon relative flex items-center justify-center">
                                                        {isActive && !isHome && (
                                                            <span className="absolute inset-[-6px] rounded-full bg-emerald-500/30 blur-md pointer-events-none" />
                                                        )}
                                                        <Icon size={isHome ? 20 : 18} strokeWidth={isHome ? 2.5 : isActive ? 2.5 : 2} className="relative" />
                                                    </span>
                                                    <span className={`relative text-[9px] font-bold mt-1 tracking-wider ${isHome ? 'text-white uppercase' : isActive ? 'text-emerald-200' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                                        {item.label}
                                                    </span>
                                                </>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </nav>

                        <ToastContainer style={{ width: "400px", height: "100px" }} position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
                        <InstallPrompt />
                    </>
                ) : (
                    <LoginPage onLogin={handleLogin} />
                )}

                {/* ═══ Floating Support Widget (visible everywhere) ═══ */}
                <SupportWidget />
            </div>
        </Router>
    );
}

export default App;
