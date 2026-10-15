/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
          subtle: 'var(--card-subtle)',
        },
        border: 'var(--border)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        primary: {
          DEFAULT: '#14B8A6', // Sentra Teal
          hover: '#0D9488',
          subtle: '#0F766E',
          foreground: '#0B0F14',
        },
        accent: {
          teal: '#14B8A6',
          cyan: '#06B6D4',
          emerald: '#10B981',
        },
        severity: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#3B82F6',
          info: '#64748B',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-teal': '0 0 18px -2px rgba(20, 184, 166, 0.35)',
        'glow-critical': '0 0 16px -2px rgba(239, 68, 68, 0.35)',
        'glow-high': '0 0 16px -2px rgba(249, 115, 22, 0.3)',
      },
    },
  },
  plugins: [],
}
