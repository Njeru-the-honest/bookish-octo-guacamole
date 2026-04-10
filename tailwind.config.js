/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {

      // ── Font families ──────────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter',   'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },

      // ── Color tokens ───────────────────────────────────────────────
      colors: {

        // Surface system (tonal layering — no borders)
        surface: {
          DEFAULT: '#f7f9fb',   // page background
          low:     '#f2f4f6',   // sections / sidebar
          lowest:  '#ffffff',   // cards / modals
          high:    '#e6e8ea',   // hover / active states
          ghost:   'rgba(25,28,30,0.06)', // ghost borders
        },

        // Brand — USIU deep navy
        brand: {
          50:      '#e8eef7',
          100:     '#c5d3e8',
          200:     '#9fb5d6',
          300:     '#7896c4',
          400:     '#5c7eb7',
          500:     '#3f66aa',
          600:     '#003d82',
          700:     '#003366',   // primary
          800:     '#002a54',
          900:     '#001e40',   // darkest
          DEFAULT: '#003366',
        },

        // Semantic colors
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },

        // Ink — text colors (no pure black)
        ink: {
          DEFAULT: '#1a1d23',   // headings
          secondary: '#4a5568', // body
          tertiary:  '#718096', // captions
          disabled:  '#a0aec0', // disabled
        },
      },

      // ── Border radius ──────────────────────────────────────────────
      borderRadius: {
        'xs':  '4px',
        'sm':  '6px',
        'md':  '10px',
        'lg':  '14px',
        'xl':  '18px',
        '2xl': '24px',
        'pill':'9999px',
      },

      // ── Spacing extras ─────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
      },

      // ── Box shadows (elevation system) ────────────────────────────
      boxShadow: {
        // Tonal — used for cards (very subtle)
        'tonal-sm': '0 2px 8px -2px rgba(25,28,30,0.04)',
        'tonal':    '0 4px 16px -4px rgba(25,28,30,0.06)',
        'tonal-lg': '0 8px 24px -6px rgba(25,28,30,0.08)',

        // Elevated — used for modals and dropdowns only
        'modal':    '0 20px 40px -10px rgba(25,28,30,0.14)',
        'dropdown': '0 8px 24px -4px rgba(25,28,30,0.12)',

        // Brand glow — used for primary buttons
        'brand':    '0 4px 14px -2px rgba(0,51,102,0.30)',

        // None
        'none': 'none',
      },

      // ── Backdrop blur ──────────────────────────────────────────────
      backdropBlur: {
        'glass': '16px',
        'heavy': '24px',
      },

      // ── Transitions ────────────────────────────────────────────────
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },

      // ── Line height ────────────────────────────────────────────────
      lineHeight: {
        'tight':  '1.2',
        'snug':   '1.35',
        'normal': '1.5',
        'relaxed':'1.65',
      },

      // ── Letter spacing ─────────────────────────────────────────────
      letterSpacing: {
        'tighter': '-0.03em',
        'tight':   '-0.015em',
        'normal':  '0em',
        'wide':    '0.02em',
        'wider':   '0.05em',
        'widest':  '0.1em',
      },
    },
  },
  plugins: [],
}