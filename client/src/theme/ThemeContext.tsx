import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ColorProfile } from './chartColors';

// Define the type for our theme settings
export interface ThemeSettings {
  mode: 'light' | 'dark';
  colorProfile: ColorProfile;
}

// Define the context type
interface ThemeContextType {
  themeSettings: ThemeSettings;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setColorProfile: (profile: ColorProfile) => void;
  toggleThemeMode: () => void;
  theme: Theme; // The MUI theme object
}

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  themeSettings: { mode: 'light', colorProfile: 'standard' },
  setThemeMode: () => {},
  setColorProfile: () => {},
  toggleThemeMode: () => {},
  theme: createTheme(), // Default theme
});

// Hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme settings from localStorage or defaults
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    const savedSettings = localStorage.getItem('dentaMindThemeSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    // Check for system preference for dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
      mode: prefersDarkMode ? 'dark' : 'light',
      colorProfile: 'standard' as ColorProfile,
    };
  });
  
  // Create MUI theme based on settings
  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: themeSettings.mode,
      primary: {
        main: themeSettings.mode === 'dark' ? '#65FF65' : '#4cd94c', // Green
      },
      secondary: {
        main: themeSettings.mode === 'dark' ? '#9c64a6' : '#673ab7', // Purple
      },
      background: {
        default: themeSettings.mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: themeSettings.mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      // Add other palette settings as needed
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: themeSettings.mode === 'dark' ? '#1e1e1e' : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: themeSettings.mode === 'dark' ? '#555' : '#bbb',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: themeSettings.mode === 'dark' ? '#777' : '#999',
            },
          },
        },
      },
      // Add other component overrides as needed
    },
  }), [themeSettings.mode]);
  
  // Update theme settings in localStorage when they change
  useEffect(() => {
    localStorage.setItem('dentaMindThemeSettings', JSON.stringify(themeSettings));
    
    // Update the HTML data attribute for any CSS that might use it
    document.documentElement.setAttribute('data-theme-mode', themeSettings.mode);
    document.documentElement.setAttribute('data-color-profile', themeSettings.colorProfile);
    
    // Add/remove dark mode class for any global styling
    if (themeSettings.mode === 'dark') {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
    }
  }, [themeSettings]);
  
  // Set theme mode
  const setThemeMode = (mode: 'light' | 'dark') => {
    setThemeSettings(prevSettings => ({
      ...prevSettings,
      mode,
    }));
  };
  
  // Set color profile
  const setColorProfile = (colorProfile: ColorProfile) => {
    setThemeSettings(prevSettings => ({
      ...prevSettings,
      colorProfile,
    }));
  };
  
  // Toggle between light and dark mode
  const toggleThemeMode = () => {
    setThemeSettings(prevSettings => ({
      ...prevSettings,
      mode: prevSettings.mode === 'light' ? 'dark' : 'light',
    }));
  };
  
  // Create the context value
  const contextValue: ThemeContextType = {
    themeSettings,
    setThemeMode,
    setColorProfile,
    toggleThemeMode,
    theme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 