import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchSchemaStats, fetchRecentChanges } from '@/api/schema';

interface SchemaStats {
  total_event_types: number;
  total_schema_versions: number;
  evolved_schemas: number;
  recent_changes_24h: number;
}

interface RecentChange {
  event_type: string;
  version: number;
  timestamp: string;
  change_type: 'new' | 'update' | 'deactivate';
}

const StatCard: React.FC<{ title: string; value: number; subtitle?: string }> = ({
  title,
  value,
  subtitle
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h3" component="div">
        {value.toLocaleString()}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export const SchemaOverview: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<SchemaStats | null>(null);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, changesData] = await Promise.all([
          fetchSchemaStats(),
          fetchRecentChanges()
        ]);
        setStats(statsData);
        setRecentChanges(changesData);
        setError(null);
      } catch (err) {
        setError('Failed to load schema monitoring data');
        console.error('Schema monitoring error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Schema Health Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Event Types"
            value={stats.total_event_types}
            subtitle="Unique event categories"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Schema Versions"
            value={stats.total_schema_versions}
            subtitle="Total versions tracked"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Evolved Schemas"
            value={stats.evolved_schemas}
            subtitle="Types with multiple versions"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Changes"
            value={stats.recent_changes_24h}
            subtitle="Changes in last 24h"
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Schema Evolution Trend
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentChanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="version" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Schema Changes
          </Typography>
          <Box sx={{ mt: 2 }}>
            {recentChanges.map((change, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1">
                    {change.event_type}
                    <Chip
                      size="small"
                      label={`v${change.version}`}
                      sx={{ ml: 1 }}
                      color="primary"
                    />
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(change.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  label={change.change_type}
                  color={
                    change.change_type === 'new'
                      ? 'success'
                      : change.change_type === 'update'
                      ? 'warning'
                      : 'error'
                  }
                  size="small"
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}; 