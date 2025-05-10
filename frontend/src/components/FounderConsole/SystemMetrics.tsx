import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

interface SystemMetricsProps {
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  activeUsers: number;
}

const MetricProgress: React.FC<{
  value: number;
  label: string;
  warning?: number;
  critical?: number;
}> = ({ value, label, warning = 70, critical = 90 }) => {
  const theme = useTheme();
  
  const getColor = (value: number) => {
    if (value >= critical) return theme.palette.error.main;
    if (value >= warning) return theme.palette.warning.main;
    return theme.palette.success.main;
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="textPrimary">
          {value}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            backgroundColor: getColor(value),
            borderRadius: 4
          }
        }}
      />
    </Box>
  );
};

export const SystemMetrics: React.FC<SystemMetricsProps> = ({
  uptime,
  cpuUsage,
  memoryUsage,
  activeUsers
}) => {
  const theme = useTheme();
  
  const systemHealthy = cpuUsage < 80 && memoryUsage < 80;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          System Health
        </Typography>
        {systemHealthy ? (
          <Tooltip title="System Healthy">
            <HealthyIcon color="success" />
          </Tooltip>
        ) : (
          <Tooltip title="System Under Load">
            <WarningIcon color="warning" />
          </Tooltip>
        )}
        <Tooltip title="Refresh Metrics">
          <IconButton size="small" sx={{ ml: 1 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Uptime
          </Typography>
          <Typography variant="h6">
            {formatDistanceToNow(Date.now() - uptime * 1000)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Active Users
          </Typography>
          <Typography variant="h6">{activeUsers}</Typography>
        </Grid>
      </Grid>
      
      <MetricProgress
        value={cpuUsage}
        label="CPU Usage"
        warning={70}
        critical={90}
      />
      
      <MetricProgress
        value={memoryUsage}
        label="Memory Usage"
        warning={75}
        critical={85}
      />
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          System Status
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            borderRadius: 1,
            bgcolor: systemHealthy
              ? theme.palette.success.light
              : theme.palette.warning.light
          }}
        >
          {systemHealthy ? (
            <HealthyIcon
              sx={{ mr: 1, color: theme.palette.success.main }}
            />
          ) : (
            <WarningIcon
              sx={{ mr: 1, color: theme.palette.warning.main }}
            />
          )}
          <Typography
            variant="body2"
            color={
              systemHealthy
                ? theme.palette.success.main
                : theme.palette.warning.main
            }
          >
            {systemHealthy
              ? 'All Systems Operational'
              : 'System Under High Load'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SystemMetrics; 