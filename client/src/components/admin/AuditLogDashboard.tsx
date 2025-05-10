import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CloudDownload as DownloadIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

interface AuditLog {
  id: number;
  correlation_id: string;
  timestamp: string;
  user_id: string;
  user_role: string;
  ip_address: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  patient_id: string | null;
  is_phi_access: boolean;
  request_body?: any;
  response_data?: any;
  user_agent?: string;
  referrer?: string;
}

interface AuditLogFilter {
  startDate: Date | null;
  endDate: Date | null;
  userId: string;
  userRole: string;
  path: string;
  statusCode: string;
  patientId: string;
  isPhiAccess: boolean | null;
  minDuration: string;
  maxDuration: string;
}

interface Alert {
  type: string;
  severity: string;
  user_id?: string;
  ip_address?: string;
  count: number;
  timestamp?: string;
}

interface DailySummary {
  date: string;
  total_logs: number;
  phi_accesses: number;
  errors: number;
}

const AuditLogDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [detailDialog, setDetailDialog] = useState<{ open: boolean, log: AuditLog | null }>({
    open: false,
    log: null
  });
  
  // Initial filter state
  const initialFilter: AuditLogFilter = {
    startDate: null,
    endDate: null,
    userId: '',
    userRole: '',
    path: '',
    statusCode: '',
    patientId: '',
    isPhiAccess: null,
    minDuration: '',
    maxDuration: '',
  };
  
  const [filter, setFilter] = useState<AuditLogFilter>(initialFilter);
  
  // Function to handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Function to load audit logs with current filters
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params from filter
      const params: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage
      };
      
      if (filter.startDate) {
        params.start_time = filter.startDate.toISOString();
      }
      
      if (filter.endDate) {
        params.end_time = filter.endDate.toISOString();
      }
      
      if (filter.userId) {
        params.user_id = filter.userId;
      }
      
      if (filter.userRole) {
        params.user_role = filter.userRole;
      }
      
      if (filter.path) {
        params.path = filter.path;
      }
      
      if (filter.statusCode) {
        params.status_code = parseInt(filter.statusCode);
      }
      
      if (filter.patientId) {
        params.patient_id = filter.patientId;
      }
      
      if (filter.isPhiAccess !== null) {
        params.is_phi_access = filter.isPhiAccess;
      }
      
      // Make API request
      const response = await axios.get('/api/audit/logs', { params });
      
      // Set logs and total count
      setLogs(response.data);
      setTotalCount(parseInt(response.headers['x-total-count'] || '0'));
      setError(null);
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
      setError(`Failed to load audit logs: ${err.message}`);
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filter, page, rowsPerPage]);
  
  // Function to load security alerts
  const loadSecurityAlerts = useCallback(async () => {
    try {
      const response = await axios.get('/api/audit/alerts');
      setAlerts(response.data);
    } catch (err: any) {
      console.error('Error loading security alerts:', err);
      // Don't set an error for alerts, just log it
    }
  }, []);
  
  // Function to load daily summary
  const loadDailySummary = useCallback(async () => {
    try {
      const response = await axios.get('/api/audit/summary/daily', {
        params: { days: 14 } // Get 2 weeks of data
      });
      setDailySummary(response.data);
    } catch (err: any) {
      console.error('Error loading daily summary:', err);
      // Don't set an error for summary, just log it
    }
  }, []);
  
  // Initial data load
  useEffect(() => {
    const fetchData = async () => {
      await loadAuditLogs();
      await loadSecurityAlerts();
      await loadDailySummary();
    };
    
    fetchData();
  }, [loadAuditLogs, loadSecurityAlerts, loadDailySummary]);
  
  // Handle filter changes with debounce
  const handleFilterChange = (name: keyof AuditLogFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset to first page when filter changes
    setPage(0);
  };
  
  // Debounced filter to avoid too many API calls
  const debouncedLoadLogs = useCallback(
    debounce(() => {
      loadAuditLogs();
    }, 500),
    [loadAuditLogs]
  );
  
  // Trigger debounced load when filter changes
  useEffect(() => {
    debouncedLoadLogs();
    return () => {
      debouncedLoadLogs.cancel();
    };
  }, [filter, page, rowsPerPage, debouncedLoadLogs]);
  
  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      // Build query params from filter
      const params: any = {
        format
      };
      
      if (filter.startDate) {
        params.start_time = filter.startDate.toISOString();
      }
      
      if (filter.endDate) {
        params.end_time = filter.endDate.toISOString();
      }
      
      if (filter.userId) {
        params.user_id = filter.userId;
      }
      
      if (filter.userRole) {
        params.user_role = filter.userRole;
      }
      
      if (filter.path) {
        params.path = filter.path;
      }
      
      if (filter.statusCode) {
        params.status_code = parseInt(filter.statusCode);
      }
      
      if (filter.patientId) {
        params.patient_id = filter.patientId;
      }
      
      if (filter.isPhiAccess !== null) {
        params.is_phi_access = filter.isPhiAccess;
      }
      
      // Make API request with responseType blob to handle file download
      const response = await axios.get('/api/audit/export', {
        params,
        responseType: 'blob'
      });
      
      // Create download link and trigger download
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `audit_logs_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error(`Error exporting logs as ${format}:`, err);
      setError(`Failed to export logs: ${err.message}`);
    }
  };
  
  // Handle row click to show details
  const handleRowClick = (log: AuditLog) => {
    setDetailDialog({
      open: true,
      log
    });
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setDetailDialog({
      open: false,
      log: null
    });
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilter(initialFilter);
  };
  
  // Refresh data
  const handleRefresh = async () => {
    await loadAuditLogs();
    await loadSecurityAlerts();
    await loadDailySummary();
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get status code color
  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warning';
    if (statusCode >= 300) return 'info';
    return 'success';
  };
  
  // Get HTTP method color
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'primary';
      case 'POST': return 'success';
      case 'PUT': return 'info';
      case 'PATCH': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };
  
  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Render the audit logs view
  const renderLogsView = () => (
    <Box>
      {/* Filter section */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Filter Audit Logs"
          action={
            <Box display="flex">
              <Button
                startIcon={<ClearIcon />}
                onClick={handleResetFilters}
                sx={{ mr: 1 }}
              >
                Reset
              </Button>
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
            <Grid item xs={12} md={6} lg={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={filter.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={filter.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="User ID"
                value={filter.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <FormControl fullWidth>
                <InputLabel>User Role</InputLabel>
                <Select
                  value={filter.userRole}
                  onChange={(e) => handleFilterChange('userRole', e.target.value)}
                  label="User Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="dentist">Dentist</MenuItem>
                  <MenuItem value="hygienist">Hygienist</MenuItem>
                  <MenuItem value="assistant">Assistant</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="founder">Founder</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="API Path"
                value={filter.path}
                onChange={(e) => handleFilterChange('path', e.target.value)}
                placeholder="/api/patients"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="Status Code"
                value={filter.statusCode}
                onChange={(e) => handleFilterChange('statusCode', e.target.value)}
                placeholder="200, 404, 500"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="Patient ID"
                value={filter.patientId}
                onChange={(e) => handleFilterChange('patientId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <FormControl fullWidth>
                <InputLabel>PHI Access</InputLabel>
                <Select
                  value={filter.isPhiAccess === null ? '' : filter.isPhiAccess.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('isPhiAccess', value === '' ? null : value === 'true');
                  }}
                  label="PHI Access"
                >
                  <MenuItem value="">All Access</MenuItem>
                  <MenuItem value="true">PHI Access Only</MenuItem>
                  <MenuItem value="false">Non-PHI Access Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  startIcon={<DownloadIcon />}
                  variant="outlined"
                  onClick={() => handleExport('csv')}
                >
                  Export CSV
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  variant="outlined"
                  onClick={() => handleExport('json')}
                >
                  Export JSON
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Results section */}
      <Card>
        <CardHeader
          title={`Audit Logs (${totalCount} total)`}
          subheader="Click on a row to view more details"
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table sx={{ minWidth: 650 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>PHI</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No audit logs match your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow
                        key={log.id}
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                          backgroundColor: log.status_code >= 400 ? 'rgba(255, 0, 0, 0.05)' : 'inherit'
                        }}
                        onClick={() => handleRowClick(log)}
                      >
                        <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell>
                          <Tooltip title={`ID: ${log.user_id}`}>
                            <span>{log.user_role}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.method} 
                            color={getMethodColor(log.method)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={log.path}>
                            <span>{log.path.length > 25 ? `${log.path.slice(0, 25)}...` : log.path}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.status_code} 
                            color={getStatusColor(log.status_code)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{formatDuration(log.duration_ms)}</TableCell>
                        <TableCell>
                          {log.is_phi_access ? (
                            <Chip icon={<CheckIcon />} label="PHI" color="warning" size="small" />
                          ) : (
                            <Chip icon={<ClearIcon />} label="No" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(log);
                          }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Detail dialog */}
      <Dialog
        open={detailDialog.open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Log Details
          {detailDialog.log && detailDialog.log.is_phi_access && (
            <Chip 
              icon={<WarningIcon />} 
              label="PHI Access" 
              color="warning" 
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {detailDialog.log && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Time</Typography>
                <Typography variant="body1">{formatTimestamp(detailDialog.log.timestamp)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">User</Typography>
                <Typography variant="body1">{detailDialog.log.user_id} ({detailDialog.log.user_role})</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">IP Address</Typography>
                <Typography variant="body1">{detailDialog.log.ip_address}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Method & Path</Typography>
                <Typography variant="body1">
                  <Chip 
                    label={detailDialog.log.method} 
                    color={getMethodColor(detailDialog.log.method)} 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                  {detailDialog.log.path}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Status Code</Typography>
                <Typography variant="body1">
                  <Chip 
                    label={detailDialog.log.status_code} 
                    color={getStatusColor(detailDialog.log.status_code)} 
                    size="small" 
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Duration</Typography>
                <Typography variant="body1">{formatDuration(detailDialog.log.duration_ms)}</Typography>
              </Grid>
              {detailDialog.log.patient_id && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Patient ID</Typography>
                  <Typography variant="body1">{detailDialog.log.patient_id}</Typography>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Correlation ID</Typography>
                <Typography variant="body1">{detailDialog.log.correlation_id}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">User Agent</Typography>
                <Typography variant="body1" noWrap>
                  {detailDialog.log.user_agent || "Not available"}
                </Typography>
              </Grid>
              
              {detailDialog.log.request_body && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Request Body</Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(detailDialog.log.request_body, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              )}
              
              {detailDialog.log.response_data && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Response Data</Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(detailDialog.log.response_data, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  
  // Render alerts view
  const renderAlertsView = () => (
    <Card>
      <CardHeader
        title="Security Alerts"
        subheader="Unusual access patterns detected in the system"
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadSecurityAlerts}
          >
            Refresh
          </Button>
        }
      />
      <CardContent>
        {alerts.length === 0 ? (
          <Alert severity="info">No security alerts detected</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Alert Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip
                        icon={<WarningIcon />}
                        label={alert.type.replace(/_/g, ' ')}
                        color={alert.severity === 'high' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{alert.severity.toUpperCase()}</TableCell>
                    <TableCell>
                      {alert.user_id && <span>User: {alert.user_id}</span>}
                      {alert.ip_address && <span>IP: {alert.ip_address}</span>}
                    </TableCell>
                    <TableCell>{alert.count} occurrences</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
  
  // Render summary view
  const renderSummaryView = () => (
    <Card>
      <CardHeader
        title="Access Summary"
        subheader="Overview of system access in the last 14 days"
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadDailySummary}
          >
            Refresh
          </Button>
        }
      />
      <CardContent>
        {dailySummary.length === 0 ? (
          <Alert severity="info">No summary data available</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Total Logs</TableCell>
                  <TableCell>PHI Accesses</TableCell>
                  <TableCell>Errors</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailySummary.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell>{day.date}</TableCell>
                    <TableCell>{day.total_logs}</TableCell>
                    <TableCell>
                      {day.phi_accesses > 0 ? (
                        <Chip
                          size="small"
                          label={day.phi_accesses}
                          color="warning"
                        />
                      ) : (
                        day.phi_accesses
                      )}
                    </TableCell>
                    <TableCell>
                      {day.errors > 0 ? (
                        <Chip
                          size="small"
                          label={day.errors}
                          color="error"
                        />
                      ) : (
                        day.errors
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
  
  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center">
        <AccessTimeIcon sx={{ mr: 1 }} /> HIPAA Audit Log Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Audit Logs" />
          <Tab label="Security Alerts" />
          <Tab label="Access Summary" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && renderLogsView()}
      {activeTab === 1 && renderAlertsView()}
      {activeTab === 2 && renderSummaryView()}
    </Box>
  );
};

export default AuditLogDashboard; 