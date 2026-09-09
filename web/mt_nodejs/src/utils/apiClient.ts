import axios, { AxiosRequestConfig, Method } from 'axios';

const BASE_URL = process.env.MT5_BRIDGE_URL || 'http://51.75.104.231:8890';

interface ApiRequestOptions {
    method: Method;
    url: string;
    data?: any;
    params?: any;
}

export const apiRequest = async <T = any>(options: ApiRequestOptions): Promise<T> => {
    try {
        const config: AxiosRequestConfig = {
            method: options.method,
            url: `${BASE_URL}${options.url}`,
            data: options.data,
            params: options.params,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const response = await axios(config);
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
