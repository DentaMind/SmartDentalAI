import React, { useState } from 'react';
import { useAppointmentEvents } from '@/hooks/useAppointmentEvents';
import { useMutation, useQuery } from 'react-query';
import { apiRequest } from '@/lib/apiRequest';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';

interface AppointmentFormProps {
  patientId: number;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ patientId }) => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(30); // minutes
  const [type, setType] = useState('');
  const [provider, setProvider] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    collectAppointmentScheduled,
    collectAppointmentRescheduled,
    collectAppointmentCancelled,
    collectAppointmentReminder
  } = useAppointmentEvents();

  const { data: providers } = useQuery(
    'providers',
    () => apiRequest('GET', '/api/providers')
  );

  const { data: appointmentTypes } = useQuery(
    'appointmentTypes',
    () => apiRequest('GET', '/api/appointment-types')
  );

  const scheduleMutation = useMutation(
    async (data: any) => {
      const response = await apiRequest('POST', `/api/patients/${patientId}/appointments`, data);
      return response;
    },
    {
      onSuccess: async (response) => {
        await collectAppointmentScheduled(patientId, response.appointmentId, {
          startTime: startTime?.toISOString(),
          duration,
          type,
          providerId: provider,
          source: 'user'
        });
      },
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startTime || !provider || !type) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await scheduleMutation.mutateAsync({
        startTime: startTime.toISOString(),
        duration,
        type,
        providerId: provider,
        notes
      });

      // Reset form
      setStartTime(null);
      setType('');
      setProvider(null);
      setNotes('');
    } catch (err) {
      // Error handling is done in mutation options
    }
  };

  const handleCancel = async (appointmentId: number) => {
    try {
      await apiRequest('POST', `/api/appointments/${appointmentId}/cancel`);
      await collectAppointmentCancelled(patientId, appointmentId, {
        source: 'user',
        reason: 'user_request'
      });
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const handleReschedule = async (appointmentId: number, newStartTime: Date) => {
    try {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/reschedule`, {
        startTime: newStartTime.toISOString()
      });

      await collectAppointmentRescheduled(patientId, appointmentId, {
        oldStartTime: startTime?.toISOString(),
        newStartTime: newStartTime.toISOString(),
        source: 'user'
      });

      return response;
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      throw error;
    }
  };

  return (
    <Box component={Paper} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        Schedule Appointment
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DateTimePicker
              label="Appointment Time"
              value={startTime}
              onChange={(newValue) => setStartTime(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Duration (minutes)</InputLabel>
              <Select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
              >
                <MenuItem value={15}>15 minutes</MenuItem>
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={45}>45 minutes</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Appointment Type</InputLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                {appointmentTypes?.map((appType: any) => (
                  <MenuItem key={appType.id} value={appType.id}>
                    {appType.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={providers || []}
              getOptionLabel={(option: any) => `${option.firstName} ${option.lastName}`}
              value={providers?.find((p: any) => p.id === provider) || null}
              onChange={(_, newValue) => setProvider(newValue?.id || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Provider"
                  required
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={scheduleMutation.isLoading}
            >
              Schedule Appointment
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}; 