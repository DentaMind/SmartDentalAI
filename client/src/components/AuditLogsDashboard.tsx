import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  TablePagination,
  Skeleton,
} from '@mui/material';
import { Search, ExpandMore, ExpandLess, GetApp } from '@mui/icons-material';
import { DateRangePicker } from './DateRangePicker';
import { BRANDING } from '../constants/branding';

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export const AuditLogsDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    userId: '',
    entityType: '',
    entityId: '',
    action: '',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate.toISOString());
      }
      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }
      if (filters.entityType) {
        queryParams.append('entityType', filters.entityType);
      }
      if (filters.entityId) {
        queryParams.append('entityId', filters.entityId);
      }
      if (filters.action) {
        queryParams.append('action', filters.action);
      }
      queryParams.append('offset', (page * rowsPerPage).toString());
      queryParams.append('limit', rowsPerPage.toString());

      const response = await api.get(`/audit/logs?${queryParams.toString()}`);
      setLogs(response.data);
      setTotalCount(response.data.length);
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchLogs();
    }
  }, [page, rowsPerPage, filters, currentUser?.role]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.entityId) queryParams.append('entityId', filters.entityId);
      if (filters.action) queryParams.append('action', filters.action);

      const response = await api.get(`/audit/logs/export?${queryParams.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm');
      link.setAttribute('download', `dentamind-audit-logs-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export audit logs');
      console.error('Error exporting audit logs:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          Access Denied: Admin privileges required
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Audit Logs</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={exporting ? <CircularProgress size={20} /> : <GetApp />}
          onClick={handleExport}
          disabled={exporting || loading}
          sx={{
            bgcolor: BRANDING.colors.primary,
            '&:hover': {
              bgcolor: BRANDING.colors.primary,
              opacity: 0.9,
            },
          }}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </Box>

      <Box mb={3} display="flex" gap={2} flexWrap="wrap">
        <DateRangePicker
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(start, end) => setFilters(prev => ({ ...prev, startDate: start, endDate: end }))}
        />
        <TextField
          label="User ID"
          value={filters.userId}
          onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
          size="small"
        />
        <TextField
          label="Entity Type"
          value={filters.entityType}
          onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
          size="small"
        />
        <TextField
          label="Entity ID"
          value={filters.entityId}
          onChange={(e) => setFilters(prev => ({ ...prev, entityId: e.target.value }))}
          size="small"
        />
        <TextField
          label="Action"
          value={filters.action}
          onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
          size="small"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Entity ID</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton animation="wave" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow>
                    <TableCell>{format(new Date(log.timestamp), 'PPpp')}</TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell>{log.entityId}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      >
                        {expandedLogId === log.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  {expandedLogId === log.id && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box p={2}>
                          <Typography variant="subtitle1" gutterBottom>
                            Details
                          </Typography>
                          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(log.details, null, 2)}
                          </Typography>
                          {log.metadata && (
                            <>
                              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                Metadata
                              </Typography>
                              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(log.metadata, null, 2)}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
}; 