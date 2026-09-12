// ─────────────────────────────────────────────────────────
//  SELF-DESTRUCT SERVICE WORKER
//  This file kills itself and clears all caches, then
//  permanently unregisters so the browser uses fresh files.
// ─────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            // 1. Delete ALL caches
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
            console.log('[SW] All caches cleared');

            // 2. Unregister this service worker itself
            const registration = await self.registration.unregister();
            console.log('[SW] Self-unregistered:', registration);

            // 3. Reload all open tabs with fresh content
            const clients = await self.clients.matchAll({ type: 'window' });
            for (const client of clients) {
                client.navigate(client.url);
            }
        })()
    );
});
