import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Divider,
  Grid,
  Container,
  Alert,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  MedicalServices as MedicalIcon,
  PersonSearch as PersonIcon
} from '@mui/icons-material';
import AITreatmentSuggestionsWithEvidence from '../../components/ai/AITreatmentSuggestionsWithEvidence';
import patientService from '../../services/patientService';
import diagnosisService from '../../services/diagnosisService';
import Layout from '../../components/layout/Layout';

const EvidenceBasedTreatmentPlan: React.FC = () => {
  const router = useRouter();
  const { patientId, diagnosisId } = router.query;
  
  const [patient, setPatient] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load patient and diagnosis data
  useEffect(() => {
    const loadData = async () => {
      if (!patientId || !diagnosisId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Load patient data
        const patientData = await patientService.getPatientById(patientId as string);
        setPatient(patientData);
        
        // Load diagnosis data
        const diagnosisData = await diagnosisService.getDiagnosisById(diagnosisId as string);
        setDiagnosis(diagnosisData);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load patient or diagnosis data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [patientId, diagnosisId]);
  
  // Handle treatment selection
  const handleTreatmentSelected = (treatment: any) => {
    // Could add to treatment plan, navigate to treatment detail, etc.
    console.log('Selected treatment:', treatment);
    alert(`Treatment selected: ${treatment.procedure_name}`);
    // In a real application, this would add the treatment to the patient's plan
  };
  
  // Render loading state
  if (loading) {
    return (
      <Layout>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Layout>
        <Container>
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        </Container>
      </Layout>
    );
  }
  
  // Render when no patient ID or diagnosis ID provided
  if (!patientId || !diagnosisId) {
    return (
      <Layout>
        <Container>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h5" gutterBottom>
              Evidence-Based Treatment Planning
            </Typography>
            <Typography>
              Please select a patient and diagnosis to view AI treatment suggestions with clinical evidence.
            </Typography>
          </Paper>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container>
        <Box sx={{ mt: 3, mb: 3 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link color="inherit" href="/dashboard">
              Dashboard
            </Link>
            <Link color="inherit" href="/patients">
              Patients
            </Link>
            {patient && (
              <Link color="inherit" href={`/patients/${patient.id}`}>
                {patient.first_name} {patient.last_name}
              </Link>
            )}
            <Typography color="text.primary">Evidence-Based Treatment Plan</Typography>
          </Breadcrumbs>
          
          {/* Page Header */}
          <Typography variant="h4" gutterBottom>
            <MedicalIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Evidence-Based Treatment Plan
          </Typography>
          
          {/* Patient Info Card */}
          {patient && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 2, fontSize: '2.5rem', color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6" component="div">
                        {patient.first_name} {patient.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient.date_of_birth && `DOB: ${new Date(patient.date_of_birth).toLocaleDateString()}`}
                        {patient.patient_id && ` • ID: ${patient.patient_id}`}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  {diagnosis && (
                    <Box>
                      <Typography variant="subtitle1" component="div">
                        Diagnosis:
                      </Typography>
                      <Typography variant="body2">
                        {diagnosis.diagnosis_name || diagnosis.type || 'Not specified'}
                      </Typography>
                      {diagnosis.finding_type && (
                        <Chip 
                          label={diagnosis.finding_type} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}
          
          {/* AI Treatment Suggestions with Evidence */}
          <AITreatmentSuggestionsWithEvidence
            patientId={patientId as string}
            diagnosisId={diagnosisId as string}
            findingType={diagnosis?.finding_type}
            onTreatmentSelected={handleTreatmentSelected}
            patient={patient}
            diagnosis={diagnosis}
          />
          
          {/* Additional Information */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              About Evidence-Based Treatment Planning
            </Typography>
            <Typography variant="body2" paragraph>
              Suggestions above are generated by AI based on your patient's diagnosis and the available clinical evidence. 
              Each suggestion is linked to published clinical evidence with appropriate grading according to the GRADE methodology.
            </Typography>
            <Typography variant="body2">
              <strong>Evidence grades:</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 2 }}>
              <Chip label="Grade A: High Quality" size="small" sx={{ bgcolor: '#00C853', color: 'white' }} />
              <Chip label="Grade B: Moderate Quality" size="small" sx={{ bgcolor: '#64DD17', color: 'white' }} />
              <Chip label="Grade C: Low Quality" size="small" sx={{ bgcolor: '#FFD600', color: 'black' }} />
              <Chip label="Grade D: Very Low Quality" size="small" sx={{ bgcolor: '#FF9100', color: 'white' }} />
            </Box>
            <Typography variant="body2">
              These suggestions are meant to assist your clinical decision-making and should be considered alongside 
              your professional judgment, patient preferences, and clinical circumstances.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Layout>
  );
};

export default EvidenceBasedTreatmentPlan; 