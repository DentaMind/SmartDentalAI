import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';

interface TimeClockEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  clock_in_time: string;
  clock_out_time: string | null;
  breaks_taken: number;
  total_hours: number | null;
  is_manual_adjustment: boolean;
  adjustment_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Break {
  id: string;
  timeclock_id: string;
  break_start: string;
  break_end: string | null;
  break_type: string;
  notes: string | null;
}

interface TimeClockSummary {
  total_entries: number;
  total_hours: number;
  average_hours_per_day: number;
  break_analysis: {
    total_breaks: number;
    average_break_duration: number;
    break_types: Record<string, number>;
  };
  employee_summaries: {
    employee_id: string;
    employee_name: string;
    total_hours: number;
    entries_count: number;
  }[];
}

const TimeClockSummary: React.FC = () => {
  const [entries, setEntries] = useState<TimeClockEntry[]>([]);
  const [summary, setSummary] = useState<TimeClockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfDay(new Date()));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeClockEntry | null>(null);
  const [adjustment, setAdjustment] = useState({
    clock_in_time: '',
    clock_out_time: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedEmployee]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        ...(selectedEmployee !== 'all' && { employee_id: selectedEmployee }),
      });

      const [entriesResponse, summaryResponse] = await Promise.all([
        fetch(`/api/office/timeclock/summary?${params}`),
        fetch(`/api/office/timeclock/analytics?${params}`),
      ]);

      if (!entriesResponse.ok || !summaryResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [entriesData, summaryData] = await Promise.all([
        entriesResponse.json(),
        summaryResponse.json(),
      ]);

      setEntries(entriesData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async () => {
    if (!selectedEntry) return;

    try {
      const response = await fetch(`/api/office/timeclock/${selectedEntry.id}/adjust`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clock_in_time: adjustment.clock_in_time,
          clock_out_time: adjustment.clock_out_time,
          adjustment_reason: adjustment.reason,
          notes: adjustment.notes,
          is_manual_adjustment: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to update time entry');
      await fetchData();
      setAdjustmentDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update time entry');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        ...(selectedEmployee !== 'all' && { employee_id: selectedEmployee }),
        format: 'csv',
      });

      const response = await fetch(`/api/office/timeclock/export?${params}`);
      if (!response.ok) throw new Error('Failed to export data');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeclock-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Time Clock Summary
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(date) => date && setStartDate(startOfDay(date))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(date) => date && setEndDate(endOfDay(date))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  label="Employee"
                >
                  <MenuItem value="all">All Employees</MenuItem>
                  {summary?.employee_summaries.map((employee) => (
                    <MenuItem key={employee.employee_id} value={employee.employee_id}>
                      {employee.employee_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Summary Cards */}
          {summary && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Hours
                    </Typography>
                    <Typography variant="h4">
                      {summary.total_hours.toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Average Hours/Day
                    </Typography>
                    <Typography variant="h4">
                      {summary.average_hours_per_day.toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Breaks
                    </Typography>
                    <Typography variant="h4">
                      {summary.break_analysis.total_breaks}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Time Entries Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Breaks</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.employee_name}</TableCell>
                    <TableCell>
                      {format(new Date(entry.clock_in_time), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      {entry.clock_out_time
                        ? format(new Date(entry.clock_out_time), 'PPpp')
                        : 'In Progress'}
                    </TableCell>
                    <TableCell>
                      {entry.total_hours?.toFixed(1) || '-'}
                    </TableCell>
                    <TableCell>{entry.breaks_taken}</TableCell>
                    <TableCell>
                      {entry.is_manual_adjustment ? (
                        <Chip
                          label="Adjusted"
                          color="warning"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Normal"
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Adjust Time">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setAdjustment({
                              clock_in_time: entry.clock_in_time,
                              clock_out_time: entry.clock_out_time || '',
                              reason: entry.adjustment_reason || '',
                              notes: entry.notes || '',
                            });
                            setAdjustmentDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export Data
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onClose={() => setAdjustmentDialogOpen(false)}>
        <DialogTitle>Adjust Time Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adjustment Reason"
                value={adjustment.reason}
                onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={adjustment.notes}
                onChange={(e) => setAdjustment({ ...adjustment, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdjustment} variant="contained" color="primary">
            Save Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TimeClockSummary; 