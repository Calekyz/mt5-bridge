import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
    Home, FileText, TrendingUp, User, Clock, BarChart3, Zap, LogOut, Settings, Users, BookOpen
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
            <div className="text-white min-h-screen flex flex-col bg-slate-900">
                {isAuthenticated ? (
                    <>
                        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src={LOGO_URL} alt="PipTrader AI Logo" className="h-8 w-auto" />
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    PipTrader AI
                                </span>
                                <span className="text-xs text-slate-400 font-light hidden sm:inline">v2.0</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-700/50"
                                >
                                    <LogOut size={18} />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </header>

                        <main className="flex-1 mt-14 mb-24 overflow-y-auto p-4">
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

                        {/* ══════════════════════════════════════════════════ */}
                        {/*  BOTTOM NAVIGATION — Professional Redesign         */}
                        {/* ══════════════════════════════════════════════════ */}
                        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/60 px-1 py-2">
                            <div className="flex justify-around items-end max-w-4xl mx-auto overflow-x-auto">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isHome = item.isHome;

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => {
                                                if (isHome) {
                                                    return `flex flex-col items-center justify-center mx-1
                                                        w-16 h-16 -mt-8 rounded-2xl
                                                        bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600
                                                        text-white shadow-2xl shadow-orange-500/40
                                                        border-2 border-yellow-300/40
                                                        transition-all duration-300
                                                        hover:scale-105 active:scale-95
                                                        ${isActive ? 'ring-4 ring-yellow-300/50 scale-105' : ''}`;
                                                }

                                                return `flex flex-col items-center justify-center
                                                    w-14 h-14 rounded-xl mx-0.5
                                                    transition-all duration-300
                                                    ${isActive
                                                        ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 text-white shadow-lg shadow-emerald-600/40 scale-105 ring-2 ring-emerald-400/30'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/40 active:bg-slate-700/60'
                                                    }`;
                                            }}
                                        >
                                            <Icon
                                                size={isHome ? 28 : 20}
                                                strokeWidth={isHome ? 2.5 : 2}
                                                className={isHome ? 'drop-shadow-lg' : ''}
                                            />
                                            <span className={`text-[9px] font-bold mt-1 tracking-wide ${
                                                isHome ? 'text-white text-[10px]' : ''
                                            }`}>
                                                {item.label}
                                            </span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </nav>

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
        </Router>
    );
}

export default App;
