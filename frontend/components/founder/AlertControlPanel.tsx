import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Slider,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert as MuiAlert,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchActiveAlerts, fetchAlertHistory, updateThresholds, updateAlertControl, resolveAlert } from '@/api/founder';
import AlertTrendChart from './AlertTrendChart';

interface AlertThresholds {
  diagnosis_accuracy: number;
  treatment_stability: number;
  billing_accuracy: number;
  user_experience: number;
}

interface Alert {
  id: number;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  metric: number;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

const AlertControlPanel: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    diagnosis_accuracy: 0.05,
    treatment_stability: 0.08,
    billing_accuracy: 0.03,
    user_experience: 10.0,
  });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolutionDialog, setResolutionDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [triggerRetraining, setTriggerRetraining] = useState(false);
  const [muteUntil, setMuteUntil] = useState<Date | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('diagnosis_accuracy');
  const [timeRange, setTimeRange] = useState(30);

  const queryClient = useQueryClient();

  // Fetch active alerts
  const { data: activeAlerts = [] } = useQuery(['activeAlerts'], fetchActiveAlerts);

  // Fetch alert history
  const { data: alertHistory = [] } = useQuery(['alertHistory'], fetchAlertHistory);

  // Mutations
  const updateThresholdsMutation = useMutation(updateThresholds, {
    onSuccess: () => {
      queryClient.invalidateQueries(['activeAlerts']);
    },
  });

  const updateControlMutation = useMutation(updateAlertControl);
  const resolveAlertMutation = useMutation(resolveAlert, {
    onSuccess: () => {
      queryClient.invalidateQueries(['activeAlerts', 'alertHistory']);
      setResolutionDialog(false);
    },
  });

  const handleThresholdChange = (type: keyof AlertThresholds) => (event: Event, value: number | number[]) => {
    setThresholds(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveThresholds = () => {
    updateThresholdsMutation.mutate(thresholds);
  };

  const handleMuteAlert = (type: string) => {
    updateControlMutation.mutate({
      type,
      is_muted: true,
      mute_until: muteUntil?.toISOString(),
    });
  };

  const handleResolveAlert = () => {
    if (selectedAlert) {
      resolveAlertMutation.mutate({
        alert_id: selectedAlert.id,
        resolution_notes: resolutionNotes,
        trigger_retraining,
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Alert Control Panel
      </Typography>

      <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<NotificationsIcon />} label="Active Alerts" />
        <Tab icon={<HistoryIcon />} label="Alert History" />
        <Tab icon={<AnalyticsIcon />} label="Trends" />
        <Tab icon={<SettingsIcon />} label="Thresholds" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          {activeAlerts.map((alert: Alert) => (
            <Grid item xs={12} key={alert.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{alert.title}</Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {format(new Date(alert.created_at), 'PPpp')}
                      </Typography>
                      <Typography>{alert.description}</Typography>
                      <Chip
                        label={alert.severity}
                        color={getSeverityColor(alert.severity)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <Box>
                      <Tooltip title="Mute Alert">
                        <IconButton onClick={() => handleMuteAlert(alert.type)}>
                          <NotificationsOffIcon />
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setResolutionDialog(true);
                        }}
                      >
                        Resolve
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          {alertHistory.map((alert: Alert) => (
            <Grid item xs={12} key={alert.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{alert.title}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {format(new Date(alert.created_at), 'PPpp')}
                  </Typography>
                  <Typography>{alert.description}</Typography>
                  {alert.resolved_at && (
                    <Box mt={1}>
                      <Typography color="textSecondary">
                        Resolved: {format(new Date(alert.resolved_at), 'PPpp')}
                      </Typography>
                      <Typography color="textSecondary">Notes: {alert.resolution_notes}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 2 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  label="Metric"
                >
                  <MenuItem value="diagnosis_accuracy">Diagnosis Accuracy</MenuItem>
                  <MenuItem value="treatment_stability">Treatment Stability</MenuItem>
                  <MenuItem value="billing_accuracy">Billing Accuracy</MenuItem>
                  <MenuItem value="user_experience">User Experience</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  label="Time Range"
                >
                  <MenuItem value={7}>Last 7 Days</MenuItem>
                  <MenuItem value={14}>Last 14 Days</MenuItem>
                  <MenuItem value={30}>Last 30 Days</MenuItem>
                  <MenuItem value={90}>Last 90 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <AlertTrendChart
            metricType={selectedMetric}
            timeRange={timeRange}
          />

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            📈 Trend lines show actual values, 7-day rolling average, and AI-powered predictions
          </Typography>
        </Box>
      )}

      {tab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Alert Thresholds</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography>Diagnosis Accuracy Change (%)</Typography>
                <Slider
                  value={thresholds.diagnosis_accuracy * 100}
                  onChange={handleThresholdChange('diagnosis_accuracy')}
                  min={1}
                  max={20}
                  valueLabelDisplay="auto"
                  valueLabelFormat={x => `${x}%`}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography>Treatment Stability Change (%)</Typography>
                <Slider
                  value={thresholds.treatment_stability * 100}
                  onChange={handleThresholdChange('treatment_stability')}
                  min={1}
                  max={20}
                  valueLabelDisplay="auto"
                  valueLabelFormat={x => `${x}%`}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography>Billing Accuracy Change (%)</Typography>
                <Slider
                  value={thresholds.billing_accuracy * 100}
                  onChange={handleThresholdChange('billing_accuracy')}
                  min={1}
                  max={20}
                  valueLabelDisplay="auto"
                  valueLabelFormat={x => `${x}%`}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography>User Experience Change (seconds)</Typography>
                <Slider
                  value={thresholds.user_experience}
                  onChange={handleThresholdChange('user_experience')}
                  min={1}
                  max={30}
                  valueLabelDisplay="auto"
                  valueLabelFormat={x => `${x}s`}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveThresholds}
                  startIcon={<SettingsIcon />}
                >
                  Save Thresholds
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Dialog open={resolutionDialog} onClose={() => setResolutionDialog(false)}>
        <DialogTitle>Resolve Alert</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resolution Notes"
            fullWidth
            multiline
            rows={4}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
          <Box display="flex" alignItems="center" mt={2}>
            <Switch
              checked={triggerRetraining}
              onChange={(e) => setTriggerRetraining(e.target.checked)}
            />
            <Typography>Trigger Model Retraining</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolutionDialog(false)}>Cancel</Button>
          <Button onClick={handleResolveAlert} color="primary" variant="contained">
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertControlPanel; 