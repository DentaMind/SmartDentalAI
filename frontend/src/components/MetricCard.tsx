import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: number;
  trend?: 'improving' | 'degrading';
  change?: number;
  format?: 'percentage' | 'number';
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  change,
  format = 'number',
  icon
}) => {
  const theme = useTheme();

  const formatValue = (val: number) => {
    if (format === 'percentage') {
      return `${(val * 100).toFixed(1)}%`;
    }
    return val.toLocaleString();
  };

  const formatChange = (val: number) => {
    if (format === 'percentage') {
      return `${(val * 100).toFixed(1)}%`;
    }
    return val.toLocaleString();
  };

  const getChangeColor = () => {
    if (!trend) return theme.palette.text.secondary;
    return trend === 'improving' ? theme.palette.success.main : theme.palette.error.main;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                mr: 2
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>

        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {formatValue(value)}
        </Typography>

        {trend && change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trend === 'improving' ? (
              <TrendingUp sx={{ color: theme.palette.success.main, mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: theme.palette.error.main, mr: 0.5 }} />
            )}
            <Typography
              variant="body2"
              sx={{ color: getChangeColor() }}
            >
              {change >= 0 ? '+' : ''}{formatChange(change)}
              {' '}
              {trend === 'improving' ? 'improvement' : 'degradation'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}; 