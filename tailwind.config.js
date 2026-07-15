/** @type {import('tailwindcss').Config} */

/**
 * Design tokens.
 *
 * The party yellow (#FFD700) is a *surface* colour, not a text colour — at
 * ~1.6:1 on white it fails WCAG badly. So the scale splits the brand in two:
 *   brand-400/500  -> fills, bars, badges (dark ink sits on top)
 *   brand-700/800  -> the same hue, dark enough to be legible AS text on white
 * Green is the party's second colour and earns a real slot here rather than
 * being dropped, which is what the previous all-yellow build did.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFFBEA',
          100: '#FFF3C4',
          200: '#FCE588',
          300: '#FADB5F',
          400: '#F7C948',
          500: '#FFD700', // the party yellow — surfaces only
          600: '#C99A00',
          700: '#9C7500', // 4.24:1 on white — LARGE text only, fails for small
          800: '#6F5300', // 7.21:1 on white — safe for small text
          900: '#4A3700',
        },
        leaf: {
          50: '#F0FAF1',
          100: '#D7F2DC',
          400: '#4CAF54',
          600: '#1F7A34', // 4.8:1 on white
          700: '#166028',
          900: '#0B3315',
        },
        ink: {
          50: '#F7F8F9',
          100: '#EDEFF2',
          200: '#DDE1E6',
          300: '#C2C8D0',
          400: '#8B94A1',
          500: '#5F6875',
          600: '#454D59',
          700: '#333A44',
          800: '#20252C',
          900: '#12161B',
          950: '#0A0D10',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid type — collapses the separate mobile overrides the old CSS needed.
        'display': ['clamp(2.5rem, 1.6rem + 4.5vw, 5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '800' }],
        'title': ['clamp(2rem, 1.5rem + 2.2vw, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline': ['clamp(1.35rem, 1.2rem + 0.8vw, 1.75rem)', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],
        'lead': ['clamp(1.05rem, 1rem + 0.4vw, 1.3rem)', { lineHeight: '1.65' }],
      },
      maxWidth: {
        prose: '68ch',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,22,27,0.04), 0 8px 24px -12px rgba(18,22,27,0.12)',
        lift: '0 2px 4px rgba(18,22,27,0.05), 0 20px 40px -16px rgba(18,22,27,0.20)',
        brand: '0 12px 32px -10px rgba(201,154,0,0.55)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
}
