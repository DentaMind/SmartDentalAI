import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrand } from '../components/ui/BrandProvider';
import BrandButton from '../components/ui/BrandButton';
import BrandCard from '../components/ui/BrandCard';

// Import our new branded intake form
import BrandedIntakeForm from '../components/patients/BrandedIntakeForm';

// Material UI components for layout
import {
  Box,
  Container,
  Typography,
  Alert,
  Snackbar,
  Paper
} from '@mui/material';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Patient Intake Form Page
 * This page handles the entire patient intake process
 */
const PatientIntakePage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useBrand();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedPatientId, setSubmittedPatientId] = useState<string | null>(null);
  
  const handleBack = () => {
    navigate('/patients');
  };
  
  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Submit the form data to the API
      const response = await fetch('/api/patient-intake/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit intake form: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSubmittedPatientId(data.id);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Error submitting intake form:', err);
      setError('Failed to submit intake form. Please try again.');
      setLoading(false);
    }
  };
  
  const handleViewPatient = () => {
    if (submittedPatientId) {
      navigate(`/patients/${submittedPatientId}`);
    }
  };
  
  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <BrandButton 
            variant="outline" 
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            className="mr-3"
          >
            Patients
          </BrandButton>
          <Typography variant="h4" sx={{ color: 'var(--color-text-primary)' }}>
            Patient Intake Form
          </Typography>
        </Box>
        
        <BrandCard variant="elevated">
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 64, 
                mb: 2, 
                color: 'var(--color-success)' 
              }} 
            />
            <Typography variant="h5" gutterBottom sx={{ color: 'var(--color-text-primary)' }}>
              Intake Form Submitted Successfully
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: 'var(--color-text-secondary)', mb: 3 }}>
              The patient information has been saved and a new patient record has been created.
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', mb: 4 }}>
              Patient ID: {submittedPatientId}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <BrandButton
                variant="primary"
                onClick={handleViewPatient}
              >
                View Patient Record
              </BrandButton>
              <BrandButton
                variant="outline"
                onClick={handleBack}
              >
                Back to Patients
              </BrandButton>
            </Box>
          </Box>
        </BrandCard>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <BrandButton 
          variant="outline" 
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          className="mr-3"
        >
          Patients
        </BrandButton>
        <Typography variant="h4" sx={{ color: 'var(--color-text-primary)' }}>
          Patient Intake Form
        </Typography>
      </Box>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4,
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px',
          color: 'var(--color-text-secondary)'
        }}
      >
        <Typography variant="body1">
          Please complete the patient intake form below. All fields marked with an asterisk (*) are required.
          The information you provide will help us deliver the best possible dental care.
        </Typography>
      </Paper>
      
      <BrandedIntakeForm 
        onSubmit={handleSubmit}
        isLoading={loading}
      />
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PatientIntakePage; 