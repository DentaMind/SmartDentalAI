import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { SystemMetrics } from './SystemMetrics';
import { EventFlow } from './EventFlow';
import { StorageStats } from './StorageStats';
import { LearningMetrics } from './LearningMetrics';
import { AlertsOverview } from './AlertsOverview';
import { ScalingReadiness } from './ScalingReadiness';
import { fetchSystemHealth } from '@/api/system';

const FounderDashboard: React.FC = () => {
  const theme = useTheme();

  // Fetch overall system health metrics
  const {
    data: healthMetrics,
    isLoading,
    error
  } = useQuery(['systemHealth'], fetchSystemHealth, {
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading system health data</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Founder Control Center
      </Typography>

      <Grid container spacing={3}>
        {/* System Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <SystemMetrics
              uptime={healthMetrics.uptime}
              cpuUsage={healthMetrics.cpu_usage}
              memoryUsage={healthMetrics.memory_usage}
              activeUsers={healthMetrics.active_users}
            />
          </Paper>
        </Grid>

        {/* Event Flow */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <EventFlow
              eventStats={healthMetrics.event_stats}
              validationRate={healthMetrics.validation_rate}
            />
          </Paper>
        </Grid>

        {/* Storage Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <StorageStats
              dbSize={healthMetrics.storage.db_size}
              mediaSize={healthMetrics.storage.media_size}
              backupStatus={healthMetrics.storage.backup_status}
            />
          </Paper>
        </Grid>

        {/* Learning Metrics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <LearningMetrics
              modelAccuracy={healthMetrics.learning.model_accuracy}
              datasetGrowth={healthMetrics.learning.dataset_growth}
              retrainingStatus={healthMetrics.learning.retraining_status}
            />
          </Paper>
        </Grid>

        {/* Alerts Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <AlertsOverview
              activeAlerts={healthMetrics.alerts.active}
              recentAlerts={healthMetrics.alerts.recent}
            />
          </Paper>
        </Grid>

        {/* Scaling Readiness */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <ScalingReadiness
              metrics={healthMetrics.scaling}
              recommendations={healthMetrics.scaling_recommendations}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FounderDashboard; 