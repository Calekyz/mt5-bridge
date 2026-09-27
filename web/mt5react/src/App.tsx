import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    Home, FileText, TrendingUp, User, Clock, BarChart3, Zap, LogOut, Settings, Users, BookOpen, Download, Plus, Key
} from "lucide-react";

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
        if (!token) {
            setAuthChecked(true);
            return;
        }
        verifyToken(token);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(() => {
            const token = getToken();
            if (!token) {
                handleLogout();
                return;
            }
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
        } finally {
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
                if (!res.ok) {
                    setTermsAccepted(true);
                    setTermsChecked(true);
                    return;
                }
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

    if (!authChecked || showLoader) {
        return <Loader />;
    }

    if (isAuthenticated && !termsChecked) {
        return <Loader />;
    }

    if (isAuthenticated && termsAccepted === false) {
        return (
            <>
                <div className="min-h-screen bg-slate-950" />
                <TermsModal
                    onAccepted={handleTermsAccepted}
                    onDeclined={handleLogout}
                />
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
            </>
        );
    }

    const sideItems = [
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
    if (isAdmin) {
        sideItems.push({ path: "/admin", label: "Admin", icon: Users });
    }

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

                    @keyframes navGlowPulse {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.55); }
                        50%      { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
                    }
                    @keyframes navIndicatorSlide {
                        from { transform: scaleX(0); opacity: 0; }
                        to   { transform: scaleX(1); opacity: 1; }
                    }
                    @keyframes navShimmerSweep {
                        0%   { transform: translateX(-100%); }
                        100% { transform: translateX(200%); }
                    }
                    @keyframes navFloatBob {
                        0%, 100% { transform: translateY(0); }
                        50%      { transform: translateY(-3px); }
                    }
                    @keyframes navHaloPulse {
                        0%, 100% { opacity: 0.6; transform: scale(1); }
                        50%      { opacity: 0.95; transform: scale(1.08); }
                    }
                    @keyframes homeRingSpin {
                        from { transform: rotate(0deg); }
                        to   { transform: rotate(360deg); }
                    }

                    .nav-item { transition: all 320ms cubic-bezier(0.34, 1.56, 0.64, 1); }
                    .nav-item .nav-icon { transition: all 320ms cubic-bezier(0.34, 1.56, 0.64, 1); }
                    .nav-item:hover .nav-icon { transform: scale(1.12) translateY(-1px); }
                    .nav-item:active .nav-icon { transform: scale(0.92); }

                    .nav-item-active {
                        animation: navGlowPulse 2.4s ease-in-out infinite;
                    }

                    .nav-indicator {
                        transform-origin: center;
                        animation: navIndicatorSlide 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
                    }

                    .nav-shimmer {
                        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
                        animation: navShimmerSweep 3.5s ease-in-out infinite;
                    }

                    .nav-home-float { animation: navFloatBob 4s ease-in-out infinite; }
                    .nav-home-halo  { animation: navHaloPulse 3s ease-in-out infinite; }
                    .nav-home-ring  { animation: homeRingSpin 12s linear infinite; }
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
                                        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
                                            v2.0
                                        </span>
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
                        <main className="flex-1 mt-16 mb-28 overflow-y-auto">
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
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
                            </Routes>
                        </main>

                        {/* ═══════════════════════════════════════════════ */}
                        {/*  BOTTOM NAV — PREMIUM REDESIGN                 */}
                        {/* ═══════════════════════════════════════════════ */}
                        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-700/50">
                            {/* Red glow line at top */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-red-400/80 blur-sm" />

                            <div className="max-w-4xl mx-auto px-3 py-3">
                                <div className="flex justify-around items-end overflow-x-auto scrollbar-hide gap-1">

                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const isHome = item.isHome;

                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                className={({ isActive }) => {
                                                    if (isHome) {
                                                        return `nav-item nav-home-float group relative flex flex-col items-center justify-center mx-2
                                                            w-[68px] h-[68px] -mt-10 rounded-[22px]
                                                            bg-gradient-to-br from-red-500 via-rose-600 to-red-700
                                                            text-white
                                                            shadow-2xl shadow-red-600/50
                                                            ring-4 ring-slate-950
                                                            border border-red-300/40
                                                            hover:scale-[1.08] active:scale-95
                                                            ${isActive ? 'ring-red-400/40 scale-105' : ''}`;
                                                    }
                                                    return `nav-item group relative flex flex-col items-center justify-center
                                                        w-[58px] h-[58px] rounded-2xl mx-1
                                                        ${isActive
                                                            ? 'nav-item-active bg-gradient-to-br from-red-500/20 via-rose-500/15 to-red-500/20 text-white border border-red-500/40'
                                                            : 'text-slate-500 hover:text-white hover:bg-slate-800/70 border border-transparent'
                                                        }`;
                                                }}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        {/* HOME BUTTON — special decorations */}
                                                        {isHome && (
                                                            <>
                                                                {/* Rotating shimmer ring */}
                                                                <span className="nav-home-ring absolute inset-[-3px] rounded-[25px] border border-dashed border-red-300/40 pointer-events-none" />
                                                                {/* Pulsing halo */}
                                                                <span className="nav-home-halo absolute inset-[-6px] rounded-[28px] bg-red-500/25 blur-lg pointer-events-none" />
                                                                {/* Light sweep */}
                                                                <span className="absolute inset-0 rounded-[22px] overflow-hidden pointer-events-none">
                                                                    <span className="nav-shimmer absolute inset-y-0 left-0 w-1/2" />
                                                                </span>
                                                            </>
                                                        )}

                                                        {/* Active indicator bar (not for Home) */}
                                                        {isActive && !isHome && (
                                                            <span className="nav-indicator absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-gradient-to-r from-red-400 via-rose-400 to-red-400 shadow-lg shadow-red-500/70" />
                                                        )}

                                                        {/* Icon container with glow on active */}
                                                        <span className={`nav-icon relative flex items-center justify-center ${isHome ? 'drop-shadow-lg' : ''}`}>
                                                            {isActive && !isHome && (
                                                                <span className="absolute inset-[-6px] rounded-full bg-red-500/25 blur-md pointer-events-none" />
                                                            )}
                                                            <Icon
                                                                size={isHome ? 26 : 20}
                                                                strokeWidth={isHome ? 2.5 : isActive ? 2.5 : 2}
                                                                className="relative"
                                                            />
                                                        </span>

                                                        {/* Label */}
                                                        <span className={`relative text-[9px] font-bold mt-1 tracking-wider ${
                                                            isHome
                                                                ? 'text-white text-[10px] uppercase'
                                                                : isActive
                                                                    ? 'text-red-200'
                                                                    : 'text-slate-500 group-hover:text-slate-300'
                                                        }`}>
                                                            {item.label}
                                                        </span>
                                                    </>
                                                )}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        </nav>

                        <ToastContainer style={{ width: "400px", height: "100px" }} position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
                        <InstallPrompt />
                    </>
                ) : (
                    <LoginPage onLogin={handleLogin} />
                )}
            </div>
        </Router>
    );
}

export default App;
