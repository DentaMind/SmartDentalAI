import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import { Prescription, PrescriptionFormData } from '../../types/prescriptions';
import { createPrescription, updatePrescription } from '../../services/prescriptionService';

interface PrescriptionFormProps {
  patientId: string;
  prescription?: Prescription;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  patientId,
  prescription,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PrescriptionFormData>({
    medicationName: '',
    dosage: '',
    frequency: '',
    route: 'oral',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    instructions: '',
    refills: 0,
    status: 'active',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PrescriptionFormData, string>>>({});

  useEffect(() => {
    if (prescription) {
      setFormData({
        medicationName: prescription.medicationName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        route: prescription.route,
        startDate: new Date(prescription.startDate).toISOString().split('T')[0],
        endDate: new Date(prescription.endDate).toISOString().split('T')[0],
        instructions: prescription.instructions,
        refills: prescription.refills,
        status: prescription.status,
      });
    }
  }, [prescription]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PrescriptionFormData, string>> = {};

    if (!formData.medicationName.trim()) {
      newErrors.medicationName = 'Medication name is required';
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Dosage is required';
    }

    if (!formData.frequency.trim()) {
      newErrors.frequency = 'Frequency is required';
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate < startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (prescription) {
        await updatePrescription(prescription.id, formData);
      } else {
        await createPrescription(patientId, formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving prescription:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {prescription ? 'Edit Prescription' : 'New Prescription'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Medication Name"
              name="medicationName"
              value={formData.medicationName}
              onChange={handleChange}
              error={!!errors.medicationName}
              helperText={errors.medicationName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Dosage"
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              error={!!errors.dosage}
              helperText={errors.dosage}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              error={!!errors.frequency}
              helperText={errors.frequency}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Route</InputLabel>
              <Select
                name="route"
                value={formData.route}
                onChange={handleChange}
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
            <TextField
              fullWidth
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              error={!!errors.endDate}
              helperText={errors.endDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              error={!!errors.instructions}
              helperText={errors.instructions}
              multiline
              rows={4}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Refills"
              name="refills"
              type="number"
              value={formData.refills}
              onChange={handleChange}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
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
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="contained" type="submit">
                {prescription ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default PrescriptionForm; 