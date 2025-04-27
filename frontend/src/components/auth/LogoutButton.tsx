import React from 'react';
import { useUserEvents } from '@/hooks/useUserEvents';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { Button } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';

export const LogoutButton: React.FC = () => {
  const { logout, user, sessionId } = useAuth();
  const router = useRouter();
  const {
    collectUserLogout,
    collectUserSessionEnded
  } = useUserEvents();

  const handleLogout = async () => {
    try {
      if (user && sessionId) {
        // Collect session end event
        await collectUserSessionEnded(user.id, sessionId, {
          source: 'user',
          deviceInfo: navigator.userAgent
        });

        // Collect logout event
        await collectUserLogout(user.id, {
          source: 'user',
          sessionId,
          deviceInfo: navigator.userAgent
        });
      }

      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      startIcon={<LogoutOutlined />}
      color="inherit"
    >
      Logout
    </Button>
  );
}; 