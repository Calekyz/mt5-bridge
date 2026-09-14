import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    Home, FileText, TrendingUp, User, Clock, BarChart3, Zap, LogOut, Settings, Users, BookOpen, Download
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
    };

    const handleLogout = () => {
        clearToken();
        localStorage.removeItem('mt5Account');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const isAdmin = user?.email === 'caleborenge8@gmail.com';

    // ─── Build nav items with HOME in the middle ────────────────
    const sideItems = [
        { path: "/orders", label: "Orders", icon: FileText },
        { path: "/request", label: "Trade", icon: TrendingUp },
        { path: "/account", label: "Account", icon: User },
        { path: "/history", label: "History", icon: Clock },
        { path: "/chart", label: "Chart", icon: BarChart3 },
        { path: "/strategies", label: "Algos", icon: Settings },
        { path: "/ws", label: "WS", icon: Zap },
        { path: "/guide", label: "Guide", icon: BookOpen },
    ];
    if (isAdmin) {
        sideItems.push({ path: "/admin", label: "Admin", icon: Users });
    }

    // Insert Home in the middle of the array
    const middleIndex = Math.floor(sideItems.length / 2);
    const navItems: any[] = [...sideItems];
    navItems.splice(middleIndex, 0, { path: "/", label: "Home", icon: Home, isHome: true });

    if (!authChecked || showLoader) {
        return <Loader />;
    }

    return (
        <Router>
            <div className="text-white min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                {isAuthenticated ? (
                    <>
                        {/* ─── HEADER ─────────────────────────────────── */}
                        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50">
                            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

                                {/* Logo + Brand */}
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-xl rounded-full" />
                                        <img
                                            src={LOGO_URL}
                                            alt="PipTrader AI Logo"
                                            className="relative h-9 w-auto rounded-lg shadow-lg shadow-blue-600/20 ring-1 ring-slate-700/50"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-none">
                                            PipTrader AI
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
                                            v2.0
                                        </span>
                                    </div>
                                </div>

                                {/* Right actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const event = new CustomEvent('trigger-install');
                                            window.dispatchEvent(event);
                                        }}
                                        className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-white transition-all px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-blue-600 border border-slate-700/60 hover:border-blue-500/60 shadow-lg shadow-transparent hover:shadow-blue-600/20"
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

                        {/* ─── MAIN CONTENT ───────────────────────────── */}
                        <main className="flex-1 mt-16 mb-28 overflow-y-auto">
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/guide" element={<Guide />} />
                                <Route path="/orders" element={<OrdersList />} />
                                <Route path="/request" element={<OrderRequest />} />
                                <Route path="/account" element={<AccountInfo />} />
                                <Route path="/history" element={<OrderHistory />} />
                                <Route path="/chart" element={<CandleChart />} />
                                <Route path="/ws" element={<WsStreaming />} />
                                <Route path="/strategies" element={<PipnexTradingSystem />} />
                                <Route
                                    path="/admin"
                                    element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />}
                                />
                            </Routes>
                        </main>

                        {/* ─── BOTTOM NAV ─────────────────────────────── */}
                        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-700/50">
                            {/* Subtle top gradient line */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                            <div className="max-w-4xl mx-auto px-2 py-2.5">
                                <div className="flex justify-around items-end overflow-x-auto scrollbar-hide">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const isHome = item.isHome;

                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                className={({ isActive }) => {
                                                    if (isHome) {
                                                        return `relative flex flex-col items-center justify-center mx-1
                                                            w-16 h-16 -mt-9 rounded-2xl
                                                            bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600
                                                            text-white shadow-2xl shadow-orange-500/50
                                                            ring-4 ring-slate-950
                                                            border border-amber-300/40
                                                            transition-all duration-300
                                                            hover:scale-105 active:scale-95
                                                            ${isActive ? 'ring-orange-400/30 scale-105' : ''}`;
                                                    }

                                                    return `relative flex flex-col items-center justify-center
                                                        w-14 h-14 rounded-xl mx-0.5
                                                        transition-all duration-300
                                                        ${isActive
                                                            ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 text-white shadow-lg shadow-emerald-600/40 scale-105'
                                                            : 'text-slate-500 hover:text-white hover:bg-slate-800/60'
                                                        }`;
                                                }}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        {/* Active indicator dot */}
                                                        {isActive && !isHome && (
                                                            <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-300 rounded-full shadow-lg shadow-emerald-400/60" />
                                                        )}

                                                        <Icon
                                                            size={isHome ? 26 : 20}
                                                            strokeWidth={isHome ? 2.5 : isActive ? 2.4 : 2}
                                                            className={isHome ? 'drop-shadow-lg' : ''}
                                                        />
                                                        <span className={`text-[9px] font-bold mt-1 tracking-wide ${
                                                            isHome
                                                                ? 'text-white text-[10px] uppercase'
                                                                : isActive
                                                                    ? 'text-white'
                                                                    : 'text-slate-500'
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

                        {/* ─── TOASTS ─────────────────────────────────── */}
                        <ToastContainer
                            style={{ width: "400px", height: "100px" }}
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop
                            closeOnClick
                            pauseOnHover
                            draggable
                            theme="dark"
                        />

                        <InstallPrompt />
                    </>
                ) : (
                    <LoginPage onLogin={handleLogin} />
                )}
            </div>

            {/* Global scrollbar-hide utility */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </Router>
    );
}

export default App;
