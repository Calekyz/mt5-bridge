import { apiRequest } from '../utils/apiClient';

// ─── ORDER ────────────────────────────────────────────────
export const fetchOrderList = async (baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/order/list',
        data: {},
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

// ─── ACCOUNT ──────────────────────────────────────────────
export const fetchAccount = async (baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/account',
        data: {},
        baseUrl,
    });
};

// ─── HISTORY ──────────────────────────────────────────────
export interface OrderHistoryParams {
    mode?: string;
    from_date?: string;
    to_date?: string;
}

export const fetchOrderHistory = async (params: OrderHistoryParams, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/history/orders',
        data: params,
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
    return apiRequest({
        method: 'POST',
        url: '/v1/history/prices',
        data: params,
        baseUrl,
    });
};

// ─── TRACK ──────────────────────────────────────────────────
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

// ─── QUOTE ──────────────────────────────────────────────────
export const getQuote = async (symbol: string, baseUrl: string) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/quote',
        data: { symbol },
        baseUrl,
    });
};
