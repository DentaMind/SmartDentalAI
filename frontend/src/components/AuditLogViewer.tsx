import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { auditService, AuditLog, AuditAction, AuditEntityType } from '../services/auditService';

const AuditLogViewer: React.FC = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | ''>('');
  const [selectedEntityType, setSelectedEntityType] = useState<AuditEntityType | ''>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // Fetch audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await auditService.getAuditLogs({
          page: page + 1,
          per_page: rowsPerPage,
          action: selectedAction || undefined,
          entity_type: selectedEntityType || undefined,
          search: searchQuery || undefined,
          start_date: dateRange.start || undefined,
          end_date: dateRange.end || undefined,
        });
        setLogs(response.logs);
        setTotalCount(response.total);
        setError(null);
      } catch (err) {
        setError('Failed to fetch audit logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, rowsPerPage, selectedAction, selectedEntityType, searchQuery, dateRange]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);
      await auditService.downloadExportedLogs({
        action: selectedAction || undefined,
        entity_type: selectedEntityType || undefined,
        search: searchQuery || undefined,
        start_date: dateRange.start || undefined,
        end_date: dateRange.end || undefined,
      });
    } catch (err) {
      setError('Failed to export audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get color for action chip
  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return 'success';
      case AuditAction.UPDATE:
        return 'warning';
      case AuditAction.DELETE:
        return 'error';
      case AuditAction.VIEW:
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Audit Log Viewer</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {totalCount} total entries
            </Typography>
          </Box>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search"
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={selectedAction}
                    label="Action"
                    onChange={(e) => setSelectedAction(e.target.value as AuditAction)}
                  >
                    <MenuItem value="">All Actions</MenuItem>
                    {Object.values(AuditAction).map((action) => (
                      <MenuItem key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={selectedEntityType}
                    label="Entity Type"
                    onChange={(e) => setSelectedEntityType(e.target.value as AuditEntityType)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {Object.values(AuditEntityType).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Error Display */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Audit Logs Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity Type</TableCell>
                  <TableCell>Entity ID</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>{log.user_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={getActionColor(log.action)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell>{log.entity_id}</TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                      <TableCell>
                        <Tooltip title={JSON.stringify(log.details, null, 2)}>
                          <IconButton size="small">
                            <FilterIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
            <IconButton
              onClick={handleExport}
              disabled={loading}
              color="primary"
              sx={{ ml: 2 }}
            >
              <DownloadIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuditLogViewer; 