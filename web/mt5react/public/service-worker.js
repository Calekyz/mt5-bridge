// Service Worker for PipTrader AI PWA
// IMPORTANT: Never cache HTML — always fetch fresh from network.

const CACHE_NAME = 'piptrader-v2'; // Bumped version → old cache cleared

// ─── Install ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installing v2...');
    self.skipWaiting();
});

// ─── Activate — delete ALL old caches ─────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating, clearing old caches...');
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((name) => {
                    console.log('[SW] Deleting cache:', name);
                    return caches.delete(name);
                })
            )
        ).then(() => self.clients.claim())
    );
});

// ─── Fetch — network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;
    if (url.pathname.startsWith('/v1/')) return;
    if (url.origin !== self.location.origin) return;

    // ⚠️ NEVER cache HTML
    if (
        event.request.headers.get('accept')?.includes('text/html') ||
        url.pathname === '/' ||
        url.pathname.endsWith('.html')
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache-first for assets (JS, CSS, images)
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request).then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            }).catch(() => cached);

            return cached || fetchPromise;
        })
    );
});

// ─── Push Notification Handler ───────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'PipTrader AI', body: event.data.text() };
    }

    const options = {
        body: payload.body || '',
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        tag: payload.tag,
        data: payload.data || {},
        requireInteraction: payload.requireInteraction || false,
        vibrate: [200, 100, 200],
    };

    event.waitUntil(
        self.registration.showNotification(payload.title || 'PipTrader AI', options)
    );
});

// ─── Notification Click Handler ──────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = self.location.origin + '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
