import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
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
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchDashboardMetrics } from '../../api/admin';
import { LineChart } from '@mui/x-charts/LineChart';
import { useAdminEvents } from '@/hooks/useAdminEvents';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/apiRequest';

interface DashboardMetrics {
  audit_metrics: {
    total_events_today: number;
    total_events_week: number;
    total_events_month: number;
  };
  treatment_plan_metrics: {
    open_treatment_plans: number;
    completed_treatment_plans: number;
    signed_treatment_plans: number;
  };
  financial_metrics: {
    total_outstanding_balance: number;
    payments_today: number;
  };
  recent_activity: Array<{
    id: number;
    event_type: string;
    timestamp: string;
    patient_id: number;
    resource_type: string;
  }>;
  event_type_distribution: Record<string, number>;
}

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Box sx={{ color, p: 1 }}>
            {icon}
          </Box>
        </Grid>
        <Grid item xs>
          <Typography variant="h6" component="div">
            {value}
          </Typography>
          <Typography color="textSecondary" variant="body2">
            {title}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

export const AdminDashboard: React.FC = () => {
  const {
    collectSettingsModified,
    collectUserPermissionChanged,
    collectAIModelRetrained,
    collectAlertConfigurationChanged,
    collectSystemBackupCreated,
    collectSystemRestoreInitiated,
    collectAuditLogExported,
    collectBillingConfigurationChanged,
    collectSecurityPolicyModified,
    collectMaintenanceModeToggled
  } = useAdminEvents();

  const queryClient = useQueryClient();

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>(
    ['dashboardMetrics'],
    fetchDashboardMetrics
  );

  const handleSettingsChange = async (settingType: string, newValue: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/settings/${settingType}`, { value: newValue });
      await collectSettingsModified(settingType, {
        originalValue: metrics?.settings?.[settingType],
        newValue,
        source: 'user'
      });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handlePermissionChange = async (userId: number, permission: string, action: 'granted' | 'revoked') => {
    try {
      const response = await apiRequest('POST', '/api/admin/permissions', { userId, permission, action });
      await collectUserPermissionChanged(userId, permission, action, { source: 'user' });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  const handleModelRetrain = async (modelType: string) => {
    try {
      const response = await apiRequest('POST', '/api/admin/retrain', { modelType });
      await collectAIModelRetrained(modelType, {
        source: 'user',
        modelVersion: response.data.version
      });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to retrain model:', error);
    }
  };

  const handleAlertConfigChange = async (alertType: string, config: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/alerts/${alertType}`, config);
      await collectAlertConfigurationChanged(alertType, {
        originalValue: metrics?.alertConfigs?.[alertType],
        newValue: config,
        source: 'user'
      });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to update alert configuration:', error);
    }
  };

  const handleSystemBackup = async (backupType: string) => {
    try {
      const response = await apiRequest('POST', '/api/admin/backup', { type: backupType });
      await collectSystemBackupCreated(backupType, {
        source: 'user'
      });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  const handleSystemRestore = async (restorePoint: string) => {
    try {
      const response = await apiRequest('POST', '/api/admin/restore', { restorePoint });
      await collectSystemRestoreInitiated(restorePoint, {
        source: 'user'
      });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to initiate restore:', error);
    }
  };

  const handleAuditLogExport = async (dateRange: { start: string; end: string }) => {
    try {
      const response = await apiRequest('POST', '/api/admin/audit-logs/export', dateRange);
      await collectAuditLogExported(dateRange, {
        source: 'user'
      });
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const handleBillingConfigChange = async (configType: string, config: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/billing/${configType}`, config);
      await collectBillingConfigurationChanged(configType, {
        originalValue: metrics?.billingConfigs?.[configType],
        newValue: config,
        source: 'user'
      });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to update billing configuration:', error);
    }
  };

  const handleSecurityPolicyChange = async (policyType: string, policy: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/security/${policyType}`, policy);
      await collectSecurityPolicyModified(policyType, {
        originalValue: metrics?.securityPolicies?.[policyType],
        newValue: policy,
        source: 'user'
      });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to update security policy:', error);
    }
  };

  const handleMaintenanceMode = async (enabled: boolean) => {
    try {
      const response = await apiRequest('POST', '/api/admin/maintenance', { enabled });
      await collectMaintenanceModeToggled(enabled, {
        source: 'user'
      });
      queryClient.invalidateQueries(['dashboardMetrics']);
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard metrics...</Typography>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load dashboard metrics</Typography>
      </Box>
    );
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format event type for display
  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Events Today"
            value={metrics.audit_metrics.total_events_today}
            icon={<EventIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Open Treatment Plans"
            value={metrics.treatment_plan_metrics.open_treatment_plans}
            icon={<AssignmentIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Outstanding Balance"
            value={formatCurrency(metrics.financial_metrics.total_outstanding_balance)}
            icon={<MoneyIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Payments Today"
            value={metrics.financial_metrics.payments_today}
            icon={<AssessmentIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Treatment Plans and Activity */}
      <Grid container spacing={3}>
        {/* Treatment Plan Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Treatment Plan Overview
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Open Plans"
                    secondary={metrics.treatment_plan_metrics.open_treatment_plans}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Completed Plans"
                    secondary={metrics.treatment_plan_metrics.completed_treatment_plans}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Signed Plans (This Month)"
                    secondary={metrics.treatment_plan_metrics.signed_treatment_plans}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity Timeline */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Timeline>
                {metrics.recent_activity.slice(0, 5).map((activity) => (
                  <TimelineItem key={activity.id}>
                    <TimelineSeparator>
                      <TimelineDot />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" color="textSecondary">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </Typography>
                      <Typography>
                        {formatEventType(activity.event_type)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {activity.resource_type} - Patient #{activity.patient_id}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>

        {/* Event Distribution Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Event Distribution (Last Week)
            </Typography>
            <Box sx={{ height: 300 }}>
              <LineChart
                series={[
                  {
                    data: Object.values(metrics.event_type_distribution),
                    label: 'Events',
                  },
                ]}
                xAxis={[{
                  data: Object.keys(metrics.event_type_distribution).map(formatEventType),
                  scaleType: 'band',
                }]}
                height={250}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}; 