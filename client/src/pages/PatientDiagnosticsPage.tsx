import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemText,
  TextField,
  Stack,
  Avatar,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PersonIcon from '@mui/icons-material/Person';
import TodayIcon from '@mui/icons-material/Today';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import api from '../lib/api';

// Import our new custom components
import XrayViewer from '../components/dental/XrayViewer';
import TreatmentSuggestionPanel from '../components/dental/TreatmentSuggestionPanel';

interface Patient {
  id: string;
  name: string;
  dob?: string;
  gender?: string;
  email?: string;
  phone?: string;
  insurance?: {
    provider?: string;
    memberId?: string;
    coverage?: string;
  };
  medicalHistory?: {
    allergies?: string[];
    conditions?: string[];
  };
}

interface ResearchLink {
  title: string;
  url: string;
}

interface Evidence {
  researchLinks?: ResearchLink[];
  clinicalGuidelines?: string;
}

interface TreatmentCost {
  cost: number;
  insuranceCoverage: string;
  patientPortion: number;
}

interface Finding {
  id: string;
  type: string;
  description: string;
  location: string;
  confidence: number;
  suggestedTreatments: string[];
  evidence?: Evidence;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ImageAnalysisResult {
  id: string;
  imageType: 'xray' | 'photo' | 'scan';
  findings: Finding[];
  confidence: number;
  timestamp: string;
  imageUrl: string;
  processingTimeMs?: number;
  patientId?: string;
  analysisSummary?: string;
  treatmentCosts?: Record<string, TreatmentCost>;
}

/**
 * Patient Diagnostics Page Component
 * Allows uploading and analyzing dental images using AI
 */
const PatientDiagnosticsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'xray' | 'photo' | 'scan'>('xray');
  const [analysisResults, setAnalysisResults] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patientNote, setPatientNote] = useState('');
  const [highlightedFinding, setHighlightedFinding] = useState<string | null>(null);
  const [analysisSaved, setAnalysisSaved] = useState(false);

  // Mock diagnosis results for development
  const mockAnalysisResult: ImageAnalysisResult = {
    id: 'D1001',
    imageType: 'xray',
    findings: [
      {
        id: 'F1',
        type: 'Cavity',
        description: 'Dental caries detected on distal surface',
        location: 'Tooth #14 (Upper Right First Molar)',
        confidence: 0.94,
        suggestedTreatments: ['Filling', 'Restoration'],
        coordinates: { x: 230, y: 145, width: 25, height: 30 }
      },
      {
        id: 'F2',
        type: 'Periapical Radiolucency',
        description: 'Potential periapical infection indicated by radiolucent area',
        location: 'Tooth #19 (Lower Left First Molar)',
        confidence: 0.87,
        suggestedTreatments: ['Root Canal Therapy', 'Evaluation for Endodontic Treatment'],
        coordinates: { x: 310, y: 180, width: 20, height: 25 }
      },
      {
        id: 'F3',
        type: 'Bone Loss',
        description: 'Horizontal bone loss observed in posterior region',
        location: 'Lower Right Quadrant',
        confidence: 0.91,
        suggestedTreatments: ['Periodontal Therapy', 'Deep Cleaning'],
        coordinates: { x: 270, y: 320, width: 80, height: 40 }
      }
    ],
    confidence: 0.92,
    timestamp: new Date().toISOString(),
    imageUrl: 'sample-image-url.jpg',
    patientId: patientId, // Make sure to include the patientId
    treatmentCosts: {
      "Filling": { cost: 200, insuranceCoverage: "80%", patientPortion: 40 },
      "Restoration": { cost: 300, insuranceCoverage: "70%", patientPortion: 90 },
      "Root Canal Therapy": { cost: 900, insuranceCoverage: "60%", patientPortion: 360 },
      "Evaluation for Endodontic Treatment": { cost: 150, insuranceCoverage: "90%", patientPortion: 15 },
      "Periodontal Therapy": { cost: 400, insuranceCoverage: "80%", patientPortion: 80 },
      "Deep Cleaning": { cost: 250, insuranceCoverage: "100%", patientPortion: 0 }
    }
  };

  const steps = ['Select Patient', 'Upload Image', 'AI Analysis', 'Review Results'];

  useEffect(() => {
    // Fetch patient data
    const fetchPatient = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        // Use a direct fetch call to the patients endpoint - this will be intercepted by MSW in dev mode
        const response = await fetch(`/patients/${patientId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch patient data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setPatient(data);
        setLoading(false);
        setActiveStep(1); // Move to upload step once patient is loaded
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient information. Please try again.');
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleImageTypeChange = (type: 'xray' | 'photo' | 'scan') => {
    setImageType(type);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('patientId', patientId || 'test-patient');
      formData.append('imageType', imageType);

      // Make API call to backend using fetch
      const response = await fetch('/diagnostics/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze image: ${response.status} ${response.statusText}`);
      }

      // Use real API response
      const data = await response.json();
      setAnalysisResults(data);
      setActiveStep(3); // Move to results step
      setLoading(false);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze image. Please try again.');
      setLoading(false);
    }
  };

  const handleSaveDiagnostics = async () => {
    if (!analysisResults) return;

    setLoading(true);
    try {
      // Save the diagnostic results to the backend
      const response = await fetch('/diagnostics/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisId: analysisResults.id,
          patientId,
          findings: analysisResults.findings,
          imageType: analysisResults.imageType,
          confidence: analysisResults.confidence,
          notes: patientNote
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save diagnostic results');
      }

      setAnalysisSaved(true);
      setLoading(false);
      
      // Navigate to treatment suggestions based on these findings
      navigate(`/patients/${patientId}/treatments`, { 
        state: { 
          diagnosticId: analysisResults.id,
          findings: analysisResults.findings 
        } 
      });
    } catch (err) {
      console.error('Error saving diagnostics:', err);
      setError('Failed to save diagnostic results.');
      setLoading(false);
      
      // For development, continue navigation even if save fails
      if (process.env.NODE_ENV === 'development') {
        navigate(`/patients/${patientId}/treatments`, { 
          state: { 
            diagnosticId: analysisResults.id,
            findings: analysisResults.findings 
          } 
        });
      }
    }
  };

  const handleBackToPatient = () => {
    navigate(`/patients/${patientId}`);
  };
  
  const handleFindingClick = (finding: Finding) => {
    setHighlightedFinding(finding.id === highlightedFinding ? null : finding.id);
  };
  
  const handleAcceptTreatment = (findingId: string, treatment: string) => {
    console.log(`Accepted treatment "${treatment}" for finding ${findingId}`);
    // In a real implementation, you would record this selection
  };
  
  const handleRejectFinding = (findingId: string) => {
    console.log(`Rejected finding ${findingId}`);
    // In a real implementation, you would record this feedback
  };

  const PatientInfoCard = () => {
    if (!patient) return null;
    
    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f9fafb' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              {patient.name}
            </Typography>
            
            <Stack direction="row" spacing={3} mt={0.5}>
              {patient.dob && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TodayIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    DOB: {formatDate(patient.dob)}
                  </Typography>
                </Box>
              )}
              
              {patient.gender && (
                <Typography variant="body2" color="text.secondary">
                  {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                </Typography>
              )}
              
              {patient.insurance?.provider && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <HealthAndSafetyIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {patient.insurance.provider}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      </Paper>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Select Patient
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Loading patient information...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This won't take long.
                </Typography>
              </>
            )}
          </Box>
        );

      case 1: // Upload Image
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <PatientInfoCard />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upload Dental Image
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Image Type
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant={imageType === 'xray' ? 'contained' : 'outlined'} 
                        onClick={() => handleImageTypeChange('xray')}
                        size="small"
                      >
                        X-Ray
                      </Button>
                      <Button 
                        variant={imageType === 'photo' ? 'contained' : 'outlined'} 
                        onClick={() => handleImageTypeChange('photo')}
                        size="small"
                      >
                        Intraoral Photo
                      </Button>
                      <Button 
                        variant={imageType === 'scan' ? 'contained' : 'outlined'} 
                        onClick={() => handleImageTypeChange('scan')}
                        size="small"
                      >
                        3D Scan
                      </Button>
                    </Box>
                  </Box>

                  <Box 
                    sx={{ 
                      border: '2px dashed #ccc', 
                      borderRadius: 2, 
                      p: 3, 
                      textAlign: 'center',
                      mb: 3,
                      backgroundColor: '#f9f9f9'
                    }}
                  >
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="upload-image-input"
                      type="file"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="upload-image-input">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                      >
                        Select Image
                      </Button>
                    </label>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Supported formats: JPEG, PNG, DICOM
                    </Typography>
                  </Box>

                  {selectedFile && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </Typography>
                      <Button 
                        size="small" 
                        startIcon={<DeleteIcon />} 
                        onClick={handleRemoveFile}
                        color="error"
                      >
                        Remove
                      </Button>
                    </Box>
                  )}

                  <Button 
                    variant="contained" 
                    color="primary"
                    disabled={!selectedFile}
                    onClick={() => setActiveStep(2)}
                    fullWidth
                  >
                    Continue
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Image Preview
                  </Typography>
                  
                  {imagePreview ? (
                    <CardMedia
                      component="img"
                      image={imagePreview}
                      alt="Dental image preview"
                      sx={{ 
                        maxHeight: 300, 
                        objectFit: 'contain', 
                        borderRadius: 1,
                        border: '1px solid #eee'
                      }}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        height: 300, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <AddPhotoAlternateIcon sx={{ fontSize: 60, color: '#bdbdbd' }} />
                        <Typography variant="body2" color="text.secondary">
                          No image selected
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2: // AI Analysis
        return (
          <>
            <Grid item xs={12}>
              <PatientInfoCard />
            </Grid>
            
            <Card>
              <CardContent>
                <Box textAlign="center" py={3}>
                  <Typography variant="h5" gutterBottom>
                    Analyzing {imageType.charAt(0).toUpperCase() + imageType.slice(1)}
                  </Typography>
                  
                  <Box my={4} display="flex" flexDirection="column" alignItems="center">
                    {loading && <CircularProgress />}
                    {error && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                      </Alert>
                    )}
                    
                    <Box display="flex" flexWrap="wrap" gap={1} mt={2} justifyContent="center">
                      {selectedFile && (
                        <img 
                          src={URL.createObjectURL(selectedFile)}
                          alt="Selected dental image" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px',
                            opacity: loading ? 0.5 : 1
                          }} 
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Button 
                    variant="contained"
                    onClick={handleAnalyzeImage}
                    disabled={loading}
                  >
                    {loading ? 'Analyzing...' : 'Continue Analysis'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </>
        );

      case 3: // Review Results
        return (
          <Box>
            <Grid item xs={12}>
              <PatientInfoCard />
            </Grid>
            
            {analysisResults && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert 
                    severity="info" 
                    sx={{ mb: 3 }}
                    action={analysisSaved ? <CheckCircleIcon color="success" /> : null}
                  >
                    <AlertTitle>AI Diagnostic Results for {patient?.name}</AlertTitle>
                    This analysis was generated on {new Date(analysisResults.timestamp).toLocaleString()}
                    {patient?.insurance && (
                      <>
                        {' '}for a patient with {patient.insurance.coverage} insurance coverage
                      </>
                    )}. 
                    {analysisSaved ? ' Results have been saved to patient record.' : ''}
                  </Alert>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Analyzed Image
                      </Typography>
                      
                      {imagePreview && (
                        <XrayViewer
                          imageUrl={imagePreview}
                          alt="Dental X-ray"
                          findings={analysisResults.findings.filter(f => f.coordinates)}
                          showAnnotations={true}
                          height={400}
                          highlightedFindingId={highlightedFinding}
                        />
                      )}
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Analysis Information
                        </Typography>
                        <Typography variant="body2">
                          <strong>Image Type:</strong> {imageType.charAt(0).toUpperCase() + imageType.slice(1)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Analysis Date:</strong> {new Date(analysisResults.timestamp).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Overall Confidence:</strong> {Math.round(analysisResults.confidence * 100)}%
                        </Typography>
                        {analysisResults.processingTimeMs && (
                          <Typography variant="body2">
                            <strong>Processing Time:</strong> {analysisResults.processingTimeMs} ms
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Clinical Notes
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Add clinical notes or observations..."
                          variant="outlined"
                          value={patientNote}
                          onChange={(e) => setPatientNote(e.target.value)}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TreatmentSuggestionPanel 
                    findings={analysisResults.findings} 
                    treatmentCosts={analysisResults.treatmentCosts}
                    onAcceptTreatment={handleAcceptTreatment}
                    onRejectFinding={handleRejectFinding}
                    patientName={patient?.name || 'Patient'}
                    analysisId={analysisResults.id}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => setActiveStep(1)}
                    >
                      Back to Upload
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<MedicalServicesIcon />}
                      onClick={handleSaveDiagnostics}
                      disabled={loading}
                    >
                      Save and Continue to Treatment Plan
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatient} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Diagnostics{patient ? `: ${patient.name}` : ''}
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {renderStepContent()}
        </Paper>
      </Box>
    </Container>
  );
};

export default PatientDiagnosticsPage;
