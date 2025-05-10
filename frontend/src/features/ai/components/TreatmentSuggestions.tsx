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
  TextField,
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
  Badge
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lightbulb as LightbulbIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import aiTreatmentSuggestionService, {
  AITreatmentSuggestion,
  TreatmentSuggestionGroup,
  TreatmentSuggestionGroupWithDetails
} from '../../services/aiTreatmentSuggestionService';

// Helper function to get color based on confidence level
const getConfidenceColor = (level: string): string => {
  switch (level) {
    case 'very_high': return '#00C853';
    case 'high': return '#64DD17';
    case 'medium': return '#FFD600';
    case 'low': return '#FF9100';
    default: return '#FFD600';
  }
};

// Helper function to get color based on priority
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent': return '#D50000';
    case 'high': return '#FF6D00';
    case 'medium': return '#FFD600';
    case 'low': return '#00C853';
    default: return '#FFD600';
  }
};

interface TreatmentSuggestionsProps {
  patientId: string;
  diagnosisId?: string;
  onTreatmentPlanCreated?: (treatmentPlanId: string) => void;
}

const TreatmentSuggestions: React.FC<TreatmentSuggestionsProps> = ({
  patientId,
  diagnosisId,
  onTreatmentPlanCreated
}) => {
  // State for suggestions and groups
  const [suggestions, setSuggestions] = useState<AITreatmentSuggestion[]>([]);
  const [groups, setGroups] = useState<TreatmentSuggestionGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TreatmentSuggestionGroupWithDetails | null>(null);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [modifySuggestionDialogOpen, setModifySuggestionDialogOpen] = useState<boolean>(false);
  const [rejectSuggestionDialogOpen, setRejectSuggestionDialogOpen] = useState<boolean>(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AITreatmentSuggestion | null>(null);
  const [clinicianNotes, setClinicianNotes] = useState<string>('');
  const [modifiedProcedure, setModifiedProcedure] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [treatmentPlanTitle, setTreatmentPlanTitle] = useState<string>('');
  const [treatmentPlanDescription, setTreatmentPlanDescription] = useState<string>('');
  
  // Load suggestions for the patient
  useEffect(() => {
    if (patientId) {
      loadSuggestions();
    }
  }, [patientId]);
  
  // Function to load suggestions
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get suggestion groups for the patient
      const groupsData = await aiTreatmentSuggestionService.getSuggestionGroupsByPatient(patientId);
      setGroups(groupsData);
      
      // Get all suggestions for the patient
      const suggestionsData = await aiTreatmentSuggestionService.getSuggestionsByPatient(patientId);
      setSuggestions(suggestionsData);
      
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError('Failed to load AI treatment suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to generate suggestions from a diagnosis
  const generateSuggestions = async () => {
    if (!diagnosisId) {
      setError('No diagnosis selected for generating suggestions.');
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Generate suggestions from the diagnosis
      const result = await aiTreatmentSuggestionService.generateSuggestionsFromDiagnosis(diagnosisId);
      
      // Update state with new data
      setSuggestions(prev => [...result.suggestions, ...prev]);
      setGroups(prev => [...result.groups, ...prev]);
      
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Failed to generate AI treatment suggestions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  // Function to toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Function to view group details
  const viewGroupDetails = async (groupId: string) => {
    try {
      setLoading(true);
      
      // Get detailed group information
      const groupDetails = await aiTreatmentSuggestionService.getSuggestionGroupById(groupId);
      setSelectedGroup(groupDetails);
      setDialogOpen(true);
      
      // Initialize treatment plan title and description
      setTreatmentPlanTitle(groupDetails.title);
      setTreatmentPlanDescription(groupDetails.description || '');
      
    } catch (err) {
      console.error('Error loading group details:', err);
      setError('Failed to load suggestion group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to convert group to treatment plan
  const convertToTreatmentPlan = async () => {
    if (!selectedGroup) return;
    
    try {
      setLoading(true);
      
      // Convert the group to a treatment plan
      const result = await aiTreatmentSuggestionService.convertToTreatmentPlan(
        selectedGroup.id,
        treatmentPlanTitle,
        treatmentPlanDescription
      );
      
      // Close the dialog
      setDialogOpen(false);
      
      // Call the callback if provided
      if (onTreatmentPlanCreated) {
        onTreatmentPlanCreated(result.treatment_plan_id);
      }
      
    } catch (err) {
      console.error('Error converting to treatment plan:', err);
      setError('Failed to create treatment plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle suggestion acceptance
  const acceptSuggestion = async (suggestionId: string) => {
    try {
      await aiTreatmentSuggestionService.updateSuggestion(suggestionId, {
        status: 'accepted'
      });
      
      // Refresh the data
      loadSuggestions();
      
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      setError('Failed to accept suggestion. Please try again.');
    }
  };
  
  // Function to open modify suggestion dialog
  const openModifySuggestionDialog = (suggestion: AITreatmentSuggestion) => {
    setSelectedSuggestion(suggestion);
    setModifiedProcedure(suggestion.procedure_name);
    setClinicianNotes('');
    setModifySuggestionDialogOpen(true);
  };
  
  // Function to handle suggestion modification
  const modifySuggestion = async () => {
    if (!selectedSuggestion) return;
    
    try {
      await aiTreatmentSuggestionService.updateSuggestion(selectedSuggestion.id, {
        status: 'modified',
        modified_procedure: modifiedProcedure,
        clinician_notes: clinicianNotes
      });
      
      // Close the dialog and refresh data
      setModifySuggestionDialogOpen(false);
      loadSuggestions();
      
    } catch (err) {
      console.error('Error modifying suggestion:', err);
      setError('Failed to modify suggestion. Please try again.');
    }
  };
  
  // Function to open reject suggestion dialog
  const openRejectSuggestionDialog = (suggestion: AITreatmentSuggestion) => {
    setSelectedSuggestion(suggestion);
    setRejectionReason('');
    setRejectSuggestionDialogOpen(true);
  };
  
  // Function to handle suggestion rejection
  const rejectSuggestion = async () => {
    if (!selectedSuggestion) return;
    
    try {
      await aiTreatmentSuggestionService.updateSuggestion(selectedSuggestion.id, {
        status: 'rejected',
        rejection_reason: rejectionReason
      });
      
      // Close the dialog and refresh data
      setRejectSuggestionDialogOpen(false);
      loadSuggestions();
      
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
      setError('Failed to reject suggestion. Please try again.');
    }
  };
  
  // If patient ID is not provided, show a message
  if (!patientId) {
    return (
      <Card>
        <CardContent>
          <Typography>Please select a patient to view AI treatment suggestions.</Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#FFB300' }} />
          AI Treatment Suggestions
        </Typography>
        
        {diagnosisId && (
          <Button
            variant="contained"
            color="primary"
            disabled={generating}
            onClick={generateSuggestions}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <MedicalIcon />}
          >
            {generating ? 'Generating...' : 'Generate Suggestions'}
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {groups.length === 0 ? (
            <Card>
              <CardContent>
                <Typography align="center">
                  No AI treatment suggestions available for this patient.
                  {diagnosisId && " Click 'Generate Suggestions' to create suggestions from the current diagnosis."}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {groups.map(group => (
                <Grid item xs={12} key={group.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h6">
                            {group.title}
                          </Typography>
                          <Chip
                            label={group.priority}
                            size="small"
                            sx={{
                              ml: 1,
                              backgroundColor: getPriorityColor(group.priority),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                          {group.condition_category && (
                            <Chip
                              label={group.condition_category}
                              size="small"
                              sx={{ ml: 1 }}
                              color="default"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        <Box>
                          <Tooltip title="View Detailed Suggestions">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => viewGroupDetails(group.id)}
                              startIcon={<AssignmentIcon />}
                              sx={{ mr: 1 }}
                            >
                              Details
                            </Button>
                          </Tooltip>
                          
                          <IconButton onClick={() => toggleGroupExpansion(group.id)}>
                            {expandedGroups[group.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {group.description && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {group.description}
                        </Typography>
                      )}
                      
                      <Collapse in={expandedGroups[group.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 2 }}>
                          <Divider sx={{ mb: 2 }} />
                          
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Suggested Treatments:
                          </Typography>
                          
                          <Grid container spacing={1}>
                            {suggestions
                              .filter(s => group.suggestions.includes(s.id))
                              .map(suggestion => (
                                <Grid item xs={12} sm={6} md={4} key={suggestion.id}>
                                  <Card variant="outlined">
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle2">
                                          {suggestion.procedure_name}
                                        </Typography>
                                        <Chip
                                          label={suggestion.status}
                                          size="small"
                                          color={
                                            suggestion.status === 'accepted' ? 'success' :
                                            suggestion.status === 'rejected' ? 'error' :
                                            suggestion.status === 'modified' ? 'warning' : 'default'
                                          }
                                        />
                                      </Box>
                                      
                                      {suggestion.tooth_number && (
                                        <Typography variant="body2" color="textSecondary">
                                          Tooth #{suggestion.tooth_number}
                                        </Typography>
                                      )}
                                      
                                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Tooltip title="View Details">
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              setSelectedSuggestion(suggestion);
                                              // Implementation TBD
                                            }}
                                          >
                                            <InfoIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                          </Grid>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Group Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedGroup?.title || 'Treatment Suggestions'}
        </DialogTitle>
        
        <DialogContent>
          {selectedGroup && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedGroup.description}
              </Typography>
              
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Convert to Treatment Plan
                </Typography>
                
                <TextField
                  label="Treatment Plan Title"
                  fullWidth
                  margin="normal"
                  value={treatmentPlanTitle}
                  onChange={(e) => setTreatmentPlanTitle(e.target.value)}
                />
                
                <TextField
                  label="Treatment Plan Description"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  value={treatmentPlanDescription}
                  onChange={(e) => setTreatmentPlanDescription(e.target.value)}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Suggested Procedures
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Procedure</TableCell>
                      <TableCell>Tooth</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedGroup.suggestions_details.map((suggestion) => (
                      <TableRow key={suggestion.id}>
                        <TableCell>
                          <Tooltip title={suggestion.reasoning}>
                            <Box>
                              <Typography variant="body2">
                                {suggestion.procedure_name}
                              </Typography>
                              {suggestion.procedure_code && (
                                <Typography variant="caption" color="textSecondary">
                                  {suggestion.procedure_code}
                                </Typography>
                              )}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{suggestion.tooth_number || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={suggestion.priority}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(suggestion.priority),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getConfidenceColor(suggestion.confidence_level),
                                mr: 1
                              }}
                            />
                            <Typography variant="body2">
                              {Math.round(suggestion.confidence * 100)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={suggestion.status}
                            size="small"
                            color={
                              suggestion.status === 'accepted' ? 'success' :
                              suggestion.status === 'rejected' ? 'error' :
                              suggestion.status === 'modified' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          {suggestion.status === 'pending' && (
                            <>
                              <Tooltip title="Accept">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => acceptSuggestion(suggestion.id)}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Modify">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => openModifySuggestionDialog(suggestion)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openRejectSuggestionDialog(suggestion)}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={convertToTreatmentPlan}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Treatment Plan'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modify Suggestion Dialog */}
      <Dialog
        open={modifySuggestionDialogOpen}
        onClose={() => setModifySuggestionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modify Treatment Suggestion</DialogTitle>
        
        <DialogContent>
          <TextField
            label="Modified Procedure"
            fullWidth
            margin="normal"
            value={modifiedProcedure}
            onChange={(e) => setModifiedProcedure(e.target.value)}
          />
          
          <TextField
            label="Clinical Notes"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={clinicianNotes}
            onChange={(e) => setClinicianNotes(e.target.value)}
            placeholder="Explain why you're modifying this suggestion..."
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setModifySuggestionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={modifySuggestion}
            variant="contained"
            color="primary"
            disabled={!modifiedProcedure.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Suggestion Dialog */}
      <Dialog
        open={rejectSuggestionDialogOpen}
        onClose={() => setRejectSuggestionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Treatment Suggestion</DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Please provide a reason for rejecting this suggestion. This feedback helps improve the AI system.
          </Typography>
          
          <TextField
            label="Rejection Reason"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this suggestion is not appropriate..."
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setRejectSuggestionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={rejectSuggestion}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Reject Suggestion
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TreatmentSuggestions; 