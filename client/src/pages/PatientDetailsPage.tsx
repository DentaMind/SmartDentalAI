import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Button, 
  CircularProgress, 
  Tab, 
  Tabs,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TodayIcon from '@mui/icons-material/Today';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Patient {
  id: string;
  name: string;
  dob: string;
  lastVisit: string | null;
  status: string;
  treatmentStatus: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// Placeholder interfaces for future implementation
interface Treatment {
  id: string;
  date: string;
  procedure: string;
  provider: string;
  status: string;
}

interface Diagnostic {
  id: string;
  date: string;
  type: string;
  findings: string;
  recommended_treatment?: string;
  ai_confidence?: number;
}

/**
 * Patient details page component
 */
const PatientDetailsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Mock data for UI development
  const mockTreatments: Treatment[] = [
    { id: 'T1001', date: '2023-04-15', procedure: 'Dental Cleaning', provider: 'Dr. Smith', status: 'Completed' },
    { id: 'T1002', date: '2023-05-10', procedure: 'Cavity Filling (Tooth #14)', provider: 'Dr. Johnson', status: 'In Progress' },
    { id: 'T1003', date: '2023-06-22', procedure: 'Crown Placement (Tooth #19)', provider: 'Dr. Smith', status: 'Scheduled' }
  ];
  
  const mockDiagnostics: Diagnostic[] = [
    { 
      id: 'D1001', 
      date: '2023-04-15', 
      type: 'X-Ray Analysis', 
      findings: 'Cavity detected on tooth #14', 
      recommended_treatment: 'Filling', 
      ai_confidence: 0.92 
    },
    { 
      id: 'D1002', 
      date: '2023-05-01', 
      type: 'Oral Examination', 
      findings: 'Crown needed for tooth #19', 
      recommended_treatment: 'Porcelain crown', 
      ai_confidence: 0.89 
    }
  ];

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/patients/${patientId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load patient details: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setPatient(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient details:', err);
        setError('Failed to load patient details. Please try again.');
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackToPatients = () => {
    navigate('/patients');
  };

  const handleEditPatient = () => {
    navigate(`/patients/${patientId}/edit`);
  };

  const handleStartTreatment = () => {
    navigate(`/patients/${patientId}/treatment`);
  };

  const handleScheduleAppointment = () => {
    navigate(`/patients/${patientId}/appointments/new`);
  };

  const handleViewDiagnostics = () => {
    navigate(`/patients/${patientId}/diagnostics`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTreatmentChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'scheduled':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
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
        <Box sx={{ mt: 4, mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatients}>
            Back to Patients
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
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatients} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {patient.name}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />} 
            onClick={handleEditPatient}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="contained" 
            startIcon={<MedicalServicesIcon />} 
            onClick={handleStartTreatment}
          >
            Treatment
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Patient Info Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Patient Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Patient ID
                  </Typography>
                  <Typography variant="body1">
                    {patient.id}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={patient.status} 
                    size="small" 
                    color={getStatusChipColor(patient.status) as any}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Treatment Status
                  </Typography>
                  <Chip 
                    label={patient.treatmentStatus} 
                    size="small" 
                    color={getTreatmentChipColor(patient.treatmentStatus) as any}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(patient.dob)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {patient.email || 'Not provided'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">
                    {patient.phone || 'Not provided'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Visit
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(patient.lastVisit)}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TodayIcon />}
                    onClick={handleScheduleAppointment}
                  >
                    Schedule Appointment
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ width: '100%', mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Overview" />
                <Tab label="Treatments" />
                <Tab label="Diagnostics" />
              </Tabs>

              {/* Overview Tab */}
              {tabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Patient Overview
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AssessmentIcon />} 
                      onClick={handleViewDiagnostics}
                    >
                      View Diagnostics
                    </Button>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Current Status
                    </Typography>
                    <Typography variant="body1" paragraph>
                      This patient is currently <strong>{patient.status.toLowerCase()}</strong> with {patient.treatmentStatus.toLowerCase()} treatment(s). 
                      {patient.lastVisit ? ` Last visited on ${formatDate(patient.lastVisit)}.` : ' No previous visits recorded.'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Recent Treatments
                    </Typography>
                    {mockTreatments.length > 0 ? (
                      <List>
                        {mockTreatments.slice(0, 3).map((treatment) => (
                          <ListItem key={treatment.id} divider>
                            <ListItemText
                              primary={treatment.procedure}
                              secondary={`${formatDate(treatment.date)} - ${treatment.provider}`}
                            />
                            <Chip 
                              label={treatment.status} 
                              size="small" 
                              color={getTreatmentChipColor(treatment.status) as any}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No treatments recorded.
                      </Typography>
                    )}
                    <Button 
                      variant="text" 
                      sx={{ mt: 1 }}
                      onClick={() => setTabValue(1)}
                    >
                      View All Treatments
                    </Button>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Recent Diagnostics
                    </Typography>
                    {mockDiagnostics.length > 0 ? (
                      <List>
                        {mockDiagnostics.slice(0, 2).map((diagnostic) => (
                          <ListItem key={diagnostic.id} divider>
                            <ListItemText
                              primary={diagnostic.type}
                              secondary={`${formatDate(diagnostic.date)} - ${diagnostic.findings}`}
                            />
                            {diagnostic.ai_confidence && (
                              <Chip 
                                label={`AI: ${(diagnostic.ai_confidence * 100).toFixed(0)}%`} 
                                size="small" 
                                color="primary"
                              />
                            )}
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No diagnostics recorded.
                      </Typography>
                    )}
                    <Button 
                      variant="text" 
                      sx={{ mt: 1 }}
                      onClick={() => setTabValue(2)}
                    >
                      View All Diagnostics
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Treatments Tab */}
              {tabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Treatment History
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<MedicalServicesIcon />} 
                      onClick={handleStartTreatment}
                    >
                      Start New Treatment
                    </Button>
                  </Box>
                  
                  {mockTreatments.length > 0 ? (
                    <List>
                      {mockTreatments.map((treatment) => (
                        <ListItem 
                          key={treatment.id} 
                          divider
                          secondaryAction={
                            <IconButton edge="end" aria-label="view">
                              <VisibilityIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {treatment.procedure}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {formatDate(treatment.date)} • {treatment.provider}
                                </Typography>
                              </>
                            }
                          />
                          <Chip 
                            label={treatment.status} 
                            size="small" 
                            color={getTreatmentChipColor(treatment.status) as any}
                            sx={{ mr: 2 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        No treatments have been recorded for this patient.
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<MedicalServicesIcon />} 
                        sx={{ mt: 2 }}
                        onClick={handleStartTreatment}
                      >
                        Start New Treatment
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Diagnostics Tab */}
              {tabValue === 2 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Diagnostic History
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AssessmentIcon />} 
                      onClick={handleViewDiagnostics}
                    >
                      New Diagnostic
                    </Button>
                  </Box>
                  
                  {mockDiagnostics.length > 0 ? (
                    <List>
                      {mockDiagnostics.map((diagnostic) => (
                        <ListItem 
                          key={diagnostic.id} 
                          divider
                          secondaryAction={
                            <IconButton edge="end" aria-label="view">
                              <VisibilityIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {diagnostic.type}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" gutterBottom>
                                  {formatDate(diagnostic.date)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Findings: {diagnostic.findings}
                                </Typography>
                                {diagnostic.recommended_treatment && (
                                  <Typography variant="body2" color="text.secondary">
                                    Recommended: {diagnostic.recommended_treatment}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                          {diagnostic.ai_confidence && (
                            <Chip 
                              label={`AI: ${(diagnostic.ai_confidence * 100).toFixed(0)}%`} 
                              size="small" 
                              color="primary"
                              sx={{ mr: 2 }}
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        No diagnostics have been recorded for this patient.
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<AssessmentIcon />} 
                        sx={{ mt: 2 }}
                        onClick={handleViewDiagnostics}
                      >
                        New Diagnostic
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default PatientDetailsPage; 