import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Download as DownloadIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { fetchEventTypes, fetchAuditLogs, getExportUrl } from '../../api/audit';

interface AuditLog {
  id: number;
  event_type: string;
  user_id: number;
  patient_id: number | null;
  resource_type: string;
  resource_id: number;
  ip_address: string;
  timestamp: string;
  metadata: any;
}

interface EventTypes {
  treatment_plan: string[];
  clinical: string[];
  financial: string[];
  communication: string[];
}

export const AuditLogViewer: React.FC = () => {
  // State for filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [patientId, setPatientId] = useState<string>('');
  const [eventType, setEventType] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [resourceType, setResourceType] = useState<string>('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch event types for dropdown
  const { data: eventTypes } = useQuery<EventTypes>(['eventTypes'], fetchEventTypes);

  // Fetch audit logs with filters
  const { data: logs, isLoading } = useQuery<AuditLog[]>(
    ['auditLogs', startDate, endDate, patientId, eventType, userId, resourceType, page, rowsPerPage],
    () => fetchAuditLogs({
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      patientId: patientId ? parseInt(patientId) : undefined,
      eventType,
      userId: userId ? parseInt(userId) : undefined,
      resourceType,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    })
  );

  // Handle pagination changes
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format metadata for display
  const formatMetadata = (metadata: any) => {
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  // Export functions
  const exportToCsv = () => {
    const filters = {
      eventType,
      userId,
      resourceType,
      startDate,
      endDate
    };
    
    window.open(getExportUrl('csv', filters), '_blank');
  };
  
  const exportToJson = () => {
    const filters = {
      eventType,
      userId,
      resourceType,
      startDate,
      endDate
    };
    
    window.open(getExportUrl('json', filters), '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Audit Log Viewer
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  label="Event Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {eventTypes && Object.entries(eventTypes).map(([category, types]) => (
                    <React.Fragment key={category}>
                      <MenuItem disabled sx={{ opacity: 0.7 }}>
                        {category.toUpperCase()}
                      </MenuItem>
                      {types.map((type) => (
                        <MenuItem key={type} value={type} sx={{ pl: 4 }}>
                          {type}
                        </MenuItem>
                      ))}
                    </React.Fragment>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Resource Type</InputLabel>
                <Select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  label="Resource Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="treatment_plan">Treatment Plan</MenuItem>
                  <MenuItem value="procedure">Procedure</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="insurance_claim">Insurance Claim</MenuItem>
                  <MenuItem value="communication">Communication</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Tooltip title="Export to CSV">
                <IconButton onClick={exportToCsv} color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Tooltip title="Export to JSON">
                <IconButton onClick={exportToJson} color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Patient ID</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No audit logs found</TableCell>
              </TableRow>
            ) : (
              logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell>{log.event_type}</TableCell>
                  <TableCell>{log.user_id}</TableCell>
                  <TableCell>{log.patient_id}</TableCell>
                  <TableCell>{`${log.resource_type} #${log.resource_id}`}</TableCell>
                  <TableCell>{log.ip_address}</TableCell>
                  <TableCell>{formatMetadata(log.metadata)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={-1}  // Server-side pagination
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
}; 