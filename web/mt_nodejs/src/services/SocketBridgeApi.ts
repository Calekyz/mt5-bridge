import { apiRequest } from '../utils/apiClient';

// ─── ORDER ────────────────────────────────────────────────
export const fetchOrderList = async (baseUrl: string) => {
    return apiRequest({
        method: 'GET',
        url: '/v1/order/list',
        baseUrl,
    });
};

export interface SendOrderRequest {
    symbol?: string;
    volume?: number;
    order_type?: string;
    sl?: number;
    tp?: number;
    price?: number;
    magic?: number;
    type_filling: string;
    comment?: string;
}

export const postSendOrder = async (body: SendOrderRequest, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/order',
        data: body,
        baseUrl,
    });
};

export interface CloseOrderRequest {
    ticket?: number;
}

export const closeSendOrder = async (body: CloseOrderRequest, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/order/close',
        data: body,
        baseUrl,
    });
};

// ─── ACCOUNT (GET) ────────────────────────────────────────
export const fetchAccount = async (baseUrl: string) => {
    return apiRequest({
        method: 'GET',
        url: '/v1/account',
        baseUrl,
    });
};

// ─── HISTORY (GET with query params) ─────────────────────
export interface OrderHistoryParams {
    mode?: string;
    from_date?: string;
    to_date?: string;
}

export const fetchOrderHistory = async (params: OrderHistoryParams, baseUrl: string) => {
    const query = new URLSearchParams();
    if (params.mode) query.set('mode', params.mode);
    if (params.from_date) query.set('from_date', params.from_date);
    if (params.to_date) query.set('to_date', params.to_date);

    return apiRequest({
        method: 'GET',
        url: `/v1/history/orders?${query.toString()}`,
        baseUrl,
    });
};

export interface PriceHistoryParams {
    symbol?: string;
    time_frame?: string;
    from_date?: string;
    to_date?: string;
}

export const fetchPriceHistory = async (params: PriceHistoryParams, baseUrl: string) => {
    const query = new URLSearchParams();
    if (params.symbol) query.set('symbol', params.symbol);
    if (params.time_frame) query.set('time_frame', params.time_frame);
    if (params.from_date) query.set('from_date', params.from_date);
    if (params.to_date) query.set('to_date', params.to_date);

    return apiRequest({
        method: 'GET',
        url: `/v1/history/prices?${query.toString()}`,
        baseUrl,
    });
};

// ─── TRACK (POST) ──────────────────────────────────────────
export const postTrackPrices = async (body: { symbol: string[] }, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/track/prices',
        data: body,
        baseUrl,
    });
};

export const postTrackOhlc = async (body: any, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/track/ohlc',
        data: body,
        baseUrl,
    });
};

export const postTrackMbook = async (body: { symbol: string[] }, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/track/mbook',
        data: body,
        baseUrl,
    });
};

export const postTrackOrders = async (body: { enabled: string }, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/track/orders',
        data: body,
        baseUrl,
    });
};

// ─── QUOTE (GET) ──────────────────────────────────────────
export const getQuote = async (symbol: string, baseUrl: string) => {
    return apiRequest({
        method: 'GET',
        url: `/v1/quote?symbol=${encodeURIComponent(symbol)}`,
        baseUrl,
    });
};

// ─── GLOBAL SET (POST) – for Start Algo ───────────────────
export const setGlobalVariable = async (name: string, value: any, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/global/set',
        data: {
            name,
            value: typeof value === 'boolean' ? (value ? 1 : 0) : value,
        },
        baseUrl,
    });
};
