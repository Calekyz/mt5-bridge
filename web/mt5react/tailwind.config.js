/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // ─── Loader animations ────────────────────────
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-reverse': {
          '0%':   { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(0.95)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'translateY(0)',    opacity: '0.5' },
          '40%':           { transform: 'translateY(-8px)', opacity: '1'   },
        },

        // ─── Popup / card reveal (replaces tailwindcss-animate) ──
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-bottom': {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-in-top': {
          '0%':   { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      animation: {
        'spin-slow':       'spin-slow 2.5s linear infinite',
        'spin-reverse':    'spin-reverse 2s linear infinite',
        'pulse-soft':      'pulse-soft 2s ease-in-out infinite',
        'shimmer':         'shimmer 3s linear infinite',
        'bounce-dot':      'bounce-dot 1.4s ease-in-out infinite',
        'fade-in':         'fade-in 0.5s ease-out',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out',
        'slide-in-top':    'slide-in-top 0.5s ease-out',
        'scale-in':        'scale-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
