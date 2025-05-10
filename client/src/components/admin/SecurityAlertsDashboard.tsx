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
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, subDays } from 'date-fns';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Send as SendIcon,
  BarChart as BarChartIcon,
  FilterList as FilterListIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';

import SecurityAlertDetail from './SecurityAlertDetail';
import SecurityAlertTimeline from './SecurityAlertTimeline';
import SecurityAlertsExport from './SecurityAlertsExport';
import {
  securityAlertService,
  SecurityAlert,
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  AlertFilterParams,
  ResolutionStats,
  AlertCategories
} from '../../services/SecurityAlertService';

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
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const SecurityAlertsDashboard: React.FC = () => {
  // State for alerts and filtering
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<ResolutionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [categories, setCategories] = useState<AlertCategories | null>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState<boolean>(false);
  const [digestDialogOpen, setDigestDialogOpen] = useState<boolean>(false);
  const [scanDays, setScanDays] = useState<number>(1);
  const [digestDays, setDigestDays] = useState<number>(7);
  const [digestEmail, setDigestEmail] = useState<string>('');
  const [dialogLoading, setDialogLoading] = useState<boolean>(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogSuccess, setDialogSuccess] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<AlertFilterParams>({
    start_time: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss"),
    limit: 100
  });

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
    loadStats();
    loadCategories();
  }, []);

  // Load alerts when filters change
  useEffect(() => {
    applyFilters();
  }, [alerts, filters]);

  // Load alerts from the API
  const loadAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await securityAlertService.getAlerts(filters);
      setAlerts(data);
    } catch (err: any) {
      console.error('Error loading security alerts:', err);
      setError(`Failed to load security alerts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load alert statistics
  const loadStats = async () => {
    setStatsLoading(true);

    try {
      const data = await securityAlertService.getAlertStats(
        filters.start_time,
        filters.end_time
      );
      setStats(data);
    } catch (err: any) {
      console.error('Error loading alert statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load alert categories
  const loadCategories = async () => {
    try {
      const data = await securityAlertService.getAlertCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Error loading alert categories:', err);
    }
  };

  // Apply filters to the loaded alerts
  const applyFilters = () => {
    if (!alerts.length) {
      setFilteredAlerts([]);
      return;
    }

    // Filter alerts based on the current filter settings
    let filtered = [...alerts];

    // Additional client-side filtering if needed
    if (filters.severity && filters.severity.length > 0) {
      filtered = filtered.filter(alert => 
        filters.severity?.includes(alert.severity)
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(alert => 
        filters.status?.includes(alert.status)
      );
    }

    setFilteredAlerts(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (field: keyof AlertFilterParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle clearing filters
  const handleClearFilters = () => {
    setFilters({
      start_time: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss"),
      limit: 100
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    loadAlerts();
    loadStats();
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle alert updated
  const handleAlertUpdated = (updatedAlert: SecurityAlert) => {
    // Update the alert in the list
    setAlerts(prev => 
      prev.map(alert => 
        alert.alert_id === updatedAlert.alert_id ? updatedAlert : alert
      )
    );
    
    // Refresh statistics after a delay
    setTimeout(() => {
      loadStats();
    }, 500);
  };

  // Handle opening scan dialog
  const handleOpenScanDialog = () => {
    setScanDialogOpen(true);
    setDialogError(null);
    setDialogSuccess(null);
  };

  // Handle closing scan dialog
  const handleCloseScanDialog = () => {
    setScanDialogOpen(false);
  };

  // Handle opening digest dialog
  const handleOpenDigestDialog = () => {
    setDigestDialogOpen(true);
    setDialogError(null);
    setDialogSuccess(null);
  };

  // Handle closing digest dialog
  const handleCloseDigestDialog = () => {
    setDigestDialogOpen(false);
  };

  // Handle running security scan
  const handleRunScan = async () => {
    setDialogLoading(true);
    setDialogError(null);
    setDialogSuccess(null);

    try {
      const newAlerts = await securityAlertService.runSecurityScan(scanDays);
      
      // Update alerts and stats
      loadAlerts();
      loadStats();
      
      setDialogSuccess(`Scan completed successfully. Found ${newAlerts.length} potential security issues.`);
      
      // Close dialog after 2 seconds if successful
      setTimeout(() => {
        handleCloseScanDialog();
      }, 2000);
    } catch (err: any) {
      console.error('Error running security scan:', err);
      setDialogError(err.message || 'Failed to run security scan');
    } finally {
      setDialogLoading(false);
    }
  };

  // Handle sending security digest
  const handleSendDigest = async () => {
    setDialogLoading(true);
    setDialogError(null);
    setDialogSuccess(null);

    try {
      const recipients = digestEmail ? [digestEmail] : undefined;
      await securityAlertService.sendSecurityDigest(digestDays, recipients);
      
      setDialogSuccess('Security digest sent successfully.');
      
      // Close dialog after 2 seconds if successful
      setTimeout(() => {
        handleCloseDigestDialog();
      }, 2000);
    } catch (err: any) {
      console.error('Error sending security digest:', err);
      setDialogError(err.message || 'Failed to send security digest');
    } finally {
      setDialogLoading(false);
    }
  };

  // Render filters section
  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Filter Security Alerts"
        action={
          <Box display="flex">
            <Tooltip title="Run Security Scan">
              <IconButton onClick={handleOpenScanDialog} sx={{ mr: 1 }}>
                <SecurityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send Security Digest">
              <IconButton onClick={handleOpenDigestDialog} sx={{ mr: 1 }}>
                <EmailIcon />
              </IconButton>
            </Tooltip>
            <SecurityAlertsExport categories={categories} />
            <Button
              startIcon={<RefreshIcon />}
              variant="contained"
              onClick={handleRefresh}
              sx={{ ml: 1 }}
            >
              Refresh
            </Button>
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.start_time ? new Date(filters.start_time) : null}
                onChange={(date) => {
                  if (date) {
                    handleFilterChange('start_time', format(date, "yyyy-MM-dd'T'HH:mm:ss"));
                  }
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={filters.end_time ? new Date(filters.end_time) : null}
                onChange={(date) => {
                  if (date) {
                    handleFilterChange('end_time', format(date, "yyyy-MM-dd'T'HH:mm:ss"));
                  }
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </LocalizationProvider>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories?.categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Alert Type</InputLabel>
              <Select
                value={filters.alert_type || ''}
                label="Alert Type"
                onChange={(e) => handleFilterChange('alert_type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {categories?.types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                multiple
                value={filters.severity || []}
                label="Severity"
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {categories?.severities.map((severity) => (
                  <MenuItem key={severity} value={severity}>
                    {severity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={filters.status || []}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {categories?.statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="User ID"
              value={filters.user_id || ''}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="IP Address"
              value={filters.ip_address || ''}
              onChange={(e) => handleFilterChange('ip_address', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Patient ID"
              value={filters.patient_id || ''}
              onChange={(e) => handleFilterChange('patient_id', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ mr: 1 }}
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={loadAlerts}
              >
                Apply Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Render statistics dashboard
  const renderStats = () => {
    if (statsLoading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (!stats) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          No security alert statistics available.
        </Alert>
      );
    }

    // Calculate percentages for the progress bars
    const totalAlerts = stats.total_alerts || 1; // Prevent division by zero
    const resolvedPercentage = (stats.resolved_alerts / totalAlerts) * 100;
    const acknowledgedPercentage = (stats.acknowledged_alerts / totalAlerts) * 100;
    const falsePositivePercentage = (stats.false_positives / totalAlerts) * 100;
    const escalatedPercentage = (stats.escalated_alerts / totalAlerts) * 100;
    const openPercentage = (stats.open_alerts / totalAlerts) * 100;

    return (
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Alert Summary
            </Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant="h3" component="div">
                {stats.total_alerts}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Total Alerts
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Open Alerts
                </Typography>
                <Typography variant="h6" color="error.main">
                  {stats.open_alerts}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Resolved
                </Typography>
                <Typography variant="h6" color="success.main">
                  {stats.resolved_alerts}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Resolution Time
            </Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant="h3" component="div">
                {stats.avg_resolution_time_hours 
                  ? `${stats.avg_resolution_time_hours.toFixed(1)}h`
                  : 'N/A'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Average Resolution Time
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Acknowledged
                </Typography>
                <Typography variant="h6" color="info.main">
                  {stats.acknowledged_alerts}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  False Positives
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {stats.false_positives}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Critical Alerts
            </Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant="h3" component="div" color="error.main">
                {stats.alerts_by_severity.critical || 0}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Critical Severity Alerts
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  High Severity
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {stats.alerts_by_severity.high || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Escalated
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {stats.escalated_alerts}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alert Status Distribution
            </Typography>
            <Box sx={{ mt: 3, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box 
                  sx={{ 
                    width: `${openPercentage}%`, 
                    height: 20, 
                    bgcolor: 'error.main',
                    borderRadius: '4px 0 0 4px',
                    transition: 'width 1s ease-in-out',
                  }} 
                />
                <Box 
                  sx={{ 
                    width: `${acknowledgedPercentage}%`, 
                    height: 20, 
                    bgcolor: 'info.main',
                    transition: 'width 1s ease-in-out',
                  }} 
                />
                <Box 
                  sx={{ 
                    width: `${escalatedPercentage}%`, 
                    height: 20, 
                    bgcolor: 'warning.main',
                    transition: 'width 1s ease-in-out',
                  }} 
                />
                <Box 
                  sx={{ 
                    width: `${resolvedPercentage}%`, 
                    height: 20, 
                    bgcolor: 'success.main',
                    transition: 'width 1s ease-in-out',
                  }} 
                />
                <Box 
                  sx={{ 
                    width: `${falsePositivePercentage}%`, 
                    height: 20, 
                    bgcolor: 'grey.400',
                    borderRadius: '0 4px 4px 0',
                    transition: 'width 1s ease-in-out',
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="error.main">
                  Open: {stats.open_alerts} ({Math.round(openPercentage)}%)
                </Typography>
                <Typography variant="caption" color="info.main">
                  Acknowledged: {stats.acknowledged_alerts} ({Math.round(acknowledgedPercentage)}%)
                </Typography>
                <Typography variant="caption" color="warning.main">
                  Escalated: {stats.escalated_alerts} ({Math.round(escalatedPercentage)}%)
                </Typography>
                <Typography variant="caption" color="success.main">
                  Resolved: {stats.resolved_alerts} ({Math.round(resolvedPercentage)}%)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  False Positive: {stats.false_positives} ({Math.round(falsePositivePercentage)}%)
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Category and Severity Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alerts by Category
            </Typography>
            <Box sx={{ mt: 2 }}>
              {Object.entries(stats.alerts_by_category)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <Box key={category} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{category}</Typography>
                      <Typography variant="body2">{count}</Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        width: '100%', 
                        bgcolor: 'grey.100', 
                        height: 8, 
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: `${(count / totalAlerts) * 100}%`, 
                          height: '100%', 
                          bgcolor: 'primary.main',
                          transition: 'width 1s ease-in-out',
                        }} 
                      />
                    </Box>
                  </Box>
                ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alerts by Severity
            </Typography>
            <Box sx={{ mt: 2 }}>
              {Object.entries(stats.alerts_by_severity)
                .sort((a, b) => {
                  const order = { critical: 0, high: 1, medium: 2, low: 3 };
                  return (order[a[0] as keyof typeof order] || 99) - 
                         (order[b[0] as keyof typeof order] || 99);
                })
                .map(([severity, count]) => {
                  let color = 'primary.main';
                  if (severity === 'critical') color = 'error.main';
                  else if (severity === 'high') color = 'error.light';
                  else if (severity === 'medium') color = 'warning.main';
                  else if (severity === 'low') color = 'info.main';

                  return (
                    <Box key={severity} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{severity}</Typography>
                        <Typography variant="body2">{count}</Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          width: '100%', 
                          bgcolor: 'grey.100', 
                          height: 8, 
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: `${(count / totalAlerts) * 100}%`, 
                            height: '100%', 
                            bgcolor: color,
                            transition: 'width 1s ease-in-out',
                          }} 
                        />
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render alerts list
  const renderAlerts = () => {
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

    if (filteredAlerts.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          No security alerts found with the current filters.
        </Alert>
      );
    }

    return (
      <Box>
        {filteredAlerts.map((alert) => (
          <SecurityAlertDetail
            key={alert.alert_id}
            alert={alert}
            onAlertUpdated={handleAlertUpdated}
          />
        ))}
      </Box>
    );
  };

  // Render scan dialog
  const renderScanDialog = () => (
    <Dialog open={scanDialogOpen} onClose={handleCloseScanDialog}>
      <DialogTitle>Run Security Scan</DialogTitle>
      <DialogContent>
        {dialogError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {dialogError}
          </Alert>
        )}
        {dialogSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {dialogSuccess}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Run a security scan to detect anomalies in the system. 
          This will analyze audit logs for suspicious patterns.
        </Typography>
        <TextField
          fullWidth
          label="Days to Scan"
          type="number"
          value={scanDays}
          onChange={(e) => setScanDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
          InputProps={{ inputProps: { min: 1, max: 30 } }}
          helperText="Choose between 1-30 days"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseScanDialog} disabled={dialogLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleRunScan}
          variant="contained"
          color="primary"
          startIcon={dialogLoading ? <CircularProgress size={20} /> : <SecurityIcon />}
          disabled={dialogLoading}
        >
          {dialogLoading ? 'Scanning...' : 'Run Scan'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render digest dialog
  const renderDigestDialog = () => (
    <Dialog open={digestDialogOpen} onClose={handleCloseDigestDialog}>
      <DialogTitle>Send Security Digest</DialogTitle>
      <DialogContent>
        {dialogError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {dialogError}
          </Alert>
        )}
        {dialogSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {dialogSuccess}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Send a security digest email with statistics about alerts and resolutions.
          The digest includes counts by severity, category, and resolution status.
        </Typography>
        <TextField
          fullWidth
          label="Days to Include"
          type="number"
          value={digestDays}
          onChange={(e) => setDigestDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 7)))}
          InputProps={{ inputProps: { min: 1, max: 30 } }}
          helperText="Choose between 1-30 days"
          sx={{ mt: 1, mb: 2 }}
        />
        <TextField
          fullWidth
          label="Email Recipient (Optional)"
          type="email"
          value={digestEmail}
          onChange={(e) => setDigestEmail(e.target.value)}
          helperText="Leave empty to use default security team email"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDigestDialog} disabled={dialogLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSendDigest}
          variant="contained"
          color="primary"
          startIcon={dialogLoading ? <CircularProgress size={20} /> : <SendIcon />}
          disabled={dialogLoading}
        >
          {dialogLoading ? 'Sending...' : 'Send Digest'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Security Alerts Dashboard
      </Typography>
      
      {renderFilters()}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="security alerts tabs"
        >
          <Tab label="Overview" id="security-tab-0" aria-controls="security-tabpanel-0" />
          <Tab label="Alerts" id="security-tab-1" aria-controls="security-tabpanel-1" />
          <Tab label="Timeline" id="security-tab-2" aria-controls="security-tabpanel-2" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {renderStats()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderAlerts()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <SecurityAlertTimeline alerts={filteredAlerts} />
      </TabPanel>
      
      {renderScanDialog()}
      {renderDigestDialog()}
    </Box>
  );
};

export default SecurityAlertsDashboard; 