// ─────────────────────────────────────────────────────────
//  SELF-HEALING SERVICE WORKER
//  Purpose: Clear any old broken caches, unregister self,
//           then re-register cleanly on the next visit.
// ─────────────────────────────────────────────────────────

const CACHE_NAME = 'piptrader-v3';

// Install — activate immediately, don't wait
self.addEventListener('install', (event) => {
    console.log('[SW] Installing v3 (self-healing)...');
    self.skipWaiting();
});

// Activate — wipe ALL old caches, then reload all open tabs
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating — wiping old caches...');
    event.waitUntil(
        (async () => {
            // 1. Delete EVERY cache (old broken ones included)
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => {
                console.log('[SW] Deleting cache:', name);
                return caches.delete(name);
            }));

            // 2. Claim all clients (take control of open tabs)
            await self.clients.claim();

            // 3. Force every open tab to reload with fresh HTML/CSS
            const clients = await self.clients.matchAll({ type: 'window' });
            for (const client of clients) {
                console.log('[SW] Reloading client:', client.url);
                client.navigate(client.url);
            }
        })()
    );
});

// Fetch — NEVER cache HTML, cache assets normally
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;
    if (url.pathname.startsWith('/v1/')) return;
    if (url.origin !== self.location.origin) return;

    // HTML — always fresh from network (fixes stale CSS issue forever)
    if (
        event.request.headers.get('accept')?.includes('text/html') ||
        url.pathname === '/' ||
        url.pathname.endsWith('.html')
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Assets — cache-first with background update
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request).then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => cached);

            return cached || fetchPromise;
        })
    );
});

// Push notification handler
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

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = self.location.origin + '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});
