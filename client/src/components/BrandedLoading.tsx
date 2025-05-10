import React from 'react';
import { Box, CircularProgress, Typography, Fade, useTheme, useMediaQuery } from '@mui/material';
import { BRANDING } from '../constants/branding';
import DentaMindLogo from '../components/dental/DentaMindLogo';

interface BrandedLoadingProps {
  message?: string;
  type?: 'fullscreen' | 'inline' | 'overlay';
  showLogo?: boolean;
  delay?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: {
    spinner: 24,
    logoWidth: 60,
    logoHeight: 60,
    spacing: 1,
    fontSize: 'body2',
  },
  medium: {
    spinner: 40,
    logoWidth: 80,
    logoHeight: 80,
    spacing: 2,
    fontSize: 'h6',
  },
  large: {
    spinner: 56,
    logoWidth: 120,
    logoHeight: 120,
    spacing: 3,
    fontSize: 'h5',
  },
};

export const BrandedLoading: React.FC<BrandedLoadingProps> = ({
  message = 'Loading...',
  type = 'inline',
  showLogo = true,
  delay = 300,
  size = 'medium',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dimensions = sizeMap[size];

  const getContainerStyles = () => {
    const baseStyles = {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(dimensions.spacing),
    };

    switch (type) {
      case 'fullscreen':
        return {
          ...baseStyles,
          position: 'fixed' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: BRANDING.colors.background,
          zIndex: 9999,
        };
      case 'overlay':
        return {
          ...baseStyles,
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `${BRANDING.colors.background}CC`,
          backdropFilter: 'blur(8px)',
          zIndex: 100,
        };
      default:
        return {
          ...baseStyles,
          padding: theme.spacing(dimensions.spacing),
        };
    }
  };

  const content = (
    <>
      {showLogo && (
        <Box mb={2}>
          <DentaMindLogo 
            width={dimensions.logoWidth} 
            height={dimensions.logoHeight} 
          />
        </Box>
      )}
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <CircularProgress
          size={dimensions.spinner}
          thickness={4}
          sx={{
            color: BRANDING.colors.primary,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.5,
              },
            },
          }}
        />
      </Box>
      <Typography
        variant={dimensions.fontSize as any}
        component="div"
        sx={{
          color: BRANDING.colors.secondary,
          opacity: 0.9,
          fontFamily: BRANDING.fonts.secondary,
          textAlign: 'center',
          maxWidth: '80%',
          animation: 'fadeInOut 2s ease-in-out infinite',
          '@keyframes fadeInOut': {
            '0%, 100%': {
              opacity: 0.9,
            },
            '50%': {
              opacity: 0.6,
            },
          },
        }}
      >
        {message}
      </Typography>
    </>
  );

  return (
    <Fade in timeout={delay}>
      <Box
        sx={getContainerStyles()}
        role="progressbar"
        aria-label={message}
        aria-busy="true"
      >
        {content}
      </Box>
    </Fade>
  );
}; 