/**
 * WebSocket Service — for live streaming prices, OHLC, orderbook
 * from the EA's WebSocket endpoint.
 */

export interface WsMessage {
    type: 'prices' | 'ohlc' | 'mbook' | 'orders' | string;
    data: any;
}

type MessageHandler = (message: WsMessage) => void;

export class WsService {
    private socket: WebSocket | null = null;
    private handlers: Map<string, Set<MessageHandler>> = new Map();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private url: string;
    private shouldReconnect: boolean = true;

    constructor(url: string) {
        this.url = url;
    }

    connect() {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        try {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                console.log('[WS] Connected to', this.url);
                this.emit('open', { type: 'open', data: null });
            };

            this.socket.onmessage = (event) => {
                try {
                    const message: WsMessage = JSON.parse(event.data);
                    this.emit(message.type, message);
                    this.emit('*', message); // wildcard listeners
                } catch (err) {
                    console.warn('[WS] Failed to parse message:', err);
                }
            };

            this.socket.onerror = (err) => {
                console.error('[WS] Error:', err);
                this.emit('error', { type: 'error', data: err });
            };

            this.socket.onclose = () => {
                console.log('[WS] Disconnected');
                this.emit('close', { type: 'close', data: null });

                if (this.shouldReconnect) {
                    this.reconnectTimer = setTimeout(() => {
                        console.log('[WS] Reconnecting...');
                        this.connect();
                    }, 3000);
                }
            };
        } catch (err) {
            console.error('[WS] Failed to connect:', err);
        }
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    send(message: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('[WS] Cannot send — socket not open');
        }
    }

    on(messageType: string, handler: MessageHandler) {
        if (!this.handlers.has(messageType)) {
            this.handlers.set(messageType, new Set());
        }
        this.handlers.get(messageType)!.add(handler);

        // Return unsubscribe function
        return () => {
            this.handlers.get(messageType)?.delete(handler);
        };
    }

    private emit(messageType: string, message: WsMessage) {
        const handlers = this.handlers.get(messageType);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(message);
                } catch (err) {
                    console.error('[WS] Handler error:', err);
                }
            });
        }
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}
