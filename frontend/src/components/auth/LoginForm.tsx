import React, { useState } from 'react';
import { useUserEvents } from '@/hooks/useUserEvents';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper
} from '@mui/material';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const router = useRouter();
  const {
    collectUserLogin,
    collectUserSessionStarted
  } = useUserEvents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { user, sessionId } = await login(email, password);
      
      // Collect login event
      await collectUserLogin(user.id, {
        source: 'user',
        sessionId,
        deviceInfo: navigator.userAgent
      });

      // Collect session start event
      await collectUserSessionStarted(user.id, sessionId, {
        source: 'user',
        ipAddress: window.location.hostname,
        deviceInfo: navigator.userAgent
      });

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  return (
    <Box
      component={Paper}
      sx={{
        p: 4,
        maxWidth: 400,
        mx: 'auto',
        mt: 8
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        Login to SmartDental AI
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
        >
          Login
        </Button>
      </form>
    </Box>
  );
}; 