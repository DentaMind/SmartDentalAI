import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import { format, addMinutes } from 'date-fns';

import { fetchPatients } from '@/api/patients';
import { fetchAppointmentTypes } from '@/api/scheduler';

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  providerId: number | null;
  initialDate?: Date;
  appointment?: Appointment;
  onSave: (data: AppointmentFormData) => Promise<void>;
}

interface AppointmentFormData {
  provider_id: number;
  patient_id: number;
  start_time: string;
  end_time: string;
  type: string;
  notes?: string;
}

const DEFAULT_DURATION = 30; // minutes

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  open,
  onClose,
  providerId,
  initialDate,
  appointment,
  onSave
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    provider_id: providerId || 0,
    patient_id: 0,
    start_time: initialDate?.toISOString() || new Date().toISOString(),
    end_time: addMinutes(initialDate || new Date(), DEFAULT_DURATION).toISOString(),
    type: '',
    notes: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch patients
  const {
    data: patients,
    isLoading: patientsLoading,
    error: patientsError
  } = useQuery(['patients'], fetchPatients);
  
  // Fetch appointment types
  const {
    data: appointmentTypes,
    isLoading: typesLoading,
    error: typesError
  } = useQuery(['appointmentTypes'], fetchAppointmentTypes);
  
  // Update form when editing existing appointment
  useEffect(() => {
    if (appointment) {
      setFormData({
        provider_id: appointment.provider_id,
        patient_id: appointment.patient_id,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        type: appointment.type,
        notes: appointment.notes || ''
      });
    }
  }, [appointment]);
  
  const handleStartTimeChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        start_time: date.toISOString(),
        end_time: addMinutes(date, DEFAULT_DURATION).toISOString()
      }));
    }
  };
  
  const handleEndTimeChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        end_time: date.toISOString()
      }));
    }
  };
  
  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err) {
      setError('Failed to save appointment');
      console.error('Appointment save error:', err);
    } finally {
      setSaving(false);
    }
  };
  
  if (patientsLoading || typesLoading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {appointment ? 'Edit Appointment' : 'New Appointment'}
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select
                value={formData.patient_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    patient_id: e.target.value as number
                  }))
                }
              >
                {patients?.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Appointment Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as string
                  }))
                }
              >
                {appointmentTypes?.map((type) => (
                  <MenuItem key={type.id} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6}>
            <DateTimePicker
              label="Start Time"
              value={new Date(formData.start_time)}
              onChange={handleStartTimeChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <DateTimePicker
              label="End Time"
              value={new Date(formData.end_time)}
              onChange={handleEndTimeChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Notes"
              multiline
              rows={4}
              fullWidth
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value
                }))
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving && <CircularProgress size={20} />}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentDialog; 