import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Grid,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PrescriptionFormData } from '../types/prescriptions';
import { prescriptionService } from '../services/prescriptionService';
import { Prescription } from '../types/prescriptions';

interface PrescriptionFormProps {
  patientId: string;
  prescriptionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  patientId,
  prescriptionId,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Prescription>>({
    patientId,
    medicationName: '',
    dosage: '',
    frequency: '',
    route: '',
    startDate: new Date(),
    endDate: new Date(),
    refillsRemaining: 0,
    instructions: '',
    status: 'active',
  });

  useEffect(() => {
    if (prescriptionId) {
      const fetchPrescription = async () => {
        try {
          setLoading(true);
          const prescription = await prescriptionService.getPrescription(prescriptionId);
          setFormData(prescription);
          setError(null);
        } catch (err) {
          setError('Failed to fetch prescription');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchPrescription();
    }
  }, [prescriptionId]);

  const handleChange = (field: keyof Prescription) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        [field]: date,
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      if (prescriptionId) {
        await prescriptionService.updatePrescription(prescriptionId, formData as Prescription);
      } else {
        await prescriptionService.createPrescription(formData as Prescription);
      }
      onSuccess?.();
    } catch (err) {
      setError('Failed to save prescription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.medicationName) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {prescriptionId ? 'Edit Prescription' : 'New Prescription'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Medication Name"
              value={formData.medicationName}
              onChange={handleChange('medicationName')}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Dosage"
              value={formData.dosage}
              onChange={handleChange('dosage')}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Frequency"
              value={formData.frequency}
              onChange={handleChange('frequency')}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Route"
              value={formData.route}
              onChange={handleChange('route')}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Status"
                required
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={handleDateChange('startDate')}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={handleDateChange('endDate')}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Refills Remaining"
              type="number"
              value={formData.refillsRemaining}
              onChange={handleChange('refillsRemaining')}
              required
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions"
              multiline
              rows={4}
              value={formData.instructions}
              onChange={handleChange('instructions')}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PrescriptionFormData, string>> = {};
    
    if (!formData.medicationName) {
      newErrors.medicationName = 'Medication name is required';
    }
    if (!formData.dosage) {
      newErrors.dosage = 'Dosage is required';
    }
    if (!formData.frequency) {
      newErrors.frequency = 'Frequency is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.refills < 0) {
      newErrors.refills = 'Refills cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const handleChange = (field: keyof PrescriptionFormData) => (
    e: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {initialData ? 'Edit Prescription' : 'New Prescription'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Medication Name"
                value={formData.medicationName}
                onChange={handleChange('medicationName')}
                error={!!errors.medicationName}
                helperText={errors.medicationName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dosage"
                value={formData.dosage}
                onChange={handleChange('dosage')}
                error={!!errors.dosage}
                helperText={errors.dosage}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Frequency"
                value={formData.frequency}
                onChange={handleChange('frequency')}
                error={!!errors.frequency}
                helperText={errors.frequency}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.route}>
                <InputLabel>Route</InputLabel>
                <Select
                  value={formData.route}
                  onChange={handleChange('route')}
                  label="Route"
                >
                  <MenuItem value="oral">Oral</MenuItem>
                  <MenuItem value="topical">Topical</MenuItem>
                  <MenuItem value="injection">Injection</MenuItem>
                  <MenuItem value="inhalation">Inhalation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={new Date(formData.startDate)}
                onChange={(date) => {
                  if (date) {
                    setFormData(prev => ({
                      ...prev,
                      startDate: date.toISOString(),
                    }));
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate,
                    required: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={new Date(formData.endDate)}
                onChange={(date) => {
                  if (date) {
                    setFormData(prev => ({
                      ...prev,
                      endDate: date.toISOString(),
                    }));
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.endDate,
                    helperText: errors.endDate,
                    required: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Instructions"
                value={formData.instructions}
                onChange={handleChange('instructions')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Refills"
                value={formData.refills}
                onChange={handleChange('refills')}
                error={!!errors.refills}
                helperText={errors.refills}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" color="primary">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  {initialData ? 'Update' : 'Create'} Prescription
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </LocalizationProvider>
  );
};

export default PrescriptionForm; 