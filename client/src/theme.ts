/**
 * DentaMind Design Tokens
 * 
 * This file defines all design tokens used throughout the application.
 * It serves as the single source of truth for the DentaMind design system.
 */

// Brand Color Palette
export const colors = {
  // Primary brand colors
  primary: {
    main: '#65FF65', // Neon green
    dark: '#4cd94c', // Darker green for hover states
    light: '#a3ffa3', // Lighter green for backgrounds
    transparent: 'rgba(101, 255, 101, 0.15)', // Transparent green for overlays
  },

  // Background colors
  background: {
    dark: '#0d0d0d', // Near black
    medium: '#1a1a1a', // Dark gray
    light: '#2a2a2a', // Medium gray
    overlay: 'rgba(13, 13, 13, 0.95)', // Overlay for modals
    page: '#f9f9f9', // Light background for pages
    card: '#ffffff', // Card background
  },

  // Text colors
  text: {
    light: '#ffffff', // White
    dark: '#000000', // Black
    muted: '#a0a0a0', // Muted text
    primary: '#65FF65', // Primary text (same as brand)
  },
  
  // Accent colors (semantic)
  semantic: {
    success: '#00c853', // Success green
    warning: '#ffab00', // Warning orange
    error: '#ff4d4f', // Error red
    info: '#0288d1', // Info blue
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #65FF65 0%, #4cd94c 100%)',
    dark: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
    sidebar: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
    header: 'linear-gradient(90deg, #0d0d0d 0%, #1a1a1a 100%)',
  },

  // Gray scale
  gray: {
    50: '#f9f9f9',
    100: '#f1f1f1',
    200: '#e2e2e2',
    300: '#d0d0d0',
    400: '#adadad',
    500: '#8a8a8a',
    600: '#636363',
    700: '#4a4a4a',
    800: '#313131',
    900: '#1a1a1a',
  },
};

// Typography scale
export const typography = {
  fontFamily: {
    primary: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    heading: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    monospace: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing system
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  40: '10rem',   // 160px
  48: '12rem',   // 192px
  56: '14rem',   // 224px
  64: '16rem',   // 256px
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Fully rounded (circle for squares)
};

// Shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  brand: '0 4px 14px 0 rgba(101, 255, 101, 0.1)',
  'brand-lg': '0 10px 25px -5px rgba(101, 255, 101, 0.1), 0 8px 10px -6px rgba(101, 255, 101, 0.05)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Transitions
export const transitions = {
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
};

// Animation variants for consistent motion
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { transform: 'translateY(10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideDown: {
    from: { transform: 'translateY(-10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.7 },
  },
};

// Breakpoints
export const breakpoints = {
  xs: '0px',
  sm: '600px',
  md: '960px',
  lg: '1280px',
  xl: '1920px',
};

// Component-specific tokens
export const components = {
  button: {
    paddingX: {
      sm: spacing[2],
      md: spacing[4],
      lg: spacing[6],
    },
    paddingY: {
      sm: spacing[1],
      md: spacing[2],
      lg: spacing[3],
    },
    borderRadius: borderRadius.default,
  },
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    boxShadow: shadows.default,
  },
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
    borderRadius: borderRadius.default,
    borderColor: colors.gray[300],
    focusBorderColor: colors.primary.main,
  }
};

// Export the complete theme
const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  transitions,
  animations,
  breakpoints,
  components,
};

export default theme; 

export const darkTheme = {
  colors: {
    text: "#FFFFFF",
    textPrimary: "#FFFFFF",
    textSecondary: "#E0E0E0",
    textMuted: "#A0A0A0",
  },
}; 