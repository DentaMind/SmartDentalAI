import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import { TreatmentPlanBuilder } from '../../components/treatment/TreatmentPlanBuilder';
import { treatmentPlanService } from '../../services/TreatmentPlanService';

interface RouteParams {
  patientId: string;
  planId?: string;
}

export const TreatmentPlanPage: React.FC = () => {
  const { patientId, planId } = useParams<RouteParams>();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  
  // Load patient info
  useEffect(() => {
    const loadPatientInfo = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        
        // This would be replaced with your actual patient service call
        // const patientData = await patientService.getPatient(patientId);
        // setPatientInfo(patientData);
        
        // For now, mock the patient data
        setPatientInfo({
          id: patientId,
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-01',
          chartNumber: 'PT-12345'
        });
      } catch (err: any) {
        console.error('Error loading patient data:', err);
        setError('Failed to load patient information');
      } finally {
        setLoading(false);
      }
    };
    
    loadPatientInfo();
  }, [patientId]);
  
  // Handle plan creation
  const handlePlanCreated = (newPlanId: string) => {
    // Navigate to the newly created plan
    navigate(`/treatment/patient/${patientId}/plan/${newPlanId}`);
  };
  
  // Navigation to patient chart
  const navigateToPatientChart = () => {
    navigate(`/patient/${patientId}/chart`);
  };
  
  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error state
  if (error || !patientId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Invalid patient ID'}
        </Alert>
        <Box mt={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/patients')}
          >
            Return to Patients
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate('/dashboard')}
          sx={{ cursor: 'pointer' }}
        >
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate('/patients')}
          sx={{ cursor: 'pointer' }}
        >
          Patients
        </Link>
        <Link
          underline="hover"
          color="inherit"
          onClick={navigateToPatientChart}
          sx={{ cursor: 'pointer' }}
        >
          {patientInfo?.firstName} {patientInfo?.lastName}
        </Link>
        <Typography color="text.primary">
          {planId ? 'Treatment Plan' : 'New Treatment Plan'}
        </Typography>
      </Breadcrumbs>
      
      {/* Patient Info Header */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box display="flex" alignItems="center">
          <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6">
              {patientInfo?.firstName} {patientInfo?.lastName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              DOB: {new Date(patientInfo?.dateOfBirth).toLocaleDateString()} | 
              Chart: {patientInfo?.chartNumber}
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={navigateToPatientChart}
        >
          Back to Chart
        </Button>
      </Paper>
      
      {/* Treatment Plan Builder */}
      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <Typography variant="h5" display="flex" alignItems="center">
            <AssignmentIcon sx={{ mr: 1 }} />
            {planId ? 'Treatment Plan' : 'New Treatment Plan'}
          </Typography>
        </Box>
        <Divider />
        <Box p={3}>
          <TreatmentPlanBuilder
            patientId={patientId}
            planId={planId}
            onPlanCreated={handlePlanCreated}
            onPlanUpdated={() => {}} // Handle plan updates if needed
          />
        </Box>
      </Paper>
    </Container>
  );
}; 