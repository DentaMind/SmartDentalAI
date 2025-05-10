import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Assessment,
  Speed,
  Storage,
  Psychology,
  Update,
  Warning,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from '@mui/x-charts/LineChart';
import { fetchOpsBoardMetrics } from '../../api/founder';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}) => (
  <Card>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Box sx={{ color, p: 1 }}>
            {icon}
          </Box>
        </Grid>
        <Grid item xs>
          <Typography variant="h5" component="div">
            {value}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="textSecondary" display="block">
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Chip
              size="small"
              label={`${trend >= 0 ? '+' : ''}${trend}%`}
              color={trend >= 0 ? 'success' : 'error'}
              sx={{ mt: 1 }}
            />
          )}
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const SystemHealthSection: React.FC<{ metrics: any }> = ({ metrics }) => (
  <Paper sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      System Health
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="API Response Time"
          value={`${metrics.api_response_times.avg_ms.toFixed(2)}ms`}
          subtitle={`Max: ${metrics.api_response_times.max_ms.toFixed(2)}ms`}
          icon={<Speed />}
          color="#1976d2"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Storage Used"
          value={`${metrics.storage_metrics.total_storage_mb.toFixed(2)} MB`}
          subtitle={`${metrics.storage_metrics.total_xrays} X-rays`}
          icon={<Storage />}
          color="#2e7d32"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Database Size"
          value={metrics.database_metrics.total_patients}
          subtitle={`${metrics.database_metrics.total_treatment_plans} Treatment Plans`}
          icon={<Assessment />}
          color="#ed6c02"
        />
      </Grid>
    </Grid>
  </Paper>
);

const ScalingMetricsSection: React.FC<{ metrics: any }> = ({ metrics }) => (
  <Paper sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Scaling Metrics
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Daily New Data
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">Patients</Typography>
              <LinearProgress
                variant="determinate"
                value={(metrics.data_volume.daily_new_patients / 100) * 100}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2">Treatment Plans</Typography>
              <LinearProgress
                variant="determinate"
                value={(metrics.data_volume.daily_new_treatment_plans / 100) * 100}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2">X-rays</Typography>
              <LinearProgress
                variant="determinate"
                value={(metrics.data_volume.daily_new_xrays / 100) * 100}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Processing Queue
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                AI Analysis Queue: {metrics.processing_metrics.ai_analysis_queue_size}
              </Typography>
              <Typography variant="body2">
                Background Jobs: {metrics.processing_metrics.background_jobs_pending}
              </Typography>
            </Box>
            <Alert severity="info">
              {metrics.concurrent_users.last_24h} active users in last 24h
            </Alert>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Paper>
);

const LearningMetricsSection: React.FC<{ metrics: any }> = ({ metrics }) => (
  <Paper sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Learning System Metrics
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Analyzed X-rays"
          value={metrics.training_data.total_analyzed_xrays}
          subtitle="Total processed"
          icon={<Psychology />}
          color="#9c27b0"
          trend={5}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Model Accuracy"
          value={`${(metrics.model_performance.agreement_rate * 100).toFixed(1)}%`}
          subtitle={`+${(metrics.model_performance.monthly_improvement * 100).toFixed(1)}% this month`}
          icon={<Assessment />}
          color="#1976d2"
          trend={2}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Anonymized Cases"
          value={metrics.data_collection.anonymized_cases}
          subtitle="Last 30 days"
          icon={<Storage />}
          color="#2e7d32"
        />
      </Grid>
    </Grid>
  </Paper>
);

const RiskMetricsSection: React.FC<{ metrics: any }> = ({ metrics }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Risk Monitoring
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="error" variant="subtitle1" gutterBottom>
              Security Alerts
            </Typography>
            <Typography variant="h4">
              {metrics.security.failed_login_attempts}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Failed login attempts (24h)
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {metrics.security.suspicious_activities} suspicious activities
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="warning" variant="subtitle1" gutterBottom>
              Compliance
            </Typography>
            <Alert severity={metrics.compliance.hipaa_violations > 0 ? "error" : "success"}>
              {metrics.compliance.hipaa_violations} HIPAA violations detected
            </Alert>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {metrics.compliance.data_export_requests} data export requests
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="info" variant="subtitle1" gutterBottom>
              Technical Debt
            </Typography>
            <Typography variant="body2" color="warning.main">
              {metrics.technical_debt.deprecated_api_calls} deprecated API calls
            </Typography>
            <Typography variant="body2" color="error">
              {metrics.technical_debt.slow_queries} slow queries detected
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Paper>
);

export const FounderOpsBoard: React.FC = () => {
  const { data: metrics, isLoading, error } = useQuery(
    ['opsBoardMetrics'],
    fetchOpsBoardMetrics,
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading metrics...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load Ops Board metrics
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Founder Operations Board
      </Typography>
      
      <SystemHealthSection metrics={metrics.system_health} />
      <ScalingMetricsSection metrics={metrics.scaling_metrics} />
      <LearningMetricsSection metrics={metrics.learning_metrics} />
      <RiskMetricsSection metrics={metrics.risk_metrics} />
    </Box>
  );
}; 