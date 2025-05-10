import React from 'react';
import { Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EventStats } from '@/types/events';

interface Props {
  stats: EventStats;
}

export const ErrorRateGraph: React.FC<Props> = ({ stats }) => {
  // Transform hourly data to include error rates
  const data = stats?.hourly_volumes?.map(hour => ({
    ...hour,
    errorRate: ((hour.errors / hour.count) * 100).toFixed(2)
  })) || [];

  return (
    <Box height={300}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="hour"
            tickFormatter={(value) => new Date(value).toLocaleTimeString()}
          />
          <YAxis
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip
            formatter={(value: string) => [`${value}%`, 'Error Rate']}
            labelFormatter={(label) => new Date(label).toLocaleString()}
          />
          <Line
            type="monotone"
            dataKey="errorRate"
            stroke="#ff0000"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}; 