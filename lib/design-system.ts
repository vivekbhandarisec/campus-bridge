// Premium Design System for CampusBridge
// Luxury-inspired color palette with sophisticated gradients and refined typography

export const colors = {
  // Primary - Premium Blue
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
  
  // Neutral - Sophisticated Gray
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Success - Premium Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Dark Mode Colors
  darkMode: {
    background: '#0a0a0a',
    surface: '#141414',
    card: '#1a1a1a',
    border: '#262626',
    text: '#e5e5e5',
    textSecondary: '#a3a3a3',
  },
};

export const gradients = {
  // Premium Blue Gradient
  primary: 'linear-gradient(135deg, #3b8eed 0%, #1f4dc7 100%)',
  
  // Elegant Purple Gradient
  secondary: 'linear-gradient(135deg, #b33ce6 0%, #8222b0 100%)',
  
  // Luxury Gold Gradient
  accent: 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
  
  // Subtle Background Gradient
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  
  // Dark Mode Gradient
  darkBackground: 'linear-gradient(180deg, #0a0a0a 0%, #141414 100%)',
  
  // Glass Gradient
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  
  // Premium Card Gradient
  card: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
  
  // Dark Card Gradient
  darkCard: 'linear-gradient(135deg, #1a1a1a 0%, #141414 100%)',
};

export const shadows = {
  // Premium Shadow
  premium: '0 4px 20px rgba(0, 0, 0, 0.08)',
  
  // Soft Shadow
  soft: '0 2px 8px rgba(0, 0, 0, 0.06)',
  
  // Luxury Shadow
  luxury: '0 8px 30px rgba(0, 0, 0, 0.12)',
  
  // Glass Shadow
  glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
  
  // Subtle Shadow
  subtle: '0 1px 3px rgba(0, 0, 0, 0.04)',
};

export const typography = {
  // Font Families
  sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  serif: ['Playfair Display', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  
  // Font Sizes
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  
  // Font Weights
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  
  // Line Heights
  tight: 1.25,
  standard: 1.5,
  relaxed: 1.75,
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
};

export const transitions = {
  fast: '150ms ease-in-out',
  medium: '300ms ease-in-out',
  slow: '500ms ease-in-out',
  bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  dark: {
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  premium: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
};
