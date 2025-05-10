import React, { createContext, useContext, useState, useEffect } from 'react';

// Import logo variants
import LogoFull from '../../assets/branding/LogoFull';
import LogoIcon from '../../assets/branding/LogoIcon';
import LogoText from '../../assets/branding/LogoText';

// Import theme tokens
import theme from '../../theme';

// Theme mode type
export type ThemeMode = 'light' | 'dark';

// Brand color definitions for light and dark modes
export const brandColors = {
  // Primary brand colors (same in both modes)
  primary: theme.colors.primary.main,
  primaryDark: theme.colors.primary.dark, 
  primaryLight: theme.colors.primary.light,
  primaryTransparent: theme.colors.primary.transparent,

  // Mode-dependent colors
  dark: {
    // Background colors
    bgDark: theme.colors.background.dark,
    bgMedium: theme.colors.background.medium,
    bgLight: theme.colors.background.light,
    bgOverlay: theme.colors.background.overlay,
    bgPage: theme.colors.gray[900],
    bgCard: theme.colors.gray[800],
    
    // Text colors
    textPrimary: theme.colors.text.light,
    textSecondary: theme.colors.text.muted,
    textMuted: theme.colors.gray[500],
    
    // Border colors
    borderColor: theme.colors.gray[700],
    dividerColor: theme.colors.gray[700],
  },
  
  light: {
    // Background colors
    bgDark: theme.colors.gray[900],
    bgMedium: theme.colors.gray[800],
    bgLight: theme.colors.gray[100],
    bgOverlay: 'rgba(255, 255, 255, 0.95)',
    bgPage: theme.colors.gray[50],
    bgCard: theme.colors.background.card,
    
    // Text colors
    textPrimary: theme.colors.text.dark,
    textSecondary: theme.colors.gray[700],
    textMuted: theme.colors.gray[500],
    
    // Border colors
    borderColor: theme.colors.gray[200],
    dividerColor: theme.colors.gray[200],
  },
  
  // Accent colors (semantic) - same in both modes
  success: theme.colors.semantic.success,
  warning: theme.colors.semantic.warning,
  error: theme.colors.semantic.error,
  info: theme.colors.semantic.info,
  
  // Gradient definitions
  gradientPrimary: theme.colors.gradients.primary,
  gradientDark: theme.colors.gradients.dark,
};

// Font definitions
export const fontFamilies = {
  primary: "'Inter', sans-serif",
  secondary: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
};

// Spacing scale
export const spacing = theme.spacing;

// Typography styles
export const typography = {
  h1: 'text-3xl font-bold tracking-tight md:text-4xl',
  h2: 'text-2xl font-bold tracking-tight md:text-3xl',
  h3: 'text-xl font-semibold md:text-2xl',
  h4: 'text-lg font-semibold md:text-xl',
  h5: 'text-base font-medium md:text-lg',
  h6: 'text-sm font-medium md:text-base',
  base: 'text-base',
  small: 'text-sm',
  xs: 'text-xs',
  lead: 'text-xl',
  subtitle: 'text-lg text-opacity-80',
  muted: 'text-sm text-opacity-60',
};

// Card variants
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'highlighted';

// Brand button variants
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

// Logo component
export type LogoType = 'full' | 'icon' | 'text';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const Logo = ({
  type = 'full',
  size = 'md',
  invertColors = false,
  className = '',
}: {
  type?: LogoType;
  size?: LogoSize;
  invertColors?: boolean;
  className?: string;
}) => {
  // Get brand context
  const { colors, mode } = useBrand();
  
  // Map size to pixel values
  const sizeMap = {
    xs: { iconSize: 24, fontSize: 16 },
    sm: { iconSize: 32, fontSize: 18 },
    md: { iconSize: 40, fontSize: 22 },
    lg: { iconSize: 48, fontSize: 26 },
    xl: { iconSize: 64, fontSize: 32 },
  };
  
  const { iconSize, fontSize } = sizeMap[size];
  
  // Determine color based on mode and invert option
  const logoColor = invertColors ? colors.textPrimary : colors.primary;
  
  // Render appropriate logo variant
  switch (type) {
    case 'icon':
      return <LogoIcon size={iconSize} color={logoColor} className={className} />;
    case 'text':
      return <LogoText size={fontSize} color={logoColor} className={className} />;
    case 'full':
    default:
      return <LogoFull iconSize={iconSize} fontSize={fontSize} color={logoColor} className={className} />;
  }
};

// Helper function to get contrast text color
export const getContrastText = (color: string) => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Get mode-specific colors
const getModeColors = (mode: ThemeMode) => {
  return {
    ...brandColors,
    ...brandColors[mode],
  };
};

// Brand context type
interface BrandContextType {
  colors: ReturnType<typeof getModeColors>;
  fonts: typeof fontFamilies;
  spacing: typeof spacing;
  typography: typeof typography;
  Logo: typeof Logo;
  getContrastText: typeof getContrastText;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

// Create context with default values
const BrandContext = createContext<BrandContextType>({
  colors: getModeColors('dark'), // Default to dark mode
  fonts: fontFamilies,
  spacing,
  typography,
  Logo,
  getContrastText,
  mode: 'dark',
  setMode: () => {},
  toggleMode: () => {},
});

// Hook for easy access to brand assets
export const useBrand = () => useContext(BrandContext);

interface BrandProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

// Provider component
export const BrandProvider: React.FC<BrandProviderProps> = ({ 
  children,
  initialMode = 'dark'
}) => {
  // State for current theme mode
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  
  // Toggle between light and dark mode
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'dark' ? 'light' : 'dark');
  };
  
  // Apply theme class to document body
  useEffect(() => {
    // Remove any existing theme classes
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    
    // Add appropriate theme class
    document.documentElement.classList.add(`${mode}-mode`);
    
    // Update data-theme attribute for components that might use it
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);
  
  const value = {
    colors: getModeColors(mode),
    fonts: fontFamilies,
    spacing,
    typography,
    Logo,
    getContrastText,
    mode,
    setMode,
    toggleMode,
  };
  
  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};

export default BrandProvider; 