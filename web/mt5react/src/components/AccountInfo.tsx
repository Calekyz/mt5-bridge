import React, { useState } from "react";
import { getAccount, type Account } from "../api/nodejsApiClient";
import { usePolling } from "../hooks/usePolling";

const AccountInfo: React.FC = () => {
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccount = async () => {
        try {
            setLoading(true);
            const data = await getAccount();
            setAccount(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch account");
        } finally {
            setLoading(false);
        }
    };

    // Poll every 2 seconds
    usePolling(fetchAccount, 2000);

    if (loading && !account) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-white text-xl">Loading account info...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-red-500 text-xl">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">Account Information</h2>
                    <p className="text-blue-100 text-sm">Live data - refreshes every 2 seconds</p>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Login</div>
                        <div className="text-white text-xl font-bold">{account?.login}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Name</div>
                        <div className="text-white text-xl font-bold truncate">{account?.name}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Balance</div>
                        <div className="text-green-400 text-xl font-bold">${account?.balance?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Equity</div>
                        <div className="text-blue-400 text-xl font-bold">${account?.equity?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Leverage</div>
                        <div className="text-white text-xl font-bold">{account?.leverage || "N/A"}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Server</div>
                        <div className="text-white text-xl font-bold truncate">{account?.server || "N/A"}</div>
                    </div>
                </div>
                <div className="px-6 py-3 bg-gray-700/30 text-gray-400 text-xs flex justify-between">
                    <span>🟢 Live</span>
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    );
};

export default AccountInfo;
