import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/**
 * Treatment Plan Page
 * Displays treatment plan for a patient
 */
const TreatmentPlanPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        
        // Fetch patient data
        const patientResponse = await fetch(`/api/patients/${patientId}`);
        
        if (!patientResponse.ok) {
          throw new Error(`Failed to load patient data: ${patientResponse.status}`);
        }
        
        const patientData = await patientResponse.json();
        setPatient(patientData);
        
        // Mock treatment plan data - in real app, fetch from API
        setTreatmentPlan({
          id: 'TP-1001',
          status: 'Active',
          created: new Date().toISOString(),
          treatments: [
            {
              id: 'T1',
              procedure: 'Comprehensive Examination',
              tooth: null,
              status: 'Scheduled',
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              cost: 150,
              coveredAmount: 120,
              patientPortion: 30,
              notes: 'Initial comprehensive examination'
            },
            {
              id: 'T2',
              procedure: 'Full Mouth X-rays',
              tooth: null,
              status: 'Scheduled',
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              cost: 200,
              coveredAmount: 160,
              patientPortion: 40,
              notes: 'Full series of dental x-rays'
            },
            {
              id: 'T3',
              procedure: 'Dental Cleaning',
              tooth: null,
              status: 'Scheduled',
              date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
              cost: 120,
              coveredAmount: 120,
              patientPortion: 0,
              notes: 'Professional cleaning'
            }
          ],
          diagnosis: {
            summary: 'Patient requires routine examination and cleaning. Further treatment plan will be developed after initial assessment.',
            additionalNotes: 'Patient reports sensitivity on upper right quadrant.'
          },
          totalCost: 470,
          estimatedInsuranceCoverage: 400,
          estimatedPatientPortion: 70
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load treatment plan. Please try again.');
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId]);
  
  const handleBackToPatient = () => {
    navigate(`/patients/${patientId}`);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error || !patient) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatient}>
            Back to Patient
          </Button>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error || 'Patient not found'}
          </Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatient} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Treatment Plan: {patient.name}
          </Typography>
        </Box>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Treatment Plan Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Treatments
                    </Typography>
                    <Typography variant="h5" component="div">
                      {treatmentPlan.treatments.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Cost
                    </Typography>
                    <Typography variant="h5" component="div">
                      {formatCurrency(treatmentPlan.totalCost)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Insurance Coverage
                    </Typography>
                    <Typography variant="h5" component="div">
                      {formatCurrency(treatmentPlan.estimatedInsuranceCoverage)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Patient Portion
                    </Typography>
                    <Typography variant="h5" component="div">
                      {formatCurrency(treatmentPlan.estimatedPatientPortion)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Diagnosis
            </Typography>
            <Typography variant="body1" paragraph>
              {treatmentPlan.diagnosis.summary}
            </Typography>
            {treatmentPlan.diagnosis.additionalNotes && (
              <Typography variant="body2" color="text.secondary">
                Additional Notes: {treatmentPlan.diagnosis.additionalNotes}
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Treatment Timeline
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {treatmentPlan.treatments.map((treatment: any, index: number) => (
                <Step key={treatment.id}>
                  <StepLabel>
                    <Typography variant="subtitle1">
                      {treatment.procedure}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(treatment.date)}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Treatment Details
            </Typography>
            <List>
              {treatmentPlan.treatments.map((treatment: any) => (
                <ListItem key={treatment.id} divider>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {treatment.procedure}
                        {treatment.tooth && ` (Tooth #${treatment.tooth})`}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {formatDate(treatment.date)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Cost: {formatCurrency(treatment.cost)} • Patient Portion: {formatCurrency(treatment.patientPortion)}
                        </Typography>
                        {treatment.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {treatment.notes}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Chip 
                    label={treatment.status} 
                    color={
                      treatment.status === 'Completed' ? 'success' :
                      treatment.status === 'Scheduled' ? 'primary' :
                      treatment.status === 'Pending' ? 'warning' : 'default'
                    }
                    sx={{ ml: 2 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" sx={{ mr: 2 }}>
            Edit Treatment Plan
          </Button>
          <Button variant="contained" color="primary">
            Export Treatment Plan
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default TreatmentPlanPage; 