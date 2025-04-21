import { createTheme } from '@mui/material/styles';
import { BRANDING } from './constants/branding';

export const theme = createTheme({
  palette: {
    primary: {
      main: BRANDING.colors.primary,
    },
    secondary: {
      main: BRANDING.colors.secondary,
    },
    background: {
      default: BRANDING.colors.background,
      paper: BRANDING.colors.background,
    },
  },
  typography: {
    fontFamily: BRANDING.fonts.primary,
    h1: {
      fontFamily: BRANDING.fonts.secondary,
    },
    h2: {
      fontFamily: BRANDING.fonts.secondary,
    },
    h3: {
      fontFamily: BRANDING.fonts.secondary,
    },
    h4: {
      fontFamily: BRANDING.fonts.secondary,
    },
    h5: {
      fontFamily: BRANDING.fonts.secondary,
    },
    h6: {
      fontFamily: BRANDING.fonts.secondary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
}); 