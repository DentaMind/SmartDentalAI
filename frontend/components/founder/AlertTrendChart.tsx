import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { Box, Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { format, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { fetchMetricTrends } from '@/api/founder';

interface TrendPoint {
  timestamp: string;
  value: number;
  rolling_avg: number;
  prediction?: number;
  threshold: number;
}

interface MetricTrend {
  metric: string;
  points: TrendPoint[];
  risk_level: 'low' | 'medium' | 'high';
  trend_direction: 'improving' | 'stable' | 'deteriorating';
}

interface Props {
  metricType: string;
  timeRange: number; // days
}

const AlertTrendChart: React.FC<Props> = ({ metricType, timeRange }) => {
  const { data: trendData } = useQuery<MetricTrend>(
    ['metricTrends', metricType, timeRange],
    () => fetchMetricTrends(metricType, timeRange)
  );

  if (!trendData) return null;

  const getStatusColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return '#ff4444';
      case 'medium':
        return '#ffbb33';
      case 'low':
        return '#00C851';
      default:
        return '#2196f3';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return '↗️';
      case 'deteriorating':
        return '↘️';
      default:
        return '→';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {metricType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Trend
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography
              component="span"
              sx={{
                color: getStatusColor(trendData.risk_level),
                fontWeight: 'bold',
                mr: 1,
              }}
            >
              {trendData.risk_level.toUpperCase()}
            </Typography>
            <Typography component="span" sx={{ fontSize: '1.2rem' }}>
              {getTrendIcon(trendData.trend_direction)}
            </Typography>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={trendData.points}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => format(new Date(value), 'MMM d')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), 'PPP')}
              formatter={(value: number) => [value.toFixed(2), 'Value']}
            />
            <Legend />

            {/* Threshold line */}
            <Line
              type="monotone"
              dataKey="threshold"
              stroke="#ff9800"
              strokeDasharray="5 5"
              dot={false}
              name="Threshold"
            />

            {/* Actual metric value */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2196f3"
              strokeWidth={2}
              name="Actual"
            />

            {/* Rolling average */}
            <Line
              type="monotone"
              dataKey="rolling_avg"
              stroke="#4caf50"
              strokeWidth={2}
              dot={false}
              name="7-day Avg"
            />

            {/* Future prediction */}
            <Area
              type="monotone"
              dataKey="prediction"
              fill="#e3f2fd"
              stroke="#90caf9"
              strokeDasharray="3 3"
              name="Prediction"
            />
          </ComposedChart>
        </ResponsiveContainer>

        <Box mt={2} display="flex" justifyContent="space-between">
          <Typography color="textSecondary">
            Last {timeRange} days
          </Typography>
          {trendData.trend_direction === 'deteriorating' && (
            <Typography color="error">
              ⚠️ Trending towards threshold in {Math.ceil(timeRange * 0.7)} days
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AlertTrendChart; 