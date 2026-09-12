import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ─── Service Worker (with aggressive update check) ──────
if ('serviceWorker' in navigator) {
    // On load — register + check for updates
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ SW registered:', registration.scope);

            // Force an immediate update check (ignores HTTP cache)
            await registration.update();
            console.log('✅ SW update check done');

            // Check for updates every 30 seconds
            setInterval(() => {
                registration.update().catch(() => {});
            }, 30000);
        } catch (err) {
            console.warn('⚠ SW registration failed:', err);
        }
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
