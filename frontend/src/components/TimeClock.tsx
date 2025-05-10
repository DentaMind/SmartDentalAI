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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse, differenceInMinutes } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import HistoryIcon from '@mui/icons-material/History';

interface TimeClockEntry {
  id: string;
  employee_id: string;
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

const TimeClock: React.FC = () => {
  const [currentEntry, setCurrentEntry] = useState<TimeClockEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [newBreak, setNewBreak] = useState<Partial<Break>>({
    break_type: 'lunch',
    notes: '',
  });

  useEffect(() => {
    fetchCurrentEntry();
  }, []);

  const fetchCurrentEntry = async () => {
    try {
      const response = await fetch('/api/office/timeclock/current');
      if (!response.ok) throw new Error('Failed to fetch time clock status');
      const data = await response.json();
      setCurrentEntry(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load time clock status');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const response = await fetch('/api/office/timeclock/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: 'current-user-id', // This should come from auth context
          clock_in_time: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to clock in');
      await fetchCurrentEntry();
      setSuccess('Successfully clocked in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      if (!currentEntry) return;

      const response = await fetch(`/api/office/timeclock/${currentEntry.id}/clock-out`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clock_out_time: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to clock out');
      await fetchCurrentEntry();
      setSuccess('Successfully clocked out');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out');
    }
  };

  const handleStartBreak = async () => {
    if (!currentEntry) return;
    setNewBreak({
      break_start: new Date().toISOString(),
      break_type: 'lunch',
      notes: '',
    });
    setBreakDialogOpen(true);
  };

  const handleEndBreak = async () => {
    if (!currentEntry) return;
    try {
      const response = await fetch(`/api/office/timeclock/${currentEntry.id}/breaks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBreak,
          break_end: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to record break');
      await fetchCurrentEntry();
      setBreakDialogOpen(false);
      setSuccess('Break recorded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record break');
    }
  };

  const calculateTimeElapsed = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const minutes = differenceInMinutes(endDate, startDate);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
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
            Time Clock
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Current Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <AccessTimeIcon fontSize="large" />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6">
                        Current Status: {currentEntry ? 'Clocked In' : 'Clocked Out'}
                      </Typography>
                      {currentEntry && (
                        <Typography variant="body2" color="text.secondary">
                          Clocked in at: {format(new Date(currentEntry.clock_in_time), 'PPpp')}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item>
                      {!currentEntry ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleClockIn}
                          startIcon={<TimerIcon />}
                        >
                          Clock In
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={handleClockOut}
                          startIcon={<TimerIcon />}
                        >
                          Clock Out
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Break Management */}
            {currentEntry && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item>
                        <HistoryIcon fontSize="large" />
                      </Grid>
                      <Grid item xs>
                        <Typography variant="h6">
                          Breaks Taken: {currentEntry.breaks_taken}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Button
                          variant="outlined"
                          onClick={handleStartBreak}
                        >
                          Start Break
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>

      {/* Break Dialog */}
      <Dialog open={breakDialogOpen} onClose={() => setBreakDialogOpen(false)}>
        <DialogTitle>Record Break</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Break Type</InputLabel>
                <Select
                  value={newBreak.break_type}
                  onChange={(e) => setNewBreak({ ...newBreak, break_type: e.target.value })}
                  label="Break Type"
                >
                  <MenuItem value="lunch">Lunch</MenuItem>
                  <MenuItem value="rest">Rest Break</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={newBreak.notes}
                onChange={(e) => setNewBreak({ ...newBreak, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBreakDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEndBreak} variant="contained" color="primary">
            End Break
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TimeClock; 