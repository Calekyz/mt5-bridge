import axios, { Method } from 'axios';

interface ApiRequestOptions {
    method: Method;
    url: string;
    data?: any;
    params?: any;
    baseUrl?: string;
}

export const apiRequest = async <T = any>(options: ApiRequestOptions): Promise<T> => {
    // ✅ Do NOT fall back to a hardcoded VPS. Throw a clear error instead.
    if (!options.baseUrl) {
        throw new Error('No VPS address provided. Please contact admin to assign your VPS.');
    }

    const baseUrl = options.baseUrl.replace(/\/$/, ''); // trim trailing slash

    try {
        const response = await axios({
            method: options.method,
            url: `${baseUrl}${options.url}`,
            data: options.data,
            params: options.params,
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(
                error.response.data?.error ||
                error.response.data?.message ||
                `API error: ${error.response.status}`
            );
        } else if (error.request) {
            throw new Error(`No response from VPS at ${baseUrl}. Check EA is running.`);
        } else {
            throw new Error(error.message || 'Unknown API error');
        }
    }
};
