import { apiRequest } from '../utils/apiClient';

interface Mt5Credentials {
    login: string;
    password: string;
    server: string;
    port?: number;
    vps_address?: string;
}

// ─── ORDER ────────────────────────────────────────────────
export const fetchOrderList = async (mt5: Mt5Credentials) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/order/list',
        data: { mt5 },
        baseUrl: mt5.vps_address,
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
    return apiRequest({
        method: 'POST',
        url: '/v1/order',
        data: { ...body, mt5 },
        baseUrl: mt5.vps_address,
    });
};

export interface CloseOrderRequest {
    ticket?: number;
}

export const closeSendOrder = async (body: CloseOrderRequest, mt5: Mt5Credentials) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/order/close',
        data: { ...body, mt5 },
        baseUrl: mt5.vps_address,
    });
};

// ─── ACCOUNT ──────────────────────────────────────────────
export const fetchAccount = async (mt5: Mt5Credentials) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/account',
        data: { mt5 },
        baseUrl: mt5.vps_address,
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
    return apiRequest({
        method: 'POST',
        url: '/v1/history/orders',
        data: { ...rest, mt5 },
        baseUrl: mt5.vps_address,
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
    return apiRequest({
        method: 'POST',
        url: '/v1/history/prices',
        data: { ...rest, mt5 },
        baseUrl: mt5.vps_address,
    });
};

// ─── TRACK ──────────────────────────────────────────────────
export interface TrackPricesBody {
    symbol: string[];
}

export const postTrackPrices = async (body: TrackPricesBody, mt5: Mt5Credentials) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/track/prices',
        data: { ...body, mt5 },
        baseUrl: mt5.vps_address,
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
    return apiRequest({
        method: 'POST',
        url: '/v1/track/ohlc',
        data: { ...body, mt5 },
        baseUrl: mt5.vps_address,
    });
};

export const postTrackMbook = async (body: TrackPricesBody, mt5: Mt5Credentials) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/track/mbook',
        data: { ...body, mt5 },
        baseUrl: mt5.vps_address,
    });
};

export interface OrderEvents {
    enabled: string;
}

export const postTrackOrders = async (body: OrderEvents, mt5: Mt5Credentials) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/track/orders',
        data: { ...body, mt5 },
        baseUrl: mt5.vps_address,
    });
};

// ─── QUOTE ──────────────────────────────────────────────────
export const getQuote = async (symbol: string, mt5: Mt5Credentials) => {
    return apiRequest({
        method: 'POST',
        url: '/v1/quote',
        data: { symbol, mt5 },
        baseUrl: mt5.vps_address,
    });
};
