import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── ASTRA Core Palette ──────────────────────────────────────
        astra: {
          navy:     '#07152F', // primary background
          midnight: '#000C35', // deep background
          cyan:     '#35D6E8', // primary accent / interactive
          blue:     '#38B6FF', // secondary accent / links
          teal:     '#19C7A5', // success / confirmed
          mint:     '#2DD4BF', // positive indicators
          coral:    '#FF5A67', // emergency / urgent
          red:      '#ED3631', // alerts / critical
          warning:  '#FFD166', // caution / stale data
          white:    '#F4F7FB', // text / surfaces
          muted:    '#9AAAC2', // secondary text / borders
        },
        // ── Semantic Aliases ─────────────────────────────────────────
        surface: {
          primary:   '#07152F',
          secondary: '#0D1F45',
          elevated:  '#112050',
          deep:      '#000C35',
        },
        text: {
          primary:   '#F4F7FB',
          secondary: '#9AAAC2',
          inverse:   '#07152F',
          disabled:  '#4A5A78',
        },
        accent: {
          primary:   '#35D6E8',
          secondary: '#38B6FF',
        },
        status: {
          success:  '#19C7A5',
          warning:  '#FFD166',
          critical: '#FF5A67',
          danger:   '#ED3631',
          info:     '#38B6FF',
        },
        verification: {
          verified:      '#19C7A5',
          'self-reported': '#38B6FF',
          inferred:      '#FFD166',
          stale:         '#FF5A67',
        },
        border: {
          DEFAULT: '#1E2E50',
          muted:   '#152040',
          accent:  '#35D6E8',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.5rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],
      },

      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
      },

      borderRadius: {
        sm:   '0.25rem',
        DEFAULT: '0.375rem',
        md:   '0.5rem',
        lg:   '0.75rem',
        xl:   '1rem',
        '2xl': '1.25rem',
      },

      boxShadow: {
        card:    '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        elevated:'0 4px 12px 0 rgba(0,0,0,0.5)',
        modal:   '0 20px 40px 0 rgba(0,0,0,0.7)',
        glow:    '0 0 16px rgba(53,214,232,0.25)',
        'glow-coral': '0 0 16px rgba(255,90,103,0.3)',
        'glow-teal':  '0 0 16px rgba(25,199,165,0.25)',
      },

      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':       'fadeIn 0.2s ease-out',
        'slide-in-up':   'slideInUp 0.25s ease-out',
        'slide-in-right':'slideInRight 0.25s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },

      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}

export default config
