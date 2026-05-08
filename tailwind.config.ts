import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
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
        heading: ['Sora', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 30, 60, 0.05)',
        lift: '0 10px 30px rgba(15, 30, 60, 0.08)',
        action: '0 8px 18px rgba(37, 99, 235, 0.16)',
        actionHover: '0 12px 24px rgba(37, 99, 235, 0.20)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
