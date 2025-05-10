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
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  HighlightOff as CloseIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  MedicalServices as MedicalIcon,
  LibraryBooks as LibraryIcon,
  Bookmark as BookmarkIcon,
  MenuBook as BookIcon
} from '@mui/icons-material';
import aiTreatmentSuggestionService, { 
  AITreatmentSuggestion,
  TreatmentSuggestionGroup
} from '../../services/aiTreatmentSuggestionService';
import clinicalEvidenceService, {
  ClinicalEvidence,
  EvidenceCitation
} from '../../services/clinicalEvidenceService';

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

interface AITreatmentSuggestionsProps {
  patientId: string;
  diagnosisId?: string;
  findingType?: string;
  onTreatmentSelected?: (treatment: AITreatmentSuggestion) => void;
}

const AITreatmentSuggestions: React.FC<AITreatmentSuggestionsProps> = ({
  patientId,
  diagnosisId,
  findingType,
  onTreatmentSelected
}) => {
  // State for suggestions
  const [suggestions, setSuggestions] = useState<AITreatmentSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AITreatmentSuggestion | null>(null);
  
  // State for evidence
  const [evidence, setEvidence] = useState<EvidenceCitation[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState<boolean>(false);
  
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
      setLoadingEvidence(true);
      setSelectedSuggestion(suggestion);
      
      // Finding type may come from the suggestion or from props
      const finding = suggestion.finding_type || findingType;
      
      if (!finding || !suggestion.procedure_code) {
        setEvidence([]);
        return;
      }
      
      // Get evidence that links this finding with this treatment
      const evidenceData = await clinicalEvidenceService.getCitationsForSuggestion(
        finding,
        suggestion.procedure_code,
        suggestion.specialty_area
      );
      
      setEvidence(evidenceData);
      setEvidenceDialogOpen(true);
      
    } catch (err) {
      console.error('Error loading evidence:', err);
      setError('Failed to load clinical evidence. Please try again.');
    } finally {
      setLoadingEvidence(false);
    }
  };
  
  // Function to format publication date
  const formatPublicationDate = (dateString: string) => {
    if (!dateString) return 'n/a';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Procedure</TableCell>
                    <TableCell>Tooth Number</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Evidence</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {suggestion.procedure_name}
                        </Typography>
                        {suggestion.procedure_code && (
                          <Typography variant="caption" color="textSecondary">
                            {suggestion.procedure_code}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{suggestion.tooth_number || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={suggestion.priority || 'Medium'} 
                          size="small"
                          color={
                            suggestion.priority === 'urgent' ? 'error' :
                            suggestion.priority === 'high' ? 'warning' :
                            suggestion.priority === 'low' ? 'success' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {suggestion.confidence ? `${Math.round(suggestion.confidence * 100)}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<LibraryIcon />}
                          onClick={() => loadEvidenceForSuggestion(suggestion)}
                          variant="outlined"
                        >
                          View Evidence
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => onTreatmentSelected && onTreatmentSelected(suggestion)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
      
      {/* Clinical Evidence Dialog */}
      <Dialog
        open={evidenceDialogOpen}
        onClose={() => setEvidenceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BookIcon sx={{ mr: 1 }} />
            Clinical Evidence
            {selectedSuggestion && (
              <Typography variant="subtitle1" sx={{ ml: 1 }}>
                for {selectedSuggestion.procedure_name}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {loadingEvidence ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {evidence.length === 0 ? (
                <Alert severity="info">
                  No specific clinical evidence is available for this treatment suggestion.
                </Alert>
              ) : (
                <Box>
                  {evidence.map((citation, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" component="div">
                            {citation.title}
                          </Typography>
                          <Chip
                            label={`Grade ${citation.evidence_grade}`}
                            size="small"
                            sx={{
                              bgcolor: getEvidenceGradeColor(citation.evidence_grade),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                        
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          <Box component="span" sx={{ fontWeight: 'bold' }}>Source:</Box> {citation.publication || 'Not specified'}
                          {citation.publication_date && ` • ${formatPublicationDate(citation.publication_date.toString())}`}
                        </Typography>
                        
                        {citation.authors && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <Box component="span" sx={{ fontWeight: 'bold' }}>Authors:</Box> {citation.authors}
                          </Typography>
                        )}
                        
                        <Chip
                          label={getEvidenceTypeLabel(citation.evidence_type)}
                          size="small"
                          sx={{ mt: 1, mb: 2 }}
                          variant="outlined"
                        />
                        
                        {citation.summary && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <Box component="span" sx={{ fontWeight: 'bold' }}>Summary:</Box>
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {citation.summary}
                            </Typography>
                          </Box>
                        )}
                        
                        {citation.quote && (
                          <Box sx={{ 
                            mt: 1, 
                            p: 1.5, 
                            bgcolor: 'rgba(0,0,0,0.04)', 
                            borderLeft: '4px solid', 
                            borderColor: 'primary.main'
                          }}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              "{citation.quote}"
                            </Typography>
                            {citation.page_reference && (
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                Reference: p. {citation.page_reference}
                              </Typography>
                            )}
                          </Box>
                        )}
                        
                        {citation.doi && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              <Box component="span" sx={{ fontWeight: 'bold' }}>DOI:</Box> 
                              <Link href={`https://doi.org/${citation.doi}`} target="_blank" sx={{ ml: 0.5 }}>
                                {citation.doi}
                              </Link>
                            </Typography>
                          </Box>
                        )}
                        
                        {citation.url && !citation.doi && (
                          <Box sx={{ mt: 1 }}>
                            <Link href={citation.url} target="_blank">
                              View Source
                            </Link>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setEvidenceDialogOpen(false)}>
            Close
          </Button>
          {selectedSuggestion && onTreatmentSelected && (
            <Button
              onClick={() => {
                onTreatmentSelected(selectedSuggestion);
                setEvidenceDialogOpen(false);
              }}
              variant="contained"
              color="primary"
            >
              Select This Treatment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AITreatmentSuggestions; 