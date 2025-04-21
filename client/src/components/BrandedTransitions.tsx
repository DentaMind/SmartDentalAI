import React, { useCallback, useEffect, useState } from 'react';
import { Box, Fade, Slide, useTheme, useMediaQuery } from '@mui/material';
import { BRANDING } from '../constants/branding';

interface TransitionState {
  from: 'splash' | 'login' | 'dashboard' | 'ai' | null;
  to: 'splash' | 'login' | 'dashboard' | 'ai' | null;
}

interface BrandedTransitionsProps {
  children: React.ReactNode;
  currentView: 'splash' | 'login' | 'dashboard' | 'ai';
  isAnimating?: boolean;
  onTransitionComplete?: () => void;
}

const viewLabels: Record<string, string> = {
  splash: 'Loading DentaMind',
  login: 'Login Screen',
  dashboard: 'Main Dashboard',
  ai: 'AI Assistant View'
};

export const BrandedTransitions: React.FC<BrandedTransitionsProps> = React.memo(({
  children,
  currentView,
  isAnimating = false,
  onTransitionComplete
}) => {
  const [transition, setTransition] = useState<TransitionState>({ from: null, to: null });
  const [isExiting, setIsExiting] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const handleTransitionEnd = useCallback(() => {
    setIsExiting(false);
    setTransition({ from: null, to: null });
    onTransitionComplete?.();
  }, [onTransitionComplete]);

  useEffect(() => {
    if (isAnimating) {
      setTransition(prev => ({
        from: prev.to || 'splash',
        to: currentView
      }));
      setIsExiting(true);
    }
  }, [currentView, isAnimating]);

  const getTransitionStyles = useCallback(() => {
    const baseStyles = {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: BRANDING.colors.background,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      willChange: 'transform, opacity',
    };

    if (prefersReducedMotion) {
      return {
        ...baseStyles,
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.1s',
      };
    }

    // Custom transitions based on state changes
    switch (`${transition.from}-${transition.to}`) {
      case 'splash-login':
        return {
          ...baseStyles,
          transform: isExiting ? 'scale(1.1)' : 'scale(1)',
          opacity: isExiting ? 0 : 1,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        };
      case 'login-dashboard':
        return {
          ...baseStyles,
          transform: `translateY(${isExiting ? '-100%' : '0'})`,
          transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        };
      case 'dashboard-ai':
        return {
          ...baseStyles,
          transform: `translateX(${isExiting ? '-100%' : '0'})`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        };
      default:
        return {
          ...baseStyles,
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        };
    }
  }, [transition, isExiting, prefersReducedMotion]);

  const getBrandedBackground = useCallback(() => {
    switch (currentView) {
      case 'login':
        return {
          background: `linear-gradient(135deg, ${BRANDING.colors.primary}22 0%, ${BRANDING.colors.background} 100%)`,
        };
      case 'dashboard':
        return {
          background: BRANDING.colors.background,
          boxShadow: `inset 0 0 50px ${BRANDING.colors.primary}11`,
        };
      case 'ai':
        return {
          background: `linear-gradient(45deg, ${BRANDING.colors.background} 0%, ${BRANDING.colors.primary}05 100%)`,
        };
      default:
        return {
          background: BRANDING.colors.background,
        };
    }
  }, [currentView]);

  return (
    <Box
      role="region"
      aria-label={`${viewLabels[currentView]} View`}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...getBrandedBackground(),
      }}
    >
      <Fade 
        in={!isExiting} 
        timeout={prefersReducedMotion ? 0 : 500} 
        onExited={handleTransitionEnd}
      >
        <Box 
          sx={getTransitionStyles()}
          role="presentation"
        >
          <Slide 
            direction="up" 
            in={!isExiting} 
            timeout={prefersReducedMotion ? 0 : 700}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                padding: isMobile ? theme.spacing(2) : theme.spacing(4),
              }}
            >
              {children}
            </Box>
          </Slide>
        </Box>
      </Fade>
    </Box>
  );
}); 