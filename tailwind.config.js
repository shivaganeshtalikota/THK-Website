/** @type {import('tailwindcss').Config} */

/**
 * Design tokens.
 *
 * Party yellow (#FFD700) is a *surface* colour, never text — at ~1.6:1 on white
 * it fails WCAG badly. The brand scale splits that hue: 400/500 for fills,
 * 700/800 for anything that has to be legible as type.
 *
 * Type pairs a high-contrast serif for display with a neutral grotesque for
 * everything else. That contrast is what stops the page reading as a stock
 * component kit — a single geometric sans at three weights is the tell.
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
          700: '#9C7500', // 4.24:1 on white — LARGE text only
          800: '#6F5300', // 7.21:1 on white — safe for small text
          900: '#4A3700',
        },
        leaf: {
          50: '#F0FAF1',
          100: '#D7F2DC',
          400: '#4CAF54',
          600: '#1F7A34',
          700: '#166028',
          900: '#0B3315',
        },
        ink: {
          50: '#F8F8F7',
          100: '#EEEEEC',
          200: '#DEDEDA',
          300: '#C3C3BD',
          400: '#8C8C85',
          500: '#5F5F59',
          600: '#464641',
          700: '#333330',
          800: '#1F1F1D',
          900: '#141413',
          950: '#0A0A09',
        },
      },
      fontFamily: {
        // High-contrast serif for display moments.
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        // Neutral grotesque for UI, labels and body.
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        telugu: ['"Noto Sans Telugu"', '"Noto Sans"', 'sans-serif'],
      },
      fontSize: {
        // Wider scale contrast than a stock kit: the hero is genuinely large,
        // and labels are genuinely small, so hierarchy reads instantly.
        // Sized to the COLUMN, not the viewport. The hero is a split layout and
        // the text column is only ~501px at 1440 — at the old 6.4vw the name set
        // 720px wide and broke into three ragged lines, "Hari / Krishna /
        // Talikota". Measured: 81px is the largest that fits "Hari Krishna" on
        // one line there, so the curve is tuned to stay under it and the name
        // holds its intended two lines.
        hero: ['clamp(2.75rem, 1.1rem + 3.9vw, 5rem)', { lineHeight: '0.98', letterSpacing: '-0.03em', fontWeight: '800' }],
        display: ['clamp(2.5rem, 1.6rem + 4.2vw, 4.75rem)', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '700' }],
        title: ['clamp(1.9rem, 1.4rem + 2.2vw, 3.1rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        headline: ['clamp(1.3rem, 1.15rem + 0.7vw, 1.65rem)', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        lead: ['clamp(1.06rem, 1rem + 0.4vw, 1.28rem)', { lineHeight: '1.62' }],
        micro: ['0.7rem', { lineHeight: '1.2', letterSpacing: '0.16em', fontWeight: '600' }],
      },
      maxWidth: { prose: '64ch' },
      boxShadow: {
        card: '0 1px 2px rgba(10,10,9,0.04), 0 8px 24px -14px rgba(10,10,9,0.14)',
        lift: '0 2px 6px rgba(10,10,9,0.06), 0 28px 56px -24px rgba(10,10,9,0.30)',
        frame: '0 40px 80px -40px rgba(10,10,9,0.55)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'rise': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'slow-zoom': {
          from: { transform: 'scale(1.06)' },
          to: { transform: 'scale(1)' },
        },
        'wipe-up': {
          from: { clipPath: 'inset(100% 0 0 0)' },
          to: { clipPath: 'inset(0 0 0 0)' },
        },
      },
      animation: {
        rise: 'rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        // A slow settle on the hero photograph. 2.4s and only 6% — enough to
        // feel alive on load, not enough to read as a gimmick.
        'slow-zoom': 'slow-zoom 2.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'wipe-up': 'wipe-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
