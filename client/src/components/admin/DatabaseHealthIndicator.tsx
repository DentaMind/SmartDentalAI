import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import LinkIcon from '@mui/icons-material/Link';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import API from '../../lib/api';

interface DbHealth {
  status: string;
  tables: {
    status: string;
    expected_tables: string[];
    actual_tables: string[];
    missing_tables: string[];
    unexpected_tables: string[];
  };
  foreign_keys: {
    status: string;
    total_foreign_keys: number;
    broken_foreign_keys: Array<{
      table: string;
      column: string;
      ref_table: string;
      ref_column: string;
      issue?: string;
    }>;
  };
  indexes: {
    status: string;
    missing_indexes: Array<{
      table: string;
      column: string;
      description?: string;
      recommended?: boolean;
    }>;
  };
  issues: string[];
  check_duration_ms: number;
  last_check_time: string | null;
  is_stale: boolean;
  error?: string;
}

interface MigrationStatus {
  current_revision: string;
  head_revisions: string[];
  is_up_to_date: boolean;
  available_revisions: Array<{
    id: string;
    name: string;
  }>;
  revision_count: number;
  multiple_heads: boolean;
}

const DatabaseHealthIndicator: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Get status icon based on health status
  const getStatusIcon = (status: string, fontSize: 'small' | 'medium' | 'large' = 'medium') => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return <CheckCircleIcon fontSize={fontSize} color="success" />;
      case 'warning':
        return <WarningIcon fontSize={fontSize} color="warning" />;
      case 'unhealthy':
      case 'error':
        return <ErrorIcon fontSize={fontSize} color="error" />;
      default:
        return <InfoIcon fontSize={fontSize} color="info" />;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'unhealthy':
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };
  
  // Get database health status
  const fetchDatabaseHealth = async () => {
    try {
      setRefreshing(true);
      const response = await API.get('/api/admin/db-health');
      setDbHealth(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching database health:', err);
      setError('Failed to fetch database health');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Get migration status
  const fetchMigrationStatus = async () => {
    try {
      const response = await API.get('/api/admin/db-migration-status');
      setMigrationStatus(response);
    } catch (err) {
      console.error('Error fetching migration status:', err);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchDatabaseHealth(),
          fetchMigrationStatus()
        ]);
      } catch (err) {
        console.error('Error loading database data:', err);
        setError('Failed to load database status');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Open details dialog
  const handleOpenDetails = () => {
    setDetailsOpen(true);
  };
  
  // Close details dialog
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };
  
  // Format timestamp
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };
  
  // Render loading state
  if (loading && !dbHealth) {
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2">Loading database status...</Typography>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="body2">Error: {error}</Typography>
      </Alert>
    );
  }
  
  return (
    <>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <StorageIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Database Health</Typography>
            </Box>
            <Box>
              <Tooltip title="Last updated">
                <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                  {formatTime(dbHealth?.last_check_time)}
                </Typography>
              </Tooltip>
              <Button 
                size="small" 
                variant="outlined"
                onClick={fetchDatabaseHealth}
                disabled={refreshing}
                startIcon={refreshing ? <CircularProgress size={16} /> : undefined}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          </Box>
          
          {dbHealth?.is_stale && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Health data is stale. Consider refreshing for current status.
            </Alert>
          )}
          
          <Box 
            sx={{ 
              p: 2, 
              borderRadius: 1, 
              backgroundColor: alpha(getStatusColor(dbHealth?.status || 'error'), 0.1),
              borderLeft: `4px solid ${getStatusColor(dbHealth?.status || 'error')}`,
              mb: 2
            }}
          >
            <Box display="flex" alignItems="center">
              {getStatusIcon(dbHealth?.status || 'error')}
              <Typography variant="body1" fontWeight="bold" sx={{ ml: 1 }}>
                Database Status: {dbHealth?.status === 'healthy' ? 'Healthy' : 
                                dbHealth?.status === 'warning' ? 'Warnings' : 'Issues Detected'}
              </Typography>
            </Box>
            
            {dbHealth?.issues && dbHealth.issues.length > 0 && (
              <Box mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Found {dbHealth.issues.length} issue{dbHealth.issues.length !== 1 ? 's' : ''}:
                </Typography>
                <List dense disablePadding>
                  {dbHealth.issues.slice(0, 3).map((issue, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <WarningIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={issue} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                  {dbHealth.issues.length > 3 && (
                    <ListItem disablePadding>
                      <ListItemText 
                        primary={`And ${dbHealth.issues.length - 3} more...`}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} 
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderColor: getStatusColor(dbHealth?.tables?.status || 'error')
                }}
              >
                <TableChartIcon 
                  fontSize="small" 
                  sx={{ mr: 1, color: getStatusColor(dbHealth?.tables?.status || 'error') }} 
                />
                <Box>
                  <Typography variant="body2" fontWeight="medium">Tables</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dbHealth?.tables?.actual_tables?.length || 0} tables, 
                    {dbHealth?.tables?.missing_tables?.length || 0} missing
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderColor: getStatusColor(dbHealth?.foreign_keys?.status || 'error')
                }}
              >
                <LinkIcon 
                  fontSize="small" 
                  sx={{ mr: 1, color: getStatusColor(dbHealth?.foreign_keys?.status || 'error') }} 
                />
                <Box>
                  <Typography variant="body2" fontWeight="medium">Foreign Keys</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dbHealth?.foreign_keys?.total_foreign_keys || 0} relations, 
                    {dbHealth?.foreign_keys?.broken_foreign_keys?.length || 0} broken
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderColor: getStatusColor(dbHealth?.indexes?.status || 'error')
                }}
              >
                <QueryStatsIcon 
                  fontSize="small" 
                  sx={{ mr: 1, color: getStatusColor(dbHealth?.indexes?.status || 'error') }} 
                />
                <Box>
                  <Typography variant="body2" fontWeight="medium">Indexes</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dbHealth?.indexes?.missing_indexes?.length || 0} missing indexes
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {migrationStatus && (
            <Box mt={2}>
              <Accordion variant="outlined">
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center">
                    {migrationStatus.is_up_to_date 
                      ? <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                      : <WarningIcon fontSize="small" color="warning" sx={{ mr: 1 }} />
                    }
                    <Typography variant="body2">
                      Migration Status: {migrationStatus.is_up_to_date ? 'Up to date' : 'Outdated'}
                    </Typography>
                    
                    {migrationStatus.multiple_heads && (
                      <Chip 
                        label="Multiple Heads" 
                        size="small" 
                        color="warning" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" gutterBottom>
                    Current Revision: <code>{migrationStatus.current_revision || 'None'}</code>
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    Head Revision{migrationStatus.head_revisions.length > 1 ? 's' : ''}:
                  </Typography>
                  
                  <List dense disablePadding sx={{ ml: 2 }}>
                    {migrationStatus.head_revisions.map((rev, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText 
                          primary={<code>{rev}</code>}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {migrationStatus.multiple_heads && (
                    <Alert severity="warning" sx={{ mt: 2, mb: 1 }}>
                      Multiple migration heads detected! This could indicate a branched migration history.
                      Consider running <code>alembic merge heads</code> to resolve this issue.
                    </Alert>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    Total revisions: {migrationStatus.revision_count}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
          
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button size="small" onClick={handleOpenDetails}>
              View Detailed Report
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {/* Detailed Health Report Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <StorageIcon sx={{ mr: 1 }} />
            Database Health Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>
            Last Check: {formatTime(dbHealth?.last_check_time)}
          </Typography>
          
          {dbHealth?.tables?.missing_tables?.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom color="error">
                Missing Tables
              </Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <List dense disablePadding>
                  {dbHealth.tables.missing_tables.map((table, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText primary={table} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
          
          {dbHealth?.foreign_keys?.broken_foreign_keys?.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom color="error">
                Broken Foreign Keys
              </Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <List dense disablePadding>
                  {dbHealth.foreign_keys.broken_foreign_keys.map((fk, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText 
                        primary={`${fk.table}.${fk.column} → ${fk.ref_table}.${fk.ref_column}`}
                        secondary={fk.issue} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
          
          {dbHealth?.indexes?.missing_indexes?.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom color="warning.main">
                Missing Indexes
              </Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <List dense disablePadding>
                  {dbHealth.indexes.missing_indexes.map((idx, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText 
                        primary={`${idx.table}.${idx.column}`}
                        secondary={idx.description} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
          
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Table Status
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Expected Tables ({dbHealth?.tables?.expected_tables?.length || 0})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List dense disablePadding>
                      {dbHealth?.tables?.expected_tables?.map((table, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemText 
                            primary={table}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Unexpected Tables ({dbHealth?.tables?.unexpected_tables?.length || 0})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List dense disablePadding>
                      {dbHealth?.tables?.unexpected_tables?.length === 0 ? (
                        <ListItem disablePadding>
                          <ListItemText 
                            primary="No unexpected tables"
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                        </ListItem>
                      ) : (
                        dbHealth?.tables?.unexpected_tables?.map((table, index) => (
                          <ListItem key={index} disablePadding>
                            <ListItemText 
                              primary={table}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          {migrationStatus && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Recent Migrations
              </Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <List dense disablePadding>
                  {migrationStatus.available_revisions.slice(0, 10).map((rev, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText 
                        primary={rev.name}
                        secondary={`Revision: ${rev.id}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                  {migrationStatus.available_revisions.length > 10 && (
                    <ListItem disablePadding>
                      <ListItemText 
                        primary={`And ${migrationStatus.available_revisions.length - 10} more...`}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          <Button 
            variant="contained" 
            onClick={fetchDatabaseHealth}
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={16} /> : undefined}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DatabaseHealthIndicator; 