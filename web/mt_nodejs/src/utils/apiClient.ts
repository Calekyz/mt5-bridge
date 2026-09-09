import axios, { Method } from 'axios';

interface ApiRequestOptions {
    method: Method;
    url: string;
    data?: any;
    params?: any;
    baseUrl?: string;
}

export const apiRequest = async <T = any>(options: ApiRequestOptions): Promise<T> => {
    const baseUrl = options.baseUrl || process.env.MT5_BRIDGE_URL || 'http://51.75.104.231:8890';
    try {
        const response = await axios({
            method: options.method,
            url: `${baseUrl}${options.url}`,
            data: options.data,
            params: options.params,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data?.error || error.response.data?.message || `API error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error('No response from bridge server. Check VPS and EA status.');
        } else {
            throw new Error(error.message || 'Unknown API error');
        }
    }
};
