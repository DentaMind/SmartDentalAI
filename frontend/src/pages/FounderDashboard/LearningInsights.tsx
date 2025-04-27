import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Error,
  Info,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { useQuery } from 'react-query';

import { fetchInsightsSummary, fetchInsightsRange, fetchRecentAlerts } from '../../api/insights';
import { DateRangeSelector } from '../../components/DateRangeSelector';
import { MetricCard } from '../../components/MetricCard';
import { AlertSeverityFilter } from '../../components/AlertSeverityFilter';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const LearningInsights: React.FC = () => {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() });
  const [alertSeverity, setAlertSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  // Fetch system summary
  const { data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useQuery(
    'insights-summary',
    () => fetchInsightsSummary(),
    { refetchInterval: 5 * 60 * 1000 } // Refresh every 5 minutes
  );

  // Fetch insights range
  const { data: insights, isLoading: insightsLoading } = useQuery(
    ['insights-range', dateRange],
    () => fetchInsightsRange(dateRange.start, dateRange.end),
    { refetchInterval: 5 * 60 * 1000 }
  );

  // Fetch recent alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery(
    ['recent-alerts', alertSeverity],
    () => fetchRecentAlerts(7, alertSeverity),
    { refetchInterval: 60 * 1000 } // Refresh every minute
  );

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!insights) return null;

    return {
      labels: insights.map(i => format(new Date(i.date), 'MMM d')),
      datasets: [
        {
          label: 'Diagnosis Corrections',
          data: insights.map(i => i.metrics?.diagnosis?.correction_rate || 0),
          borderColor: theme.palette.primary.main,
          tension: 0.4
        },
        {
          label: 'Treatment Edits',
          data: insights.map(i => i.metrics?.treatment?.edit_rate || 0),
          borderColor: theme.palette.secondary.main,
          tension: 0.4
        },
        {
          label: 'Billing Overrides',
          data: insights.map(i => i.metrics?.billing?.override_rate || 0),
          borderColor: theme.palette.warning.main,
          tension: 0.4
        }
      ]
    };
  }, [insights, theme]);

  // Handle loading states
  if (summaryLoading || insightsLoading || alertsLoading) {
    return <LoadingOverlay message="Loading learning insights..." />;
  }

  // Handle error states
  if (summaryError) {
    return (
      <Alert severity="error">
        <AlertTitle>Error Loading Insights</AlertTitle>
        {summaryError.message}
      </Alert>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1">
              Learning Insights Dashboard
            </Typography>
            <Box>
              <Tooltip title="Refresh Data">
                <IconButton onClick={() => refetchSummary()}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter">
                <IconButton>
                  <FilterList />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* System Health Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <MetricCard
                title="Diagnosis Accuracy"
                value={summary?.trends.diagnosis_correction.current_rate}
                trend={summary?.trends.diagnosis_correction.direction}
                change={summary?.trends.diagnosis_correction.change}
                format="percentage"
                icon={summary?.trends.diagnosis_correction.direction === 'improving' ? <TrendingUp /> : <TrendingDown />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                title="Treatment Plan Stability"
                value={summary?.trends.treatment_edits.current_rate}
                trend={summary?.trends.treatment_edits.direction}
                change={summary?.trends.treatment_edits.change}
                format="percentage"
                icon={summary?.trends.treatment_edits.direction === 'improving' ? <TrendingUp /> : <TrendingDown />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                title="Billing Accuracy"
                value={summary?.trends.billing_overrides.current_rate}
                trend={summary?.trends.billing_overrides.direction}
                change={summary?.trends.billing_overrides.change}
                format="percentage"
                icon={summary?.trends.billing_overrides.direction === 'improving' ? <TrendingUp /> : <TrendingDown />}
              />
            </Grid>
          </Grid>

          {/* Trend Chart */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Learning Trends</Typography>
              <DateRangeSelector value={dateRange} onChange={setDateRange} />
            </Box>
            {chartData && (
              <Box sx={{ height: 400 }}>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          format: { style: 'percent' }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            )}
          </Paper>

          {/* Alerts and Patterns */}
          <Grid container spacing={3}>
            {/* Recent Alerts */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Recent Alerts</Typography>
                  <AlertSeverityFilter value={alertSeverity} onChange={setAlertSeverity} />
                </Box>
                <Timeline>
                  {alerts?.map((alert, index) => (
                    <TimelineItem key={index}>
                      <TimelineSeparator>
                        <TimelineDot color={
                          alert.severity === 'high' ? 'error' :
                          alert.severity === 'medium' ? 'warning' : 'info'
                        }>
                          {alert.severity === 'high' ? <Error /> :
                           alert.severity === 'medium' ? <Warning /> : <Info />}
                        </TimelineDot>
                        {index < alerts.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="subtitle2" component="span">
                          {alert.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {alert.description}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {format(new Date(alert.date), 'MMM d, yyyy')}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Paper>
            </Grid>

            {/* Emerging Patterns */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Emerging Patterns
                </Typography>
                <Grid container spacing={2}>
                  {insights?.[0]?.patterns.map((pattern, index) => (
                    <Grid item xs={12} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip
                              label={pattern.type}
                              size="small"
                              color={
                                pattern.severity === 'high' ? 'error' :
                                pattern.severity === 'medium' ? 'warning' : 'info'
                              }
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {pattern.severity} severity
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            {pattern.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ErrorBoundary>
  );
};

export default LearningInsights; 