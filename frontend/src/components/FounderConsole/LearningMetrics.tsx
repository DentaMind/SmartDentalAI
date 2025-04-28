import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Tooltip,
  IconButton,
  useTheme,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  DataObject as DataIcon,
  Sync as SyncIcon
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

interface LearningMetricsProps {
  modelAccuracy: {
    overall: number;
    byCategory: {
      name: string;
      accuracy: number;
      samples: number;
    }[];
    trend: number[];
  };
  datasetGrowth: {
    total: number;
    newLastWeek: number;
    growthRate: number;
    distribution: {
      category: string;
      count: number;
    }[];
  };
  retrainingStatus: {
    lastRetrained: string;
    status: 'idle' | 'in_progress' | 'scheduled';
    nextScheduled: string | null;
    improvements: {
      metric: string;
      change: number;
    }[];
  };
}

export const LearningMetrics: React.FC<LearningMetricsProps> = ({
  modelAccuracy,
  datasetGrowth,
  retrainingStatus
}) => {
  const theme = useTheme();
  
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return theme.palette.success.main;
    if (accuracy >= 90) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SchoolIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Learning Performance
        </Typography>
        <Chip
          size="small"
          icon={<SyncIcon />}
          label={retrainingStatus.status === 'in_progress' ? 'Training' : 'Ready'}
          color={retrainingStatus.status === 'in_progress' ? 'warning' : 'success'}
        />
      </Box>
      
      {/* Overall Accuracy */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
            Overall Model Accuracy
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: getAccuracyColor(modelAccuracy.overall) }}
          >
            {modelAccuracy.overall.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={modelAccuracy.overall}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              bgcolor: getAccuracyColor(modelAccuracy.overall),
              borderRadius: 4
            }
          }}
        />
      </Box>
      
      {/* Accuracy Trend */}
      <Box sx={{ height: 150, mb: 3 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Accuracy Trend
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={modelAccuracy.trend.map((value, index) => ({ value, index }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis domain={[80, 100]} />
            <ChartTooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke={theme.palette.primary.main}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      
      {/* Dataset Growth */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Total Samples
          </Typography>
          <Typography variant="h6">
            {datasetGrowth.total.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            +{datasetGrowth.newLastWeek} this week
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Growth Rate
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mr: 1 }}>
              {datasetGrowth.growthRate}%
            </Typography>
            <TrendingUpIcon
              color={datasetGrowth.growthRate > 0 ? 'success' : 'error'}
            />
          </Box>
        </Grid>
      </Grid>
      
      {/* Category Performance */}
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Category Performance
      </Typography>
      {modelAccuracy.byCategory.map((category) => (
        <Box key={category.name} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ flexGrow: 1 }}>
              {category.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: getAccuracyColor(category.accuracy) }}
            >
              {category.accuracy.toFixed(1)}% ({category.samples} samples)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={category.accuracy}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                bgcolor: getAccuracyColor(category.accuracy),
                borderRadius: 2
              }
            }}
          />
        </Box>
      ))}
      
      {/* Retraining Status */}
      {retrainingStatus.improvements.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Latest Improvements
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {retrainingStatus.improvements.map((improvement) => (
              <Chip
                key={improvement.metric}
                size="small"
                label={`${improvement.metric}: ${
                  improvement.change > 0 ? '+' : ''
                }${improvement.change.toFixed(1)}%`}
                color={improvement.change > 0 ? 'success' : 'error'}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LearningMetrics; 