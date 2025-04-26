import React from 'react';
import { Grid, Container } from '@mui/material';
import { AlertPanel } from '../components/alerts/AlertPanel';
import { MetricsPanel } from '../components/metrics/MetricsPanel';
import { ActivityFeed } from '../components/activity/ActivityFeed';

export const FounderDashboard: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Alerts Section */}
        <Grid item xs={12}>
          <AlertPanel />
        </Grid>
        
        {/* Metrics Section */}
        <Grid item xs={12} md={8}>
          <MetricsPanel />
        </Grid>
        
        {/* Activity Feed */}
        <Grid item xs={12} md={4}>
          <ActivityFeed />
        </Grid>
      </Grid>
    </Container>
  );
}; 