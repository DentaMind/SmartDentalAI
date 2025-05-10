import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  Stack,
  IconButton,
  CircularProgress,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';

import AnomalyDetails from './AnomalyDetails';
import { alertService, Alert as AlertType, AlertConfig } from '../../services/AlertService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`anomaly-tabpanel-${index}`}
      aria-labelledby={`anomaly-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const SecurityAnomalyDashboard: React.FC = () => {
  // State for anomalies and filtering
  const [anomalies, setAnomalies] = useState<AlertType[]>([]);
  const [filteredAnomalies, setFilteredAnomalies] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [alertTypes, setAlertTypes] = useState<any[]>([]);
  
  // Filter state
  const [daysLookback, setDaysLookback] = useState<number>(7);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Configuration dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState<boolean>(false);
  const [configState, setConfigState] = useState<AlertConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  
  // Notification settings state
  const [notifyDialogOpen, setNotifyDialogOpen] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  // Load anomalies on mount and when filter changes
  useEffect(() => {
    loadAnomalies();
    loadAlertTypes();
    loadConfig();
  }, []);

  // Apply filters when filter state or anomalies change
  useEffect(() => {
    applyFilters();
  }, [anomalies, selectedType, selectedSeverity, selectedUserId]);

  // Load anomalies from the API
  const loadAnomalies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: any = {};
      if (selectedType) filters.alert_types = [selectedType];
      if (selectedSeverity) filters.severity = selectedSeverity;
      if (selectedUserId) filters.user_id = selectedUserId;
      
      const data = await alertService.getAnomalies(daysLookback, filters);
      setAnomalies(data);
    } catch (err: any) {
      console.error('Error loading anomalies:', err);
      setError(`Failed to load security anomalies: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load alert types
  const loadAlertTypes = async () => {
    try {
      const types = await alertService.getAlertTypes();
      setAlertTypes(types);
    } catch (err) {
      console.error('Error loading alert types:', err);
    }
  };

  // Load configuration
  const loadConfig = async () => {
    try {
      const config = await alertService.loadConfig();
      setConfigState(config);
    } catch (err) {
      console.error('Error loading configuration:', err);
    }
  };

  // Apply filters to anomalies
  const applyFilters = () => {
    let filtered = [...anomalies];
    
    if (selectedType) {
      filtered = filtered.filter(a => a.type === selectedType);
    }
    
    if (selectedSeverity) {
      filtered = filtered.filter(a => a.severity === selectedSeverity);
    }
    
    if (selectedUserId) {
      filtered = filtered.filter(a => a.user_id?.includes(selectedUserId));
    }
    
    setFilteredAnomalies(filtered);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadAnomalies();
  };

  // Open config dialog
  const handleOpenConfig = () => {
    setConfigDialogOpen(true);
  };

  // Close config dialog
  const handleCloseConfig = () => {
    setConfigDialogOpen(false);
  };

  // Save configuration
  const handleSaveConfig = async () => {
    if (!configState) return;
    
    setIsSavingConfig(true);
    try {
      await alertService.saveConfig(configState);
      setConfigDialogOpen(false);
    } catch (err) {
      console.error('Error saving configuration:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Open notification dialog
  const handleOpenNotify = () => {
    setNotifyDialogOpen(true);
    setNotifyResult(null);
  };

  // Close notification dialog
  const handleCloseNotify = () => {
    setNotifyDialogOpen(false);
  };

  // Subscribe to webhook notifications
  const handleSubscribe = async () => {
    if (!webhookUrl) return;
    
    setIsTestingWebhook(true);
    try {
      const result = await alertService.subscribeToAlerts(webhookUrl);
      setNotifyResult(`Successfully subscribed to alerts: ${result.message}`);
    } catch (err: any) {
      setNotifyResult(`Error: ${err.message}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Unsubscribe from webhook notifications
  const handleUnsubscribe = async () => {
    if (!webhookUrl) return;
    
    setIsTestingWebhook(true);
    try {
      const result = await alertService.unsubscribeFromAlerts(webhookUrl);
      setNotifyResult(`Successfully unsubscribed: ${result.message}`);
    } catch (err: any) {
      setNotifyResult(`Error: ${err.message}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Test webhook
  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const result = await alertService.testAlertWebhook();
      setNotifyResult(`Test alert sent: ${result.message}`);
    } catch (err: any) {
      setNotifyResult(`Error: ${err.message}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Calculate severity counts
  const calculateSeverityCounts = () => {
    const counts = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    anomalies.forEach(a => {
      if (a.severity === 'high') counts.high++;
      else if (a.severity === 'medium') counts.medium++;
      else counts.low++;
    });
    
    return counts;
  };

  // Group anomalies by type for summary view
  const getAnomaliesByType = () => {
    const typeMap: Record<string, number> = {};
    anomalies.forEach(a => {
      typeMap[a.type] = (typeMap[a.type] || 0) + 1;
    });
    
    return Object.entries(typeMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Get type name from type ID
  const getTypeName = (typeId: string) => {
    const typeObj = alertTypes.find(t => t.id === typeId);
    return typeObj ? typeObj.name : typeId.replace(/_/g, ' ');
  };

  // Render the filters section
  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Filter Security Anomalies"
        action={
          <Box display="flex">
            <IconButton onClick={handleOpenConfig} sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={handleOpenNotify} sx={{ mr: 1 }}>
              <NotificationsIcon />
            </IconButton>
            <Button
              startIcon={<RefreshIcon />}
              variant="contained"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Days Lookback"
              type="number"
              value={daysLookback}
              onChange={(e) => setDaysLookback(Number(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 90 } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Alert Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as string)}
                label="Alert Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {alertTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as string)}
                label="Severity"
              >
                <MenuItem value="">All Severities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="User ID"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedType("");
                setSelectedSeverity("");
                setSelectedUserId("");
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Render the summary view
  const renderSummary = () => {
    const severityCounts = calculateSeverityCounts();
    const typeGroups = getAnomaliesByType();
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Severity Breakdown</Typography>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography>High Severity:</Typography>
                <Chip 
                  label={severityCounts.high} 
                  color="error"
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Medium Severity:</Typography>
                <Chip 
                  label={severityCounts.medium} 
                  color="warning"
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Low Severity:</Typography>
                <Chip 
                  label={severityCounts.low} 
                  color="info"
                  size="small"
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Anomaly Types</Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {typeGroups.map((group) => (
                <Box key={group.type} display="flex" justifyContent="space-between" mb={1} p={1} sx={{ borderBottom: '1px solid #eee' }}>
                  <Typography>
                    {getTypeName(group.type)}
                  </Typography>
                  <Chip 
                    label={group.count} 
                    size="small"
                    color="primary"
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Alert severity="info">
            <AlertTitle>Anomaly Detection Period</AlertTitle>
            Showing anomalies detected in the last {daysLookback} days. Total anomalies: {anomalies.length}
          </Alert>
        </Grid>
      </Grid>
    );
  };

  // Render the detailed anomalies list
  const renderAnomalies = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      );
    }
    
    if (filteredAnomalies.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          No anomalies found with the current filters.
        </Alert>
      );
    }
    
    return (
      <Box>
        {filteredAnomalies.map((anomaly, index) => (
          <AnomalyDetails key={index} anomaly={anomaly} />
        ))}
      </Box>
    );
  };

  // Render the configuration dialog
  const renderConfigDialog = () => (
    <Dialog
      open={configDialogOpen}
      onClose={handleCloseConfig}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Security Anomaly Detection Configuration</DialogTitle>
      <DialogContent>
        {configState && (
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Failed Logins Threshold"
                type="number"
                value={configState.failed_logins_threshold}
                onChange={(e) => setConfigState({
                  ...configState,
                  failed_logins_threshold: Number(e.target.value)
                })}
                helperText="Number of failed logins to trigger an alert"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Patient Access Threshold"
                type="number"
                value={configState.patient_access_threshold}
                onChange={(e) => setConfigState({
                  ...configState,
                  patient_access_threshold: Number(e.target.value)
                })}
                helperText="Number of patients accessed to trigger an alert"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Standard Deviation Threshold"
                type="number"
                value={configState.std_dev_threshold}
                onChange={(e) => setConfigState({
                  ...configState,
                  std_dev_threshold: Number(e.target.value)
                })}
                helperText="Standard deviations from normal to consider anomalous"
                margin="normal"
                InputProps={{ inputProps: { step: 0.1, min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Unusual Hours Start"
                    type="number"
                    value={configState.unusual_hours_start}
                    onChange={(e) => setConfigState({
                      ...configState,
                      unusual_hours_start: Number(e.target.value)
                    })}
                    helperText="Hour (24h) when unusual hours start"
                    margin="normal"
                    InputProps={{ inputProps: { min: 0, max: 23 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Unusual Hours End"
                    type="number"
                    value={configState.unusual_hours_end}
                    onChange={(e) => setConfigState({
                      ...configState,
                      unusual_hours_end: Number(e.target.value)
                    })}
                    helperText="Hour (24h) when unusual hours end"
                    margin="normal"
                    InputProps={{ inputProps: { min: 0, max: 23 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configState.email_alerts}
                    onChange={(e) => setConfigState({
                      ...configState,
                      email_alerts: e.target.checked
                    })}
                  />
                }
                label="Send Email Alerts for High Severity Anomalies"
              />
            </Grid>
            {configState.email_alerts && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alert Recipients (comma separated)"
                  value={configState.alert_recipients?.join(', ') || ''}
                  onChange={(e) => setConfigState({
                    ...configState,
                    alert_recipients: e.target.value.split(',').map(e => e.trim()).filter(Boolean)
                  })}
                  helperText="Email addresses to send alerts to"
                  margin="normal"
                />
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseConfig}>Cancel</Button>
        <Button 
          onClick={handleSaveConfig} 
          variant="contained" 
          disabled={isSavingConfig}
          startIcon={isSavingConfig ? <CircularProgress size={20} /> : undefined}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render the notification dialog
  const renderNotifyDialog = () => (
    <Dialog
      open={notifyDialogOpen}
      onClose={handleCloseNotify}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Real-Time Alert Notifications</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Configure real-time notifications for security alerts
        </Typography>

        <TextField
          fullWidth
          label="Webhook URL"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          helperText="URL to receive webhook notifications"
          margin="normal"
        />

        {notifyResult && (
          <Alert 
            severity={notifyResult.startsWith('Error') ? 'error' : 'success'} 
            sx={{ mt: 2 }}
          >
            {notifyResult}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseNotify}>Close</Button>
        <Button 
          onClick={handleUnsubscribe} 
          disabled={!webhookUrl || isTestingWebhook}
          color="error"
        >
          Unsubscribe
        </Button>
        <Button 
          onClick={handleTestWebhook} 
          disabled={isTestingWebhook}
        >
          Test Webhook
        </Button>
        <Button 
          onClick={handleSubscribe} 
          variant="contained" 
          disabled={!webhookUrl || isTestingWebhook}
          startIcon={isTestingWebhook ? <CircularProgress size={20} /> : <NotificationsActiveIcon />}
        >
          Subscribe
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Security Anomaly Detection</Typography>
      
      {renderFilters()}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Anomalies" />
          <Tab label="Summary" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {renderAnomalies()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderSummary()}
      </TabPanel>
      
      {renderConfigDialog()}
      {renderNotifyDialog()}
    </Box>
  );
};

export default SecurityAnomalyDashboard; 