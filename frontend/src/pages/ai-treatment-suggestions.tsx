import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import TreatmentSuggestions from '../components/ai/TreatmentSuggestions';
import useAuth from '../hooks/useAuth';

interface ParamTypes {
  patientId?: string;
  diagnosisId?: string;
}

const AITreatmentSuggestionsPage: React.FC = () => {
  const { patientId, diagnosisId } = useParams<ParamTypes>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [patientName, setPatientName] = useState<string>('');
  
  useEffect(() => {
    // Load patient information if you have a service for that
    if (patientId) {
      // This is a placeholder - in a real app, you would fetch patient details
      // Example: patientService.getPatientName(patientId).then(name => setPatientName(name));
      setPatientName('Patient');
    }
  }, [patientId]);
  
  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleTreatmentPlanCreated = (treatmentPlanId: string) => {
    // Navigate to the treatment plan page
    navigate(`/patients/${patientId}/treatment-plans/${treatmentPlanId}`);
  };
  
  // If no patient ID is provided, show a message
  if (!patientId) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            AI Treatment Suggestions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography>
            Please select a patient to view or generate AI treatment suggestions.
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          {patientName}'s AI Treatment Suggestions
        </Typography>
      </Box>
      
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="AI Suggestions" />
            <Tab label="Treatment History" />
            <Tab label="Clinical Notes" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <TreatmentSuggestions
              patientId={patientId}
              diagnosisId={diagnosisId}
              onTreatmentPlanCreated={handleTreatmentPlanCreated}
            />
          )}
          
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Treatment History
              </Typography>
              <Typography color="textSecondary">
                Previous treatments and their outcomes will be displayed here.
              </Typography>
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Clinical Notes
              </Typography>
              <Typography color="textSecondary">
                Clinical notes relevant to treatment planning will be displayed here.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AITreatmentSuggestionsPage; 