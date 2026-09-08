// web/mt_nodejs/src/services/SocketBridgeApi.ts

import { apiRequest } from '../utils/apiClient';

// ─── Shared Type ──────────────────────────────────────────
interface Mt5Credentials {
    login: string;
    password: string;
    server: string;
    port?: number;
}

// ─── ORDER ────────────────────────────────────────────────
export const fetchOrderList = async (mt5: Mt5Credentials) => {
    return apiRequest({
        method: 'POST',  // Use POST so we can send credentials in the body
        url: '/mt5/orders/list',
        data: { mt5 },
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

export const postSendOrder = async (body: SendOrderRequest, mt5: Mt5Credentials) => {
    console.log("Posting send order...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/order',
        data: { ...body, mt5 },
    });
};

export interface CloseOrderRequest {
    ticket?: number;
}

export const closeSendOrder = async (body: CloseOrderRequest, mt5: Mt5Credentials) => {
    console.log("Posting close order...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/order/close',
        data: { ...body, mt5 },
    });
};

// ─── ACCOUNT ──────────────────────────────────────────────
export const fetchAccount = async (mt5: Mt5Credentials) => {
    console.log("Fetching account information...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/account',
        data: { mt5 },
    });
};

// ─── HISTORY ──────────────────────────────────────────────
export interface OrderHistoryParams {
    mode?: string;
    from_date?: string;
    to_date?: string;
}

export const fetchOrderHistory = async (params: OrderHistoryParams & { mt5: Mt5Credentials }) => {
    const { mt5, ...rest } = params;
    console.log("Fetching order history...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/history/orders',
        data: { ...rest, mt5 },
    });
};

export interface PriceHistoryParams {
    symbol?: string;
    time_frame?: string;
    from_date?: string;
    to_date?: string;
}

export const fetchPriceHistory = async (params: PriceHistoryParams & { mt5: Mt5Credentials }) => {
    const { mt5, ...rest } = params;
    console.log("Fetching price history...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/history/prices',
        data: { ...rest, mt5 },
    });
};

// ─── TRACK ──────────────────────────────────────────────────
export interface TrackPricesBody {
    symbol: string[];
}

export const postTrackPrices = async (body: TrackPricesBody, mt5: Mt5Credentials) => {
    console.log("Posting track prices...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/track/prices',
        data: { ...body, mt5 },
    });
};

export interface OhlcRequest {
    OHLC: OhlcEntry[];
}

export interface OhlcEntry {
    TIMEFRAME: string;
    SYMBOL: string;
    DEPTH: number;
}

export const postTrackOhlc = async (body: OhlcRequest, mt5: Mt5Credentials) => {
    console.log("Posting track ohlc...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/track/ohlc',
        data: { ...body, mt5 },
    });
};

export const postTrackMbook = async (body: TrackPricesBody, mt5: Mt5Credentials) => {
    console.log("Posting track mbook...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/track/mbook',
        data: { ...body, mt5 },
    });
};

export interface OrderEvents {
    enabled: string;
}

export const postTrackOrders = async (body: OrderEvents, mt5: Mt5Credentials) => {
    console.log("Posting track order events...");
    return apiRequest({
        method: 'POST',
        url: '/mt5/track/orders',
        data: { ...body, mt5 },
    });
};

// ─── QUOTE ──────────────────────────────────────────────────
export const getQuote = async (symbol: string, mt5: Mt5Credentials) => {
    console.log(`Fetching quote for symbol: ${symbol}`);
    return apiRequest({
        method: 'POST',
        url: '/mt5/quote',
        data: { symbol, mt5 },
    });
};
