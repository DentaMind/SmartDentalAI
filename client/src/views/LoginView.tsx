import React, { useState } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { BRANDING } from '../constants/branding';
import { BrandedLoading } from '../components/BrandedLoading';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login - replace with actual auth
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1500);
  };

  if (isLoading) {
    return (
      <BrandedLoading
        type="overlay"
        message="Signing you in..."
        size="medium"
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${BRANDING.colors.primary}22 0%, ${BRANDING.colors.background} 100%)`,
        padding: theme.spacing(3),
      }}
    >
      <Box
        component="img"
        src={BRANDING.logo.full}
        alt={BRANDING.name}
        sx={{
          width: isMobile ? '200px' : '240px',
          height: 'auto',
          marginBottom: theme.spacing(4),
        }}
      />

      <Card
        elevation={4}
        sx={{
          padding: theme.spacing(4),
          width: '100%',
          maxWidth: '400px',
          borderRadius: theme.shape.borderRadius * 2,
          background: `${BRANDING.colors.background}F0`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{
            marginBottom: theme.spacing(3),
            fontFamily: BRANDING.fonts.secondary,
            color: BRANDING.colors.secondary,
          }}
        >
          Welcome Back
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            variant="outlined"
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: BRANDING.colors.primary,
                },
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: BRANDING.colors.primary,
                },
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              marginTop: theme.spacing(3),
              backgroundColor: BRANDING.colors.primary,
              fontFamily: BRANDING.fonts.primary,
              '&:hover': {
                backgroundColor: `${BRANDING.colors.primary}DD`,
              },
            }}
          >
            Sign In
          </Button>
        </form>

        <Typography
          variant="body2"
          align="center"
          sx={{
            marginTop: theme.spacing(2),
            color: BRANDING.colors.secondary + '99',
          }}
        >
          {BRANDING.tagline}
        </Typography>
      </Card>
    </Box>
  );
}; 