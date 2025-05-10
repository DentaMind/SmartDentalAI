import React from 'react';
import { IconButton, Tooltip, Box, useMediaQuery } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '../../theme/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  showLabel?: boolean;
}

/**
 * Theme Toggle component for switching between light and dark modes
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'medium', 
  showTooltip = true,
  showLabel = false
}) => {
  const { themeSettings, toggleThemeMode } = useTheme();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // Determine icon size based on prop
  const iconSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';
  
  // Get tooltip text
  const tooltipText = themeSettings.mode === 'light' 
    ? 'Switch to Dark Mode' 
    : 'Switch to Light Mode';
  
  // Handle theme toggle
  const handleToggle = () => {
    toggleThemeMode();
  };
  
  // The button element
  const toggleButton = (
    <IconButton 
      onClick={handleToggle} 
      color="inherit" 
      aria-label={tooltipText}
      size={size === 'large' ? 'large' : 'medium'}
      sx={{
        p: size === 'small' ? 0.5 : 1,
        backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        '&:hover': {
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        borderRadius: '50%',
        transition: 'background-color 0.3s ease',
      }}
    >
      {themeSettings.mode === 'dark' ? (
        <Brightness7Icon fontSize={iconSize} />
      ) : (
        <Brightness4Icon fontSize={iconSize} />
      )}
    </IconButton>
  );
  
  // If showing label, wrap in a Box with the label
  if (showLabel) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {toggleButton}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {themeSettings.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Box>
      </Box>
    );
  }
  
  // If showing tooltip, wrap in Tooltip
  if (showTooltip) {
    return (
      <Tooltip title={tooltipText}>
        {toggleButton}
      </Tooltip>
    );
  }
  
  // Otherwise just return the button
  return toggleButton;
};

export default ThemeToggle; 