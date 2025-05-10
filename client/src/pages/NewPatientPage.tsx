import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

interface FormData {
  name: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  insurance: {
    provider: string;
    memberId: string;
    groupNumber: string;
    coverage: string;
  };
}

/**
 * New patient form component
 */
const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    dob: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    insurance: {
      provider: '',
      memberId: '',
      groupNumber: '',
      coverage: '',
    },
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleBack = () => {
    navigate('/patients');
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData] as Record<string, any>,
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (event: any) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.phone && !/^[\d\s()+\-\.]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create patient: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSuccess(true);
      setLoading(false);
      
      // Navigate to the new patient's page after a short delay
      setTimeout(() => {
        navigate(`/patients/${data.patient.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating patient:', err);
      setError('Failed to create patient. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>
            Back to Patients
          </Button>
          <Typography variant="h4" component="h1">
            Add New Patient
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  name="name"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="dob"
                  name="dob"
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.dob}
                  helperText={formErrors.dob}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!formErrors.gender}>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    label="Gender"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                    <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                  </Select>
                  {formErrors.gender && <FormHelperText>{formErrors.gender}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address"
                  name="address"
                  label="Address"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Insurance Information
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="insurance.provider"
                  name="insurance.provider"
                  label="Insurance Provider"
                  value={formData.insurance.provider}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="insurance.memberId"
                  name="insurance.memberId"
                  label="Member ID"
                  value={formData.insurance.memberId}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="insurance.groupNumber"
                  name="insurance.groupNumber"
                  label="Group Number"
                  value={formData.insurance.groupNumber}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="coverage-label">Coverage</InputLabel>
                  <Select
                    labelId="coverage-label"
                    id="insurance.coverage"
                    name="insurance.coverage"
                    value={formData.insurance.coverage}
                    label="Coverage"
                    onChange={(e) => handleChange({
                      target: {
                        name: 'insurance.coverage',
                        value: e.target.value
                      }
                    } as React.ChangeEvent<HTMLInputElement>)}
                  >
                    <MenuItem value="80/20">80/20</MenuItem>
                    <MenuItem value="70/30">70/30</MenuItem>
                    <MenuItem value="90/10">90/10</MenuItem>
                    <MenuItem value="100/0">100/0</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Patient'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Patient created successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NewPatientPage; 