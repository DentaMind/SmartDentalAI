import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Rating,
  Paper,
  Tooltip,
  Link,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  LibraryBooks as LibraryIcon,
  Science as ScienceIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MedicalServices as MedicalIcon,
  MenuBook as BookIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import aiTreatmentSuggestionService, { 
  AITreatmentSuggestion
} from '../../services/aiTreatmentSuggestionService';
import clinicalEvidenceService, {
  EvidenceCitation
} from '../../services/clinicalEvidenceService';
import pdfExportService from '../../services/pdfExportService';
import aiFeedbackService from '../../services/aiFeedbackService';
import { useSession } from '../../lib/useSession';

// Helper function to format evidence grade description
const getEvidenceGradeDescription = (grade: string): string => {
  switch (grade) {
    case 'A': return 'High quality evidence';
    case 'B': return 'Moderate quality evidence';
    case 'C': return 'Low quality evidence'; 
    case 'D': return 'Very low quality evidence';
    default: return 'Unknown evidence quality';
  }
};

// Helper function to format evidence grade color
const getEvidenceGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return '#00C853'; // High quality
    case 'B': return '#64DD17'; // Moderate quality
    case 'C': return '#FFD600'; // Low quality 
    case 'D': return '#FF9100'; // Very low quality
    default: return '#757575';
  }
};

// Helper function to format evidence type badge
const getEvidenceTypeLabel = (type: string): string => {
  switch (type) {
    case 'guideline': return 'Clinical Guideline';
    case 'systematic_review': return 'Systematic Review';
    case 'clinical_trial': return 'Clinical Trial';
    case 'cohort_study': return 'Cohort Study';
    case 'case_control': return 'Case-Control Study';
    case 'case_series': return 'Case Series';
    case 'expert_opinion': return 'Expert Opinion';
    default: return type.replace('_', ' ');
  }
};

interface AITreatmentSuggestionsWithEvidenceProps {
  patientId: string;
  diagnosisId?: string;
  findingType?: string;
  onTreatmentSelected?: (treatment: AITreatmentSuggestion) => void;
  patient?: any; // Optional patient data for PDF export
  diagnosis?: any; // Optional diagnosis data for PDF export
}

const AITreatmentSuggestionsWithEvidence: React.FC<AITreatmentSuggestionsWithEvidenceProps> = ({
  patientId,
  diagnosisId,
  findingType,
  onTreatmentSelected,
  patient,
  diagnosis
}) => {
  // State for suggestions
  const [suggestions, setSuggestions] = useState<AITreatmentSuggestion[]>([]);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  
  // State for evidence
  const [evidenceMap, setEvidenceMap] = useState<Record<string, EvidenceCitation[]>>({});
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingEvidenceFor, setLoadingEvidenceFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  
  // Menu state for export options
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Add auth session to get current user info
  const { user } = useSession();
  
  // Load suggestions when component mounts or patientId/diagnosisId changes
  useEffect(() => {
    if (patientId && diagnosisId) {
      loadSuggestions();
    }
  }, [patientId, diagnosisId]);
  
  // Function to load treatment suggestions
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get suggestions for the diagnosis
      const suggestionsData = await aiTreatmentSuggestionService.getSuggestionsByDiagnosis(diagnosisId!);
      setSuggestions(suggestionsData);
      
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError('Failed to load AI treatment suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load clinical evidence for a specific suggestion
  const loadEvidenceForSuggestion = async (suggestion: AITreatmentSuggestion) => {
    try {
      setLoadingEvidenceFor(suggestion.id);
      
      // Finding type may come from the suggestion or from props
      const finding = suggestion.finding_type || findingType;
      
      if (!finding || !suggestion.procedure_code) {
        // If we don't have required info, just expand the accordion without evidence
        setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id);
        setLoadingEvidenceFor(null);
        return;
      }
      
      // Check if we already loaded evidence for this suggestion
      if (!evidenceMap[suggestion.id]) {
        // Get evidence that links this finding with this treatment
        const evidenceData = await clinicalEvidenceService.getCitationsForSuggestion(
          finding,
          suggestion.procedure_code,
          suggestion.specialty_area
        );
        
        setEvidenceMap(prev => ({
          ...prev,
          [suggestion.id]: evidenceData
        }));
      }
      
      // Toggle the accordion
      setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id);
      
    } catch (err) {
      console.error('Error loading evidence:', err);
      setError('Failed to load clinical evidence. Please try again.');
    } finally {
      setLoadingEvidenceFor(null);
    }
  };
  
  // Function to format publication date
  const formatPublicationDate = (dateString: string) => {
    if (!dateString) return 'n/a';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };
  
  // Calculate evidence strength score (average of evidence grades, weighted by relevance)
  const calculateEvidenceStrength = (evidenceList: EvidenceCitation[]): number => {
    if (!evidenceList || evidenceList.length === 0) return 0;
    
    const gradeValues: Record<string, number> = {
      'A': 4,
      'B': 3,
      'C': 2,
      'D': 1
    };
    
    const sum = evidenceList.reduce((acc, evidence) => {
      return acc + (gradeValues[evidence.evidence_grade] || 0);
    }, 0);
    
    return sum / evidenceList.length;
  };
  
  // Function to handle opening the export menu
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  // Function to handle closing the export menu
  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };
  
  // Function to export the treatment plan as PDF
  const handleExportPDF = async (includeDetails: boolean) => {
    try {
      setExportLoading(true);
      handleExportClose();
      
      // Ensure we have loaded evidence for all suggestions
      for (const suggestion of suggestions) {
        if (!evidenceMap[suggestion.id]) {
          // Finding type may come from the suggestion or from props
          const finding = suggestion.finding_type || findingType;
          
          if (finding && suggestion.procedure_code) {
            const evidenceData = await clinicalEvidenceService.getCitationsForSuggestion(
              finding,
              suggestion.procedure_code,
              suggestion.specialty_area
            );
            
            setEvidenceMap(prev => ({
              ...prev,
              [suggestion.id]: evidenceData
            }));
          }
        }
      }
      
      // Prepare patient info
      const patientInfo = patient || {
        id: patientId,
        first_name: "Patient",
        last_name: "Record"
      };
      
      // Prepare diagnosis info
      const diagnosisInfo = diagnosis || {
        id: diagnosisId || "",
        finding_type: findingType
      };
      
      // Generate and download the PDF
      await pdfExportService.downloadTreatmentPlanPDF(
        patientInfo,
        diagnosisInfo,
        suggestions,
        evidenceMap,
        {
          includeEvidenceDetails: includeDetails,
          includeClinicalReferences: includeDetails
        }
      );
      
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export treatment plan as PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Function to handle treatment selection with feedback
  const handleTreatmentSelect = async (suggestion: AITreatmentSuggestion) => {
    try {
      // First, call the parent component's callback
      if (onTreatmentSelected) {
        onTreatmentSelected(suggestion);
      }
      
      // Then, record the feedback if we have a current user
      if (user && user.id && diagnosisId) {
        await aiFeedbackService.recordTreatmentFeedback({
          treatmentSuggestionId: suggestion.id,
          diagnosisId: diagnosisId,
          patientId: patientId,
          providerId: user.id,
          action: 'accepted',
          confidence: suggestion.confidence,
          // Optional: also record evidence quality if we have evidence
          evidenceQualityRating: evidenceMap[suggestion.id]?.length > 0 
            ? calculateEvidenceStrength(evidenceMap[suggestion.id]) 
            : undefined
        });
        
        // Also record evidence feedback if we have evidence
        if (evidenceMap[suggestion.id]?.length > 0) {
          // Create array of evidence feedback
          const evidenceFeedback = evidenceMap[suggestion.id].map(evidence => ({
            evidenceId: evidence.id,
            treatmentSuggestionId: suggestion.id,
            providerId: user.id,
            relevanceScore: 0.8, // Default value for accepted treatments
            accuracy: Math.ceil(calculateEvidenceStrength(evidenceMap[suggestion.id])) // Convert to 1-5 scale
          }));
          
          // Record bulk evidence feedback
          await aiFeedbackService.recordBulkEvidenceFeedback(evidenceFeedback);
        }
      }
    } catch (err) {
      console.error('Error recording treatment feedback:', err);
      // No need to show error to user as this is a background operation
    }
  };
  
  // If patient ID is not provided, show a message
  if (!patientId || !diagnosisId) {
    return (
      <Card>
        <CardContent>
          <Typography>Please select a patient and diagnosis to view AI treatment suggestions.</Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#FFB300' }} />
          Evidence-Based Treatment Suggestions
        </Typography>
        
        {/* Export Button */}
        {suggestions.length > 0 && (
          <Button
            variant="outlined"
            startIcon={exportLoading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            onClick={handleExportClick}
            disabled={exportLoading}
            size="small"
          >
            Export
          </Button>
        )}
        
        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={() => handleExportPDF(false)}>
            Export Summary PDF
          </MenuItem>
          <MenuItem onClick={() => handleExportPDF(true)}>
            Export Detailed PDF with Evidence
          </MenuItem>
        </Menu>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {suggestions.length === 0 ? (
            <Card>
              <CardContent>
                <Typography align="center">
                  No AI treatment suggestions available for this diagnosis.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {suggestions.map((suggestion) => (
                <Accordion 
                  key={suggestion.id}
                  expanded={expandedSuggestion === suggestion.id}
                  onChange={() => loadEvidenceForSuggestion(suggestion)}
                  sx={{ 
                    mb: 2,
                    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
                    '&:before': { display: 'none' },
                    borderRadius: '4px'
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      borderBottom: expandedSuggestion === suggestion.id ? '1px solid rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {suggestion.procedure_name}
                        </Typography>
                        {suggestion.procedure_code && (
                          <Typography variant="caption" color="textSecondary">
                            {suggestion.procedure_code}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={6} sm={2}>
                        {suggestion.tooth_number ? (
                          <Chip 
                            label={`Tooth ${suggestion.tooth_number}`}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No specific tooth
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={6} sm={2}>
                        <Chip 
                          label={suggestion.priority || 'Medium'} 
                          size="small"
                          color={
                            suggestion.priority === 'urgent' ? 'error' :
                            suggestion.priority === 'high' ? 'warning' :
                            suggestion.priority === 'low' ? 'success' : 'default'
                          }
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={2}>
                        {loadingEvidenceFor === suggestion.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LibraryIcon sx={{ mr: 0.5, fontSize: '1rem', color: 'primary.main' }} />
                            <Typography variant="body2">
                              Evidence
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      
                      <Grid item xs={6} sm={2}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTreatmentSelect(suggestion);
                          }}
                        >
                          Select
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  
                  <AccordionDetails sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="h6" gutterBottom>
                            <MedicalIcon sx={{ mr: 1, fontSize: '1.2rem', verticalAlign: 'middle' }} />
                            Treatment Details
                          </Typography>
                          
                          <List dense disablePadding>
                            <ListItem disableGutters>
                              <ListItemText 
                                primary="Confidence Score" 
                                secondary={suggestion.confidence ? `${Math.round(suggestion.confidence * 100)}%` : 'Not specified'}
                              />
                            </ListItem>
                            
                            <ListItem disableGutters>
                              <ListItemText 
                                primary="Finding" 
                                secondary={suggestion.finding_type || findingType || 'Not specified'}
                              />
                            </ListItem>
                            
                            {suggestion.specialty_area && (
                              <ListItem disableGutters>
                                <ListItemText 
                                  primary="Specialty" 
                                  secondary={suggestion.specialty_area}
                                />
                              </ListItem>
                            )}
                            
                            {suggestion.notes && (
                              <ListItem disableGutters>
                                <ListItemText 
                                  primary="AI Notes" 
                                  secondary={suggestion.notes}
                                />
                              </ListItem>
                            )}
                          </List>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={8}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                              <BookIcon sx={{ mr: 1, fontSize: '1.2rem', verticalAlign: 'middle' }} />
                              Supporting Clinical Evidence
                            </Typography>
                            
                            {evidenceMap[suggestion.id] && evidenceMap[suggestion.id].length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                                  Evidence Strength:
                                </Typography>
                                <Rating
                                  value={calculateEvidenceStrength(evidenceMap[suggestion.id])}
                                  max={4}
                                  precision={0.5}
                                  readOnly
                                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                                  icon={<StarIcon fontSize="inherit" />}
                                />
                              </Box>
                            )}
                          </Box>
                          
                          {loadingEvidenceFor === suggestion.id ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                              <CircularProgress />
                            </Box>
                          ) : (
                            <>
                              {!evidenceMap[suggestion.id] || evidenceMap[suggestion.id].length === 0 ? (
                                <Alert severity="info">
                                  No specific clinical evidence is available for this treatment suggestion.
                                </Alert>
                              ) : (
                                <Box>
                                  {evidenceMap[suggestion.id].map((citation, index) => (
                                    <React.Fragment key={index}>
                                      {index > 0 && <Divider sx={{ my: 2 }} />}
                                      
                                      <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                                          <Typography variant="subtitle1" fontWeight="medium">
                                            {citation.title}
                                          </Typography>
                                          
                                          <Tooltip title={getEvidenceGradeDescription(citation.evidence_grade)}>
                                            <Chip
                                              label={`Grade ${citation.evidence_grade}`}
                                              size="small"
                                              sx={{
                                                bgcolor: getEvidenceGradeColor(citation.evidence_grade),
                                                color: 'white',
                                                fontWeight: 'bold',
                                                ml: 1
                                              }}
                                            />
                                          </Tooltip>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
                                          <Chip
                                            label={getEvidenceTypeLabel(citation.evidence_type)}
                                            size="small"
                                            variant="outlined"
                                            sx={{ mr: 1, mb: 0.5 }}
                                          />
                                          
                                          {citation.publication && (
                                            <Typography variant="body2" color="textSecondary" sx={{ mr: 1, mb: 0.5 }}>
                                              {citation.publication}
                                            </Typography>
                                          )}
                                          
                                          {citation.publication_date && (
                                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                              ({formatPublicationDate(citation.publication_date.toString())})
                                            </Typography>
                                          )}
                                        </Box>
                                        
                                        {citation.quote && (
                                          <Box sx={{ 
                                            p: 1.5, 
                                            bgcolor: 'rgba(0,0,0,0.04)', 
                                            borderLeft: '4px solid', 
                                            borderColor: 'primary.main',
                                            my: 1
                                          }}>
                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                              "{citation.quote}"
                                            </Typography>
                                            {citation.page_reference && (
                                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                p. {citation.page_reference}
                                              </Typography>
                                            )}
                                          </Box>
                                        )}
                                        
                                        {citation.summary && (
                                          <Typography variant="body2" paragraph>
                                            {citation.summary}
                                          </Typography>
                                        )}
                                        
                                        {(citation.doi || citation.url) && (
                                          <Box sx={{ mt: 1 }}>
                                            {citation.doi ? (
                                              <Link href={`https://doi.org/${citation.doi}`} target="_blank">
                                                View Source (DOI: {citation.doi})
                                              </Link>
                                            ) : (
                                              <Link href={citation.url} target="_blank">
                                                View Source
                                              </Link>
                                            )}
                                          </Box>
                                        )}
                                      </Box>
                                    </React.Fragment>
                                  ))}
                                </Box>
                              )}
                            </>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default AITreatmentSuggestionsWithEvidence; 