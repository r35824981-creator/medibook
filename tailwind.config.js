import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        ink: 'var(--text-primary)',
        muted: {
          DEFAULT: 'var(--text-muted)',
          soft: 'var(--muted-soft)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
        },
        nav: {
          active: 'var(--nav-active-bg)',
          text: 'var(--nav-active-text)',
        },
        line: 'var(--border-default)',
        error: {
          DEFAULT: 'var(--state-error)',
          soft: 'var(--error-soft)',
        },
        success: {
          DEFAULT: 'var(--state-success)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--state-warning)',
          soft: 'var(--warning-soft)',
        },
        critical: {
          DEFAULT: 'var(--state-critical)',
          soft: 'var(--critical-soft)',
        },
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
          6: 'var(--chart-6)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-in-left': 'slide-in-left 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 160ms ease-out',
        'page-in': 'page-in 240ms ease-out',
      },
    },
  },
  plugins: [animate],
}
