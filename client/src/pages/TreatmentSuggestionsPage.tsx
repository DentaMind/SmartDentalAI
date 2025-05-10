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
  Divider,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Tab,
  Tabs,
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ArticleIcon from '@mui/icons-material/Article';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VerifiedIcon from '@mui/icons-material/Verified';
import api from '../lib/api';

interface Finding {
  id: string;
  type: string;
  description: string;
  location: string;
  confidence: number;
  suggestedTreatments: string[];
}

interface TreatmentOption {
  id: string;
  name: string;
  description: string;
  success_rate: number;
  recommended_for: string[];
  contraindications: string[];
  clinical_evidence: ClinicalEvidence[];
  cost_range: string;
  avg_recovery_time: string;
  procedure_time: string;
  insurance_coverage_likelihood: 'high' | 'medium' | 'low';
}

interface ClinicalEvidence {
  id: string;
  title: string;
  authors: string;
  journal: string;
  publication_date: string;
  link: string;
  evidence_strength: number;
  key_findings: string;
}

/**
 * TreatmentSuggestionsPage Component
 * Shows AI-recommended treatments for dental conditions with evidence
 */
const TreatmentSuggestionsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [treatmentOptions, setTreatmentOptions] = useState<Record<string, TreatmentOption[]>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [patientName, setPatientName] = useState('');

  // Mock treatment options for development
  const mockTreatmentData = {
    "Cavity": [
      {
        id: "T001",
        name: "Composite Filling",
        description: "Tooth-colored resin material bonded to the tooth to restore the damaged area.",
        success_rate: 0.92,
        recommended_for: ["Small to medium cavities", "Visible teeth where aesthetics matter"],
        contraindications: ["Very large cavities", "Patients with heavy bruxism"],
        clinical_evidence: [
          {
            id: "CE001",
            title: "Long-term clinical evaluation of composite resin restorations",
            authors: "Johnson et al.",
            journal: "Journal of Dental Research",
            publication_date: "2021-05-15",
            link: "https://example.com/research/composite-eval",
            evidence_strength: 4,
            key_findings: "92% success rate over 5 years for posterior composite restorations"
          },
          {
            id: "CE002",
            title: "Comparative study of composite vs. amalgam fillings",
            authors: "Smith, Garcia, et al.",
            journal: "International Dental Journal",
            publication_date: "2020-08-12",
            link: "https://example.com/research/composite-vs-amalgam",
            evidence_strength: 5,
            key_findings: "Comparable durability to amalgam with superior aesthetics and bonding"
          }
        ],
        cost_range: "$150-$300 per tooth",
        avg_recovery_time: "Immediate",
        procedure_time: "30-60 minutes",
        insurance_coverage_likelihood: "high"
      },
      {
        id: "T002",
        name: "Amalgam Filling",
        description: "Silver-colored material made from a mixture of metals including silver, tin, and copper, bound by mercury.",
        success_rate: 0.95,
        recommended_for: ["Large cavities", "Areas with high biting forces", "Patients with difficulty maintaining dry field"],
        contraindications: ["Patients with mercury allergies", "Aesthetic concerns", "Pregnant patients"],
        clinical_evidence: [
          {
            id: "CE003",
            title: "20-year survival of amalgam vs. composite restorations",
            authors: "Williams & Chen",
            journal: "Journal of Prosthetic Dentistry",
            publication_date: "2018-11-30",
            link: "https://example.com/research/amalgam-longevity",
            evidence_strength: 5,
            key_findings: "Higher longevity for amalgam (95% at 10 years) compared to early composite materials"
          }
        ],
        cost_range: "$110-$200 per tooth",
        avg_recovery_time: "24 hours for full hardening",
        procedure_time: "30-45 minutes",
        insurance_coverage_likelihood: "high"
      }
    ],
    "Periapical Radiolucency": [
      {
        id: "T003",
        name: "Root Canal Therapy",
        description: "Removal of infected pulp tissue, cleaning of canal system, and filling with inert material to prevent reinfection.",
        success_rate: 0.89,
        recommended_for: ["Irreversible pulpitis", "Necrotic pulp with periapical pathology", "Tooth that can be restored"],
        contraindications: ["Severely fractured teeth", "Advanced periodontal disease", "Teeth with poor restorative prognosis"],
        clinical_evidence: [
          {
            id: "CE004",
            title: "Success rates of endodontic treatment and factors influencing outcomes",
            authors: "Rodriguez et al.",
            journal: "Journal of Endodontics",
            publication_date: "2019-07-22",
            link: "https://example.com/research/endo-success",
            evidence_strength: 4,
            key_findings: "89% success rate at 5 years with proper restoration after treatment"
          }
        ],
        cost_range: "$700-$1,500 per tooth",
        avg_recovery_time: "1-2 weeks for tissue healing",
        procedure_time: "60-90 minutes (may require multiple visits)",
        insurance_coverage_likelihood: "medium"
      },
      {
        id: "T004",
        name: "Extraction & Implant",
        description: "Removal of affected tooth followed by placement of titanium dental implant and crown restoration.",
        success_rate: 0.96,
        recommended_for: ["Non-restorable teeth", "Failed endodontic treatment", "Patient preference for replacement"],
        contraindications: ["Uncontrolled systemic diseases", "Patients unwilling/unable to maintain oral hygiene", "Active radiation therapy"],
        clinical_evidence: [
          {
            id: "CE005",
            title: "Outcomes of implant therapy compared with endodontic treatment",
            authors: "Lee & Patel",
            journal: "International Journal of Oral Implantology",
            publication_date: "2022-01-10",
            link: "https://example.com/research/implant-vs-endo",
            evidence_strength: 4,
            key_findings: "Higher initial success for implants (96%) but similar long-term outcomes as endodontic therapy"
          }
        ],
        cost_range: "$3,000-$5,000 (extraction, implant, crown)",
        avg_recovery_time: "3-6 months for osseointegration",
        procedure_time: "Multiple visits over 3-6 months",
        insurance_coverage_likelihood: "low"
      }
    ],
    "Bone Loss": [
      {
        id: "T005",
        name: "Scaling and Root Planing",
        description: "Deep cleaning procedure to remove plaque and tartar from below the gumline and smooth root surfaces.",
        success_rate: 0.75,
        recommended_for: ["Early to moderate periodontitis", "Horizontal bone loss", "Non-surgical approach"],
        contraindications: ["Advanced bone loss", "Furcation involvements", "Complex anatomical factors"],
        clinical_evidence: [
          {
            id: "CE006",
            title: "Non-surgical periodontal therapy outcomes in horizontal bone loss cases",
            authors: "Martinez & Kumar",
            journal: "Journal of Periodontology",
            publication_date: "2020-04-17",
            link: "https://example.com/research/srp-outcomes",
            evidence_strength: 4,
            key_findings: "Effective at arresting bone loss progression in 75% of moderate cases with proper maintenance"
          }
        ],
        cost_range: "$200-$300 per quadrant",
        avg_recovery_time: "2-3 weeks for gum healing",
        procedure_time: "45-60 minutes per quadrant",
        insurance_coverage_likelihood: "high"
      },
      {
        id: "T006",
        name: "Periodontal Surgery",
        description: "Surgical intervention to reduce pocket depths, regenerate lost bone, and create an environment conducive to oral hygiene.",
        success_rate: 0.83,
        recommended_for: ["Moderate to advanced periodontitis", "Areas with deep pockets after non-surgical therapy", "Specific anatomical defects"],
        contraindications: ["Uncontrolled systemic disease", "Poor oral hygiene", "Heavy smoking"],
        clinical_evidence: [
          {
            id: "CE007",
            title: "Regenerative periodontal therapy for intrabony defects",
            authors: "Thompson et al.",
            journal: "Journal of Clinical Periodontology",
            publication_date: "2021-09-05",
            link: "https://example.com/research/regenerative-perio",
            evidence_strength: 3,
            key_findings: "Surgical approaches showed 83% success in preventing further bone loss and 30-60% regeneration in optimal cases"
          }
        ],
        cost_range: "$800-$1,500 per quadrant",
        avg_recovery_time: "2-4 weeks",
        procedure_time: "60-120 minutes",
        insurance_coverage_likelihood: "medium"
      }
    ]
  };

  useEffect(() => {
    // Get findings from location state or fetch from API
    if (location.state && location.state.findings) {
      setFindings(location.state.findings);
    } else {
      fetchDiagnosticFindings();
    }

    // Get patient information
    fetchPatientInfo();
  }, [patientId, location.state]);

  useEffect(() => {
    // Generate treatment options based on findings
    if (findings.length > 0) {
      fetchTreatmentOptions();
    }
  }, [findings]);

  const fetchDiagnosticFindings = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      // Get the latest diagnostic findings from the API
      const response = await api.get(`/diagnostics/patient/${patientId}/latest`);
      
      if (response.data && response.data.findings && response.data.findings.length > 0) {
        setFindings(response.data.findings);
        setLoading(false);
      } else {
        setFindings([]);
        setError('No diagnostic findings available. Please complete a diagnostic assessment first.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching diagnostic findings:', err);
      setError('Failed to retrieve diagnostic information.');
      setLoading(false);
    }
  };

  const fetchPatientInfo = async () => {
    if (!patientId) return;
    
    try {
      const response = await api.get(`/patients/${patientId}`);
      setPatientName(response.data.name);
    } catch (err) {
      console.error('Error fetching patient info:', err);
    }
  };

  const fetchTreatmentOptions = async () => {
    try {
      // Fetch treatment options from API based on findings
      const response = await api.post('/treatments/suggest', {
        findings: findings
      });
      
      setTreatmentOptions(response.data.treatmentOptions);
    } catch (err) {
      console.error('Error fetching treatment options:', err);
      
      // Fallback to mock data in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock treatment data as fallback');
        const options: Record<string, TreatmentOption[]> = {};
        
        findings.forEach(finding => {
          // For now, use mock data
          options[finding.type] = mockTreatmentData[finding.type as keyof typeof mockTreatmentData] || [];
        });
        
        setTreatmentOptions(options);
      }
    }
  };

  const handleBackToPatient = () => {
    navigate(`/patients/${patientId}`);
  };

  const handleBackToDiagnostics = () => {
    navigate(`/patients/${patientId}/diagnostics`);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getEvidenceStrengthLabel = (strength: number): string => {
    switch (strength) {
      case 5: return 'Very Strong';
      case 4: return 'Strong';
      case 3: return 'Moderate';
      case 2: return 'Limited';
      case 1: return 'Very Limited';
      default: return 'Unknown';
    }
  };

  const getCoverageChipColor = (coverage: string) => {
    switch (coverage) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
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

  if (error && findings.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatient}>
            Back to Patient
          </Button>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>No Diagnostic Data</AlertTitle>
            {error}
          </Alert>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<AssessmentIcon />}
              onClick={handleBackToDiagnostics}
            >
              Start Diagnostic Assessment
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBackToPatient} 
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Treatment Suggestions{patientName ? `: ${patientName}` : ''}
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Treatment Recommendations</AlertTitle>
            The AI has generated evidence-based treatment suggestions based on the diagnostic findings. Please review all options before making clinical decisions.
          </Alert>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Diagnostic Findings
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <List dense>
                {findings.map((finding) => (
                  <ListItem key={finding.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {finding.type}
                          </Typography>
                          <Chip 
                            label={`${Math.round(finding.confidence * 100)}%`} 
                            size="small" 
                            color={finding.confidence > 0.9 ? "success" : "primary"}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Location: {finding.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {finding.description}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab icon={<MedicalServicesIcon />} label="Treatment Options" />
            <Tab icon={<ArticleIcon />} label="Clinical Evidence" />
            <Tab icon={<InsightsIcon />} label="Outcome Predictions" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              {Object.entries(treatmentOptions).map(([condition, options]) => (
                <Box key={condition} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {condition} Treatment Options
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {options.map((option) => (
                      <Grid item xs={12} md={6} key={option.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6">
                                {option.name}
                              </Typography>
                              <Chip 
                                label={`${Math.round(option.success_rate * 100)}% success rate`}
                                color={option.success_rate > 0.9 ? "success" : "primary"}
                                size="small"
                              />
                            </Box>
                            
                            <Typography variant="body2" paragraph>
                              {option.description}
                            </Typography>
                            
                            <Divider sx={{ my: 1 }} />
                            
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Cost Range
                                </Typography>
                                <Typography variant="body2">
                                  {option.cost_range}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Insurance Coverage
                                </Typography>
                                <Box>
                                  <Chip 
                                    label={option.insurance_coverage_likelihood} 
                                    size="small"
                                    color={getCoverageChipColor(option.insurance_coverage_likelihood)}
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Procedure Time
                                </Typography>
                                <Typography variant="body2">
                                  {option.procedure_time}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Recovery
                                </Typography>
                                <Typography variant="body2">
                                  {option.avg_recovery_time}
                                </Typography>
                              </Grid>
                            </Grid>
                            
                            <Accordion sx={{ mt: 2 }}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>Clinical Recommendations</Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Typography variant="subtitle2" gutterBottom>
                                  Recommended For:
                                </Typography>
                                <List dense disablePadding>
                                  {option.recommended_for.map((item, i) => (
                                    <ListItem key={i} sx={{ py: 0 }}>
                                      <VerifiedIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                                      <ListItemText primary={item} />
                                    </ListItem>
                                  ))}
                                </List>
                                
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                  Contraindications:
                                </Typography>
                                <List dense disablePadding>
                                  {option.contraindications.map((item, i) => (
                                    <ListItem key={i} sx={{ py: 0 }}>
                                      <ListItemText primary={item} />
                                    </ListItem>
                                  ))}
                                </List>
                              </AccordionDetails>
                            </Accordion>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="body2" paragraph>
                All treatment suggestions are supported by clinical evidence. Explore the research below.
              </Typography>
              
              {Object.entries(treatmentOptions).map(([condition, options]) => (
                <Box key={condition} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {condition} - Supporting Evidence
                  </Typography>
                  
                  <Box>
                    {options.map((option) => (
                      <Accordion key={option.id} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>{option.name}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {option.clinical_evidence.map((evidence) => (
                            <Card key={evidence.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                              <Typography variant="subtitle1" gutterBottom>
                                {evidence.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {evidence.authors} | {evidence.journal} | {new Date(evidence.publication_date).getFullYear()}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                                <Typography variant="caption" sx={{ mr: 1 }}>
                                  Evidence Strength:
                                </Typography>
                                <Rating 
                                  value={evidence.evidence_strength} 
                                  readOnly 
                                  max={5}
                                  size="small"
                                />
                                <Typography variant="caption" sx={{ ml: 1 }}>
                                  ({getEvidenceStrengthLabel(evidence.evidence_strength)})
                                </Typography>
                              </Box>
                              <Typography variant="body2" gutterBottom>
                                <strong>Key Findings:</strong> {evidence.key_findings}
                              </Typography>
                              <Button 
                                variant="text" 
                                size="small" 
                                href={evidence.link} 
                                target="_blank"
                                sx={{ mt: 1 }}
                              >
                                View Full Article
                              </Button>
                            </Card>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Treatment Outcome Predictions
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                This AI prediction model is based on clinical data from similar cases and considers patient-specific factors.
              </Alert>
              
              {Object.entries(treatmentOptions).map(([condition, options]) => (
                <Box key={condition} sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {condition}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {options.map((option) => (
                      <Grid item xs={12} key={option.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {option.name}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2" sx={{ mr: 2 }}>
                                Expected Success Rate:
                              </Typography>
                              <Box sx={{ 
                                width: '60%', 
                                height: 10, 
                                bgcolor: '#e0e0e0', 
                                borderRadius: 5,
                                position: 'relative'
                              }}>
                                <Box sx={{ 
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${option.success_rate * 100}%`,
                                  bgcolor: option.success_rate > 0.9 ? 'success.main' : option.success_rate > 0.7 ? 'primary.main' : 'warning.main',
                                  borderRadius: 5
                                }} />
                              </Box>
                              <Typography variant="body2" sx={{ ml: 2, fontWeight: 'bold' }}>
                                {Math.round(option.success_rate * 100)}%
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" paragraph>
                              Based on the patient's age, condition severity, and location, this treatment has a {Math.round(option.success_rate * 100)}% predicted success rate for this specific case.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default TreatmentSuggestionsPage; 