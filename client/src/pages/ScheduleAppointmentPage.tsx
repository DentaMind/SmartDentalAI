import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Snackbar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';

/**
 * Schedule Appointment Page
 * Allows scheduling appointments for a patient
 */
const ScheduleAppointmentPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [formData, setFormData] = useState({
    appointmentDate: null as Date | null,
    appointmentTime: null as Date | null,
    appointmentType: '',
    duration: 30,
    providerId: '',
    notes: '',
    reason: '',
    isNewPatient: false,
    isEmergency: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Mock provider data
  const providers = [
    { id: 'dr-smith', name: 'Dr. Smith', specialty: 'General Dentistry' },
    { id: 'dr-johnson', name: 'Dr. Johnson', specialty: 'Endodontics' },
    { id: 'dr-williams', name: 'Dr. Williams', specialty: 'Periodontics' }
  ];
  
  // Mock appointment types
  const appointmentTypes = [
    { id: 'check-up', name: 'Regular Check-up', duration: 30 },
    { id: 'cleaning', name: 'Dental Cleaning', duration: 60 },
    { id: 'filling', name: 'Filling', duration: 60 },
    { id: 'root-canal', name: 'Root Canal', duration: 90 },
    { id: 'extraction', name: 'Tooth Extraction', duration: 60 },
    { id: 'consultation', name: 'Consultation', duration: 30 },
    { id: 'emergency', name: 'Emergency', duration: 60 }
  ];
  
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/patients/${patientId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load patient data: ${response.status}`);
        }
        
        const data = await response.json();
        setPatient(data);
        
        // If we have patient data, update the form
        setFormData(prev => ({
          ...prev,
          isNewPatient: !data.lastVisit,
        }));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient information. Please try again.');
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId]);
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSelectChange = (event: any) => {
    const { name, value } = event.target;
    
    // If appointment type changes, update the duration
    if (name === 'appointmentType') {
      const selectedType = appointmentTypes.find(type => type.id === value);
      if (selectedType) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          duration: selectedType.duration
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleDateChange = (name: string, date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.appointmentDate) newErrors.appointmentDate = 'Appointment date is required';
    if (!formData.appointmentTime) newErrors.appointmentTime = 'Appointment time is required';
    if (!formData.appointmentType) newErrors.appointmentType = 'Appointment type is required';
    if (!formData.providerId) newErrors.providerId = 'Provider is required';
    if (!formData.reason) newErrors.reason = 'Reason for appointment is required';
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleBackToPatient = () => {
    navigate(`/patients/${patientId}`);
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create a formatted date/time for the appointment
      const appointmentDate = formData.appointmentDate;
      const appointmentTime = formData.appointmentTime;
      
      let appointmentDateTime = null;
      if (appointmentDate && appointmentTime) {
        appointmentDateTime = new Date(appointmentDate);
        appointmentDateTime.setHours(
          appointmentTime.getHours(),
          appointmentTime.getMinutes()
        );
      }
      
      // Prepare the appointment data
      const appointmentData = {
        patientId,
        patientName: patient.name,
        appointmentDateTime: appointmentDateTime?.toISOString(),
        appointmentType: formData.appointmentType,
        appointmentTypeName: appointmentTypes.find(type => type.id === formData.appointmentType)?.name,
        duration: formData.duration,
        providerId: formData.providerId,
        providerName: providers.find(provider => provider.id === formData.providerId)?.name,
        notes: formData.notes,
        reason: formData.reason,
        isNewPatient: formData.isNewPatient,
        isEmergency: formData.isEmergency,
        status: 'Scheduled'
      };
      
      // Mock API call to create appointment
      // In a real app, you would make an actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      console.log('Appointment scheduled:', appointmentData);
      
      setSuccess(true);
      setSubmitting(false);
      
      // In a real app, we would redirect to the appointment detail page
      // or back to the patient page with a success message
      setTimeout(() => {
        navigate(`/patients/${patientId}`);
      }, 2000);
    } catch (err) {
      console.error('Error scheduling appointment:', err);
      setError('Failed to schedule appointment. Please try again.');
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error && !patient) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatient}>
            Back to Patient
          </Button>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatient} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Schedule Appointment
          </Typography>
        </Box>
        
        {patient && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
              <Typography variant="body1">
                {patient.name}
              </Typography>
              {patient.dob && (
                <Typography variant="body2" color="text.secondary">
                  Date of Birth: {new Date(patient.dob).toLocaleDateString()}
                </Typography>
              )}
              {patient.lastVisit && (
                <Typography variant="body2" color="text.secondary">
                  Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
        
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
                  Appointment Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Appointment Date"
                    value={formData.appointmentDate}
                    onChange={(date) => handleDateChange('appointmentDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!formErrors.appointmentDate,
                        helperText: formErrors.appointmentDate
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Appointment Time"
                    value={formData.appointmentTime}
                    onChange={(time) => handleDateChange('appointmentTime', time)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!formErrors.appointmentTime,
                        helperText: formErrors.appointmentTime
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!formErrors.appointmentType}>
                  <InputLabel id="appointmentType-label">Appointment Type</InputLabel>
                  <Select
                    labelId="appointmentType-label"
                    id="appointmentType"
                    name="appointmentType"
                    value={formData.appointmentType}
                    label="Appointment Type"
                    onChange={handleSelectChange}
                  >
                    {appointmentTypes.map(type => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.duration} min)
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.appointmentType && (
                    <FormHelperText>{formErrors.appointmentType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!formErrors.providerId}>
                  <InputLabel id="providerId-label">Provider</InputLabel>
                  <Select
                    labelId="providerId-label"
                    id="providerId"
                    name="providerId"
                    value={formData.providerId}
                    label="Provider"
                    onChange={handleSelectChange}
                  >
                    {providers.map(provider => (
                      <MenuItem key={provider.id} value={provider.id}>
                        {provider.name} - {provider.specialty}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.providerId && (
                    <FormHelperText>{formErrors.providerId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="reason"
                  name="reason"
                  label="Reason for Appointment"
                  value={formData.reason}
                  onChange={handleChange}
                  error={!!formErrors.reason}
                  helperText={formErrors.reason}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label="Additional Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleBackToPatient}
                    sx={{ mr: 2 }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<EventIcon />}
                    disabled={submitting}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Schedule Appointment'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Appointment scheduled successfully"
      />
    </Container>
  );
};

export default ScheduleAppointmentPage; 