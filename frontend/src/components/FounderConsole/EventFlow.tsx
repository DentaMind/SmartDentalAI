import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  useTheme,
  Grid,
  Chip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';

interface EventStats {
  total_events: number;
  events_per_second: number;
  validation_success_rate: number;
  event_types: {
    name: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  hourly_stats: {
    hour: string;
    count: number;
    errors: number;
  }[];
}

interface EventFlowProps {
  eventStats: EventStats;
  validationRate: number;
}

export const EventFlow: React.FC<EventFlowProps> = ({
  eventStats,
  validationRate
}) => {
  const theme = useTheme();
  
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return null;
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Event Flow Monitor
      </Typography>
      
      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            Total Events
          </Typography>
          <Typography variant="h6">
            {eventStats.total_events.toLocaleString()}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            Events/Second
          </Typography>
          <Typography variant="h6">
            {eventStats.events_per_second.toFixed(1)}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            Validation Rate
          </Typography>
          <Typography
            variant="h6"
            color={
              validationRate > 98
                ? 'success.main'
                : validationRate > 95
                ? 'warning.main'
                : 'error.main'
            }
          >
            {validationRate.toFixed(1)}%
          </Typography>
        </Grid>
      </Grid>
      
      {/* Event Flow Chart */}
      <Box sx={{ height: 200, mb: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={eventStats.hourly_stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <ChartTooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke={theme.palette.primary.main}
              name="Events"
            />
            <Line
              type="monotone"
              dataKey="errors"
              stroke={theme.palette.error.main}
              name="Errors"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      
      {/* Event Types Timeline */}
      <Typography variant="subtitle2" gutterBottom>
        Event Type Distribution
      </Typography>
      <Timeline>
        {eventStats.event_types.map((type, index) => (
          <TimelineItem key={type.name}>
            <TimelineSeparator>
              <TimelineDot
                color={type.trend === 'up' ? 'success' : 'primary'}
              />
              {index < eventStats.event_types.length - 1 && (
                <TimelineConnector />
              )}
            </TimelineSeparator>
            <TimelineContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="body2">
                    {type.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {type.count.toLocaleString()} events
                  </Typography>
                </Box>
                {getTrendIcon(type.trend)}
              </Box>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
      
      {/* Validation Status */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 1,
          bgcolor:
            validationRate > 98
              ? 'success.light'
              : validationRate > 95
              ? 'warning.light'
              : 'error.light'
        }}
      >
        <Typography variant="body2" gutterBottom>
          Schema Validation Health
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {validationRate < 95 && (
            <ErrorIcon color="error" sx={{ mr: 1 }} />
          )}
          <Typography
            variant="body2"
            color={
              validationRate > 98
                ? 'success.main'
                : validationRate > 95
                ? 'warning.main'
                : 'error.main'
            }
          >
            {validationRate > 98
              ? 'Excellent Validation Rate'
              : validationRate > 95
              ? 'Good Validation Rate'
              : 'Poor Validation Rate - Action Required'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default EventFlow; 