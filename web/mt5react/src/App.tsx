import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
    Home, 
    FileText, 
    TrendingUp, 
    User, 
    Clock, 
    BarChart3, 
    Zap, 
    LogOut,
    Settings
} from "lucide-react";

// ---- Components ----
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { Loader } from "./components/Loader";
import AccountInfo from "./components/AccountInfo";
import OrderRequest from "./components/OrderRequest";
import { OrdersList } from "./components/OrderList";
import OrderHistory from "./components/OrderHistory";
import { CandleChart } from "./components/CandleStickChartComp";
import WsStreaming from "./components/WsStreaming";
import { PipnexTradingSystem } from "./components/PipnexTradingSystem";

// ---- Auth helpers ----
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

    // ─── Minimum load time (4 seconds) ──────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoader(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    // ─── Check token on mount ────────────────────────────────
    useEffect(() => {
        const token = getToken();
        if (!token) {
            setAuthChecked(true);
            return;
        }

        fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (res.ok) {
                setIsAuthenticated(true);
            } else {
                clearToken();
            }
        })
        .catch(() => {
            clearToken();
        })
        .finally(() => {
            setAuthChecked(true);
        });
    }, []);

    const handleLogin = (data: { token: string; user: any }) => {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        clearToken();
        setIsAuthenticated(false);
    };

    const navItems = [
        { path: "/", label: "Home", icon: Home },
        { path: "/orders", label: "Orders", icon: FileText },
        { path: "/request", label: "Trade", icon: TrendingUp },
        { path: "/account", label: "Account", icon: User },
        { path: "/history", label: "History", icon: Clock },
        { path: "/chart", label: "Chart", icon: BarChart3 },
        { path: "/ws", label: "WS", icon: Zap },
        { path: "/strategies", label: "Strategies", icon: Settings },
    ];

    // ─── SHOW LOADER until BOTH conditions are met ──────────
    if (!authChecked || showLoader) {
        return <Loader />;
    }

    return (
        <Router>
            <div 
                className="text-white min-h-screen flex flex-col"
                style={{
                    backgroundImage: `url('https://i.postimg.cc/DwvhGhZM/Chat-GPT-Image-Sep-7-2026-02-36-16-AM.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed'
                }}
            >
                {isAuthenticated ? (
                    <>
                        {/* Top Header */}
                        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/90 backdrop-blur-md border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img 
                                    src="https://i.postimg.cc/4ygqTvHz/Chat-GPT-Image-Sep-7-2026-02-38-09-AM.png" 
                                    alt="PipTrader AI Logo" 
                                    className="h-8 w-auto"
                                />
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    PipTrader AI
                                </span>
                                <span className="text-xs text-slate-400 font-light hidden sm:inline">v2.0</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-700/50"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </header>

                        {/* Main Content */}
                        <main className="flex-1 mt-14 mb-16 overflow-y-auto p-4">
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/orders" element={<OrdersList />} />
                                <Route path="/request" element={<OrderRequest />} />
                                <Route path="/account" element={<AccountInfo />} />
                                <Route path="/history" element={<OrderHistory />} />
                                <Route path="/chart" element={<CandleChart />} />
                                <Route path="/ws" element={<WsStreaming />} />
                                <Route path="/strategies" element={<PipnexTradingSystem />} />
                            </Routes>
                        </main>

                        {/* Bottom Navigation */}
                        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800/90 backdrop-blur-md border-t border-gray-700 flex justify-around items-center py-1 px-2 overflow-x-auto">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex flex-col items-center px-2 py-1 rounded-lg transition-all duration-200 ${
                                                isActive
                                                    ? 'text-blue-400 scale-105'
                                                    : 'text-slate-400 hover:text-white hover:bg-gray-700/50'
                                            }`
                                        }
                                    >
                                        <Icon size={22} strokeWidth={2} />
                                        <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
                                            {item.label}
                                        </span>
                                    </NavLink>
                                );
                            })}
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
                    </>
                ) : (
                    <LoginPage onLogin={handleLogin} />
                )}
            </div>
        </Router>
    );
}

export default App;
