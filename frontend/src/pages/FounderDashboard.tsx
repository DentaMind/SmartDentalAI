import React from 'react';
import { Grid, Container, Box, Typography, Divider } from '@mui/material';
import { AlertPanel } from '../components/alerts/AlertPanel';
import { MetricsPanel } from '../components/metrics/MetricsPanel';
import { ActivityFeed } from '../components/activity/ActivityFeed';
import { FeatureFlagManager } from '../components/feature-flags/FeatureFlagManager';

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
        
        {/* Feature Flag Management */}
        <Grid item xs={12}>
          <Box mt={4}>
            <Typography variant="h5" gutterBottom>
              System Management
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <FeatureFlagManager />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}; 