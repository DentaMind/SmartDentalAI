import React, { useEffect, useState } from 'react';
import { Card, Grid, Typography, Box, CircularProgress } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

import { fetchEventStats, fetchEventHealth } from '@/api/events';
import { EventStats, HealthResponse } from '@/types/events';
import { SystemHealthIndicator } from './SystemHealthIndicator';
import { EventTypeDistribution } from './EventTypeDistribution';
import { ErrorRateGraph } from './ErrorRateGraph';
import { LiveEventCounter } from './LiveEventCounter';

const REFRESH_INTERVAL = 10000; // 10 seconds

export const EventDashboard: React.FC = () => {
  // Fetch event statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['eventStats'],
    queryFn: fetchEventStats,
    refetchInterval: REFRESH_INTERVAL,
  });

  // Fetch system health
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['eventHealth'],
    queryFn: fetchEventHealth,
    refetchInterval: REFRESH_INTERVAL,
  });

  if (statsLoading || healthLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Event System Monitor
      </Typography>

      {/* System Health Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <SystemHealthIndicator health={health} />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Live Event Rate
              </Typography>
              <LiveEventCounter stats={stats} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Event Volume (24h)
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.hourly_volumes || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Event Type Distribution
              </Typography>
              <EventTypeDistribution stats={stats} />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Error Rate Timeline
              </Typography>
              <ErrorRateGraph stats={stats} />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 