import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState } from "react";
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
import AccountInfo from "./components/AccountInfo";
import OrderRequest from "./components/OrderRequest";
import { OrdersList } from "./components/OrderList";
import OrderHistory from "./components/OrderHistory";
import { CandleChart } from "./components/CandleStickChartComp";
import WsStreaming from "./components/WsStreaming";
import { PipnexTradingSystem } from "./components/PipnexTradingSystem";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLogin = (data: { login: string; password: string; server: string }) => {
        console.log("Login data:", data);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    // Define navigation items
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

    return (
        <Router>
            <div className="bg-gray-900 text-white min-h-screen flex flex-col">
                {isAuthenticated ? (
                    <>
                        {/* Top Header */}
                        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/90 backdrop-blur-md border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
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

                        {/* Main Content (scrollable) */}
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

                        {/* Toast container */}
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
                    // Login page – no header/nav
                    <>
                        <LoginPage onLogin={handleLogin} />
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
                )}
            </div>
        </Router>
    );
}

export default App;
