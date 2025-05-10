import React from 'react';
import { Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EventStats } from '@/types/events';

interface Props {
  stats: EventStats;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#F06292', '#BA68C8', '#4DB6AC', '#FFB74D'
];

export const EventTypeDistribution: React.FC<Props> = ({ stats }) => {
  const data = Object.entries(stats?.type_distribution || {})
    .map(([name, value]) => ({
      name: name.split('.').pop(), // Get last part of event type
      fullName: name,
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Show top 10 event types

  return (
    <Box height={300}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={({ name, percent }) => 
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, entry: any) => [
              value.toLocaleString(),
              entry.payload.fullName
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}; 