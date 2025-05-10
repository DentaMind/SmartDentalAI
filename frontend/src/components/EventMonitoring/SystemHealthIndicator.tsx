import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { HealthResponse } from '@/types/events';

interface Props {
  health: HealthResponse;
}

export const SystemHealthIndicator: React.FC<Props> = ({ health }) => {
  const getHealthStatus = () => {
    if (health.is_healthy) {
      return {
        label: 'Healthy',
        color: 'success' as const,
        icon: <CheckCircleIcon />
      };
    }
    
    // Warning if we have events but high error rate
    if (health.last_hour_events > 0 && health.last_hour_errors > 0) {
      return {
        label: 'Warning',
        color: 'warning' as const,
        icon: <WarningIcon />
      };
    }
    
    // Error if no events or all errors
    return {
      label: 'Error',
      color: 'error' as const,
      icon: <ErrorIcon />
    };
  };

  const status = getHealthStatus();

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <Chip
          icon={status.icon}
          label={status.label}
          color={status.color}
          size="large"
        />
      </Box>
      
      <Box>
        <Typography variant="body2" color="text.secondary">
          Last Hour:
        </Typography>
        <Typography variant="h6">
          {health.last_hour_events.toLocaleString()} events
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Current Rate:
        </Typography>
        <Typography variant="h6">
          {health.events_per_minute.toFixed(1)} events/min
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Error Rate:
        </Typography>
        <Typography variant="h6" color={health.last_hour_errors > 0 ? 'error.main' : 'inherit'}>
          {health.last_hour_errors > 0
            ? `${((health.last_hour_errors / health.last_hour_events) * 100).toFixed(1)}%`
            : '0%'}
        </Typography>
      </Box>
    </Box>
  );
}; 