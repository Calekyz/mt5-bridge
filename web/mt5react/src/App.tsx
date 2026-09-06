import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ---- Existing Components ----
import AccountInfo from "./components/AccountInfo";
import OrderRequest from "./components/OrderRequest";
import { OrdersList } from "./components/OrderList";
import OrderHistory from "./components/OrderHistory";
import { CandleChart } from "./components/CandleStickChartComp";
import WsStreaming from "./components/WsStreaming";
import { PipnexTradingSystem } from "./components/PipnexTradingSystem";

// ---- New Components ----
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLogin = (data: { login: string; password: string; server: string }) => {
        console.log("Login data:", data);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    return (
        <Router>
            <div className="bg-gray-900 text-white min-h-screen">
                {isAuthenticated && (
                    <nav className="fixed left-0 top-0 h-full w-16 md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col items-center md:items-start p-4 space-y-2 overflow-y-auto z-50">
                        <div className="text-2xl font-bold mb-6 text-center w-full text-blue-400">📊</div>
                        <Link to="/" className="w-full py-2 px-3 rounded hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white flex items-center gap-3">
                            <span className="text-lg">🏠</span>
                            <span className="hidden md:inline">Home</span>
                        </Link>
                        <Link to="/orders" className="w-full py-2 px-3 rounded hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white flex items-center gap-3">
                            <span className="text-lg">📋</span>
                            <span className="hidden md:inline">Orders</span>
                        </Link>
                        <Link to="/request" className="w-full py-2 px-3 rounded hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white flex items-center gap-3">
                            <span className="text-lg">✏️</span>
                            <span className="hidden md:inline">Trade</span>
                        </Link>
                        <Link to="/account" className="w-full py-2 px-3 rounded hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white flex items-center gap-3">
                            <span className="text-lg">👤</span>
                            <span className="hidden md:inline">Account</span>
                        </Link>
                        <Link to="/history" className="w-full py-2 px-3 rounded hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white flex items-center gap-3">
                            <span className="text-lg">📜</span>
                            <span className="hidden md:inline">History</span>
                        </Link>
                        <Link to="/chart" className="w-full py-2 px-3 rounded hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white flex items-center gap-3">
                            <span className="text-lg">📈</span>
                            <span className="hidden md:inline">Chart</span>
                        </Link>
                        <Link to="/ws" className="w-full py-2 px-3 rounded hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white flex items-center gap-3">
                            <span className="text-lg">🔌</span>
                            <span className="hidden md:inline">WS</span>
                        </Link>
                        <Link to="/strategies" className="w-full py-2 px-3 rounded hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white flex items-center gap-3">
                            <span className="text-lg">🚀</span>
                            <span className="hidden md:inline">Strategies</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="mt-auto w-full py-2 px-3 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition text-sm flex items-center gap-3"
                        >
                            <span className="text-lg">🚪</span>
                            <span className="hidden md:inline">Logout</span>
                        </button>
                    </nav>
                )}

                <main className={isAuthenticated ? "ml-16 md:ml-64 p-4" : "p-0"}>
                    <Routes>
                        <Route path="/login" element={
                            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
                        } />
                        <Route path="/" element={
                            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
                        } />
                        <Route path="/orders" element={
                            isAuthenticated ? <OrdersList /> : <Navigate to="/login" replace />
                        } />
                        <Route path="/request" element={
                            isAuthenticated ? <OrderRequest /> : <Navigate to="/login" replace />
                        } />
                        <Route path="/account" element={
                            isAuthenticated ? <AccountInfo /> : <Navigate to="/login" replace />
                        } />
                        <Route path="/history" element={
                            isAuthenticated ? <OrderHistory /> : <Navigate to="/login" replace />
                        } />
                        <Route path="/chart" element={
                            isAuthenticated ? <CandleChart /> : <Navigate to="/login" replace />
                        } />
                        <Route path="/ws" element={
                            isAuthenticated ? <WsStreaming /> : <Navigate to="/login" replace />
                        } />
                        <Route path="/strategies" element={
                            isAuthenticated ? <PipnexTradingSystem /> : <Navigate to="/login" replace />
                        } />
                    </Routes>
                </main>

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
            </div>
        </Router>
    );
}

export default App;
