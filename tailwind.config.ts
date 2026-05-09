import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium Primary - Luxury Blue
        primary: {
          50: '#e8f4fd',
          100: '#d1e9fc',
          200: '#b0d9f9',
          300: '#8cc2f6',
          400: '#5ca8f2',
          500: '#3b8eed',
          600: '#2b6be3',
          700: '#1f4dc7',
          800: '#183f9f',
          900: '#133582',
        },
        
        // Secondary - Elegant Purple
        secondary: {
          50: '#f5f0ff',
          100: '#ede0ff',
          200: '#e0c2ff',
          300: '#d099ff',
          400: '#c066ff',
          500: '#b33ce6',
          600: '#9e2bd6',
          700: '#8222b0',
          800: '#6b1e8f',
          900: '#571b75',
        },
        
        // Accent - Luxury Gold
        accent: {
          50: '#fefce8',
          100: '#fef9c7',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        
        // Dark Mode
        dark: {
          background: '#0a0a0a',
          surface: '#141414',
          card: '#1a1a1a',
          border: '#262626',
          text: '#e5e5e5',
          textSecondary: '#a3a3a3',
        },
        
        // Legacy colors for compatibility
        navy: '#0F1E3C',
        sky: {
          50: '#EFF6FF',
          500: '#2563EB',
          400: '#3B82F6',
        },
        teal: {
          50: '#F0FDFA',
          600: '#0D9488',
        },
        reward: {
          50: '#FEF3C7',
          500: '#F59E0B',
        },
        danger: {
          50: '#FFF1F2',
          600: '#E11D48',
          200: '#FECDD3',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#3B82F6',
          500: '#2563EB',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#0F1E3C',
        },
      },
      fontFamily: {
        heading: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 30, 60, 0.05)',
        lift: '0 10px 30px rgba(15, 30, 60, 0.08)',
        action: '0 8px 18px rgba(37, 99, 235, 0.16)',
        actionHover: '0 12px 24px rgba(37, 99, 235, 0.20)',
        premium: '0 4px 20px rgba(0, 0, 0, 0.08)',
        luxury: '0 8px 30px rgba(0, 0, 0, 0.12)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
