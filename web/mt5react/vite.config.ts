import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8002,
    host: '0.0.0.0',
    proxy: {
      // Proxy API calls to the Node backend during dev
      '/v1': {
        target: 'http://localhost:8891',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8891',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
