/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1675FF',
          600: '#0F62DC',
          700: '#0b4ebd',
          800: '#0d3f94',
          900: '#0f3674',
        },
        light: {
          bg: '#F5F8FF',
          sidebar: '#EEF3FF',
          card: '#FFFFFF',
          cardSecondary: '#F8FAFF',
          border: '#DFE7F5',
          textPrimary: '#10172F',
          textSecondary: '#536487',
          textMuted: '#8493B2',
        },
        dark: {
          bg: '#0B1120',
          sidebar: '#101827',
          card: '#182238',
          cardSecondary: '#1D2A45',
          border: '#293750',
          borderSubtle: '#1E2C44',
          textPrimary: '#F5F7FF',
          textSecondary: '#A6B4D4',
          textMuted: '#6B7C9E',
        },
        status: {
          green: '#0BC58C',
          greenLight: '#E6FAF3',
          purple: '#8B5CF6',
          purpleLight: '#F3E8FF',
          orange: '#FF9F2E',
          orangeLight: '#FFF4E6',
          red: '#FF525E',
          redLight: '#FEECEC',
          blue: '#1675FF',
          blueLight: '#EAF2FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: ['14px', { lineHeight: '20px' }],
        sm: ['16px', { lineHeight: '24px' }],
        base: ['18px', { lineHeight: '28px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['22px', { lineHeight: '32px' }],
        '2xl': ['26px', { lineHeight: '36px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
        '4xl': ['38px', { lineHeight: '1' }],
        '5xl': ['50px', { lineHeight: '1' }],
        '6xl': ['62px', { lineHeight: '1' }],
        '7xl': ['74px', { lineHeight: '1' }],
        '8xl': ['98px', { lineHeight: '1' }],
        '9xl': ['130px', { lineHeight: '1' }],
      },
      boxShadow: {
        'card-light': '0 2px 10px rgba(16, 23, 47, 0.04), 0 1px 3px rgba(16, 23, 47, 0.02)',
        'card-hover': '0 8px 24px rgba(22, 117, 255, 0.08)',
        'card-dark': '0 4px 20px rgba(0, 0, 0, 0.35)',
        'glow-blue': '0 0 20px rgba(22, 117, 255, 0.35)',
      },
      borderRadius: {
        'panel': '14px',
        'subtle': '10px',
      }
    },
  },
  plugins: [],
}
