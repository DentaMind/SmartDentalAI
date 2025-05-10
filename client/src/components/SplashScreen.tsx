import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Fade, useMediaQuery, useTheme, CircularProgress } from '@mui/material';
import { BRANDING } from '../constants/branding';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const VideoErrorMessages: Record<number, string> = {
  1: 'The video loading was aborted',
  2: 'Network error while loading video',
  3: 'Video decoding error',
  4: 'Video not supported'
};

export const SplashScreen: React.FC<SplashScreenProps> = React.memo(({ onAnimationComplete }) => {
  const [showTagline, setShowTagline] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const taglineTimer = setTimeout(() => setShowTagline(true), 1000);
    return () => clearTimeout(taglineTimer);
  }, []);

  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true);
    setTimeout(onAnimationComplete, 500);
  }, [onAnimationComplete]);

  const handleVideoError = useCallback((e: Event) => {
    const videoElement = e.target as HTMLVideoElement;
    const errorCode = videoElement.error?.code || 0;
    console.error(`Video loading error: ${VideoErrorMessages[errorCode] || 'Unknown error'}`);

    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      videoElement.load();
    } else {
      setVideoError(true);
      setShowTagline(true);
      setTimeout(onAnimationComplete, 2000);
    }
  }, [retryCount, onAnimationComplete]);

  const handleVideoLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const getContentSize = () => {
    if (isMobile) return { width: '90%', maxHeight: '40vh' };
    if (isTablet) return { width: '80%', maxHeight: '45vh' };
    return { width: '100%', maxHeight: '50vh' };
  };

  const contentSize = getContentSize();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: BRANDING.colors.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        p: isMobile ? 2 : 4,
      }}
    >
      <Fade in={!videoEnded} timeout={500}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '1200px',
            width: '100%',
            position: 'relative',
          }}
        >
          {isLoading && !videoError && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1,
              }}
            >
              <CircularProgress size={40} thickness={4} />
            </Box>
          )}

          {!videoError ? (
            <video
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              onLoadStart={handleVideoLoadStart}
              onCanPlay={handleVideoCanPlay}
              style={{
                width: contentSize.width,
                maxHeight: contentSize.maxHeight,
                objectFit: 'contain',
                opacity: isLoading ? 0.3 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
            >
              <source src={BRANDING.splashAnimation} type="video/mp4" />
              <img
                src={BRANDING.logo.full}
                alt={BRANDING.name}
                loading="lazy"
                style={{
                  width: contentSize.width,
                  maxHeight: contentSize.maxHeight,
                  objectFit: 'contain',
                }}
              />
            </video>
          ) : (
            <Fade in timeout={800}>
              <img
                src={BRANDING.logo.full}
                alt={BRANDING.name}
                loading="lazy"
                style={{
                  width: contentSize.width,
                  maxHeight: contentSize.maxHeight,
                  objectFit: 'contain',
                }}
              />
            </Fade>
          )}

          <Fade in={showTagline} timeout={1000}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              align="center"
              sx={{
                mt: isMobile ? 2 : 4,
                px: 2,
                fontFamily: BRANDING.fonts.secondary,
                color: BRANDING.colors.secondary,
                opacity: 0.9,
                maxWidth: '600px',
                wordBreak: 'break-word',
                animation: showTagline ? 'fadeInUp 0.8s ease-out' : 'none',
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  to: {
                    opacity: 0.9,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              {BRANDING.tagline}
            </Typography>
          </Fade>
        </Box>
      </Fade>
    </Box>
  );
}); 