import { useState, useEffect } from 'react';
import { getAccount, type Account } from '../api/nodejsApiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8891/v1';

export function useAccount() {
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccount = async () => {
        try {
            const data = await getAccount();
            setAccount(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccount();
        const interval = setInterval(fetchAccount, 2000);
        return () => clearInterval(interval);
    }, []);

    return { account, loading, error, refetch: fetchAccount };
}

export async function sendCommand(command: string, value: any) {
    try {
        const res = await fetch(`${API_URL}/global/set`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: command, value }),
        });
        if (!res.ok) throw new Error('Failed to send command');
        return await res.json();
    } catch (err) {
        console.error('Command error:', err);
        throw err;
    }
}
