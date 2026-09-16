/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─── Custom animations used across the app ───────────
      keyframes: {
        // Loader spinner (slower, smoother)
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Loader inner ring (opposite direction)
        'spin-reverse': {
          '0%':   { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        // Soft pulse for logos / dots
        'pulse-soft': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(0.95)' },
        },
        // Gradient shimmer for brand text
        'shimmer': {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        // Loading dots bounce
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'translateY(0)',     opacity: '0.5' },
          '40%':           { transform: 'translateY(-8px)',  opacity: '1'   },
        },
        // Toast / popup slide-in (used by QuantumAICard, Telegram popup)
        'slide-in-bottom': {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        // Fade-in helper
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'spin-slow':      'spin-slow 2.5s linear infinite',
        'spin-reverse':   'spin-reverse 2s linear infinite',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
        'shimmer':        'shimmer 3s linear infinite',
        'bounce-dot':     'bounce-dot 1.4s ease-in-out infinite',
        'slide-in-bottom':'slide-in-bottom 0.5s ease-out',
        'fade-in':        'fade-in 0.5s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
