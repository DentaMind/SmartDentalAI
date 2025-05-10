import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Button,
  Link,
  Divider,
  IconButton,
  useTheme as useMuiTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import DentaMindLogo from '../components/dental/DentaMindLogo';

/**
 * DentaMind Login Page
 */
const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const { themeSettings } = useTheme();
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useAuth();

  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    
    // Simple validation
    if (!email) {
      setFormError('Email is required');
      return;
    }
    if (!password) {
      setFormError('Password is required');
      return;
    }
    
    try {
      const success = await login(email, password);
      if (success) {
        // Redirect to the page they were trying to access, or dashboard
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  // Fill in demo credentials
  const fillDemoCredentials = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmail('demo@dentamind.com');
    setPassword('password123');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'black',
        backgroundImage: 'radial-gradient(circle at 50% 70%, #111 0%, #000 100%)',
        backgroundSize: 'cover',
        position: 'relative',
      }}
    >
      {/* Header with navigation */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2
        }}
      >
        <IconButton 
          component={RouterLink} 
          to="/" 
          sx={{ color: 'white' }}
          aria-label="Back to home"
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="text" 
            sx={{ color: 'white' }}
            component={RouterLink}
            to="/login"
          >
            Login
          </Button>
          <Button 
            variant="outlined" 
            sx={{ 
              borderColor: 'white', 
              color: 'white',
              '&:hover': {
                borderColor: '#65FF65',
                color: '#65FF65'
              }
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Box>
      
      {/* Main content area */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          flexGrow: 1,
          py: 4 
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 4
          }}
        >
          <DentaMindLogo />
          <Typography 
            variant="h5" 
            sx={{ 
              color: 'white', 
              fontWeight: 300,
              textAlign: 'center',
              fontStyle: 'italic'
            }}
          >
            SIMPLIFYING COMPLEXITY IN EVERY CASE
          </Typography>
        </Box>
        
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(18, 18, 18, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(101, 255, 101, 0.1)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              color: 'white', 
              mb: 3,
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            Welcome Back
          </Typography>
          
          {(error || formError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError || error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#65FF65',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#65FF65',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                backgroundColor: '#65FF65',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#4cd94c',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(101, 255, 101, 0.3)',
                  color: 'rgba(0, 0, 0, 0.5)'
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link 
                href="#" 
                onClick={fillDemoCredentials}
                sx={{
                  color: '#65FF65',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Use demo credentials
              </Link>
            </Box>
            
            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Typography variant="body2" align="center" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Don't have an account?{' '}
              <Link 
                component={RouterLink} 
                to="/signup"
                sx={{
                  color: '#65FF65',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Footer */}
      <Box 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.8rem'
        }}
      >
        &copy; {new Date().getFullYear()} DentaMind Technologies. All rights reserved.
      </Box>
      
      {/* Background glow effect */}
      <Box 
        sx={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(101, 255, 101, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
          zIndex: 1,
          pointerEvents: 'none'
        }} 
      />
    </Box>
  );
};

export default Login; 