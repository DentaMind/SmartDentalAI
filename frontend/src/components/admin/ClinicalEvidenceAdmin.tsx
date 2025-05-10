import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import clinicalEvidenceService, {
  ClinicalEvidence,
  EvidenceWithRelevance
} from '../../services/clinicalEvidenceService';

// Define tabs for admin interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`evidence-tabpanel-${index}`}
      aria-labelledby={`evidence-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ClinicalEvidenceAdmin: React.FC = () => {
  // State for evidence list and searching
  const [evidenceList, setEvidenceList] = useState<ClinicalEvidence[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvidenceType, setSelectedEvidenceType] = useState('');
  const [selectedEvidenceGrade, setSelectedEvidenceGrade] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  
  // State for evidence form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState<Partial<ClinicalEvidence>>({});
  
  // State for association tabs and forms
  const [tabValue, setTabValue] = useState(0);
  const [findingType, setFindingType] = useState('');
  const [procedureCode, setProcedureCode] = useState('');
  const [relevanceScore, setRelevanceScore] = useState(0.7);
  const [associationDialogOpen, setAssociationDialogOpen] = useState(false);
  const [associationType, setAssociationType] = useState<'finding' | 'treatment'>('finding');
  
  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load evidence on component mount and when search params change
  useEffect(() => {
    loadEvidence();
  }, [searchTerm, selectedEvidenceType, selectedEvidenceGrade, selectedSpecialty]);
  
  const loadEvidence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await clinicalEvidenceService.searchEvidence(
        searchTerm,
        selectedEvidenceType,
        selectedEvidenceGrade,
        selectedSpecialty
      );
      
      setEvidenceList(data);
    } catch (err) {
      console.error('Error loading evidence:', err);
      setError('Failed to load clinical evidence. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const openCreateDialog = () => {
    setCurrentEvidence({
      title: '',
      evidence_type: 'guideline',
      evidence_grade: 'B',
      specialties: [],
      conditions: [],
      procedures: []
    });
    setEditMode(false);
    setDialogOpen(true);
  };
  
  const openEditDialog = (evidence: ClinicalEvidence) => {
    setCurrentEvidence(evidence);
    setEditMode(true);
    setDialogOpen(true);
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
    setCurrentEvidence({});
  };
  
  const openAssociationDialog = (type: 'finding' | 'treatment', evidenceId: string) => {
    setAssociationType(type);
    setCurrentEvidence({ id: evidenceId });
    setAssociationDialogOpen(true);
  };
  
  const closeAssociationDialog = () => {
    setAssociationDialogOpen(false);
    setFindingType('');
    setProcedureCode('');
    setRelevanceScore(0.7);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentEvidence(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setCurrentEvidence(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateEvidence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentEvidence.title || !currentEvidence.evidence_type || !currentEvidence.evidence_grade) {
        setError('Title, evidence type, and evidence grade are required.');
        setLoading(false);
        return;
      }
      
      // Create new evidence
      await clinicalEvidenceService.createEvidence(currentEvidence);
      
      // Reload evidence list
      await loadEvidence();
      
      // Close dialog
      closeDialog();
    } catch (err) {
      console.error('Error creating evidence:', err);
      setError('Failed to create evidence. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateEvidence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentEvidence.id) {
        setError('Evidence ID is required for updating.');
        setLoading(false);
        return;
      }
      
      // Update evidence
      await clinicalEvidenceService.updateEvidence(currentEvidence.id, currentEvidence);
      
      // Reload evidence list
      await loadEvidence();
      
      // Close dialog
      closeDialog();
    } catch (err) {
      console.error('Error updating evidence:', err);
      setError('Failed to update evidence. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!window.confirm('Are you sure you want to delete this evidence?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Delete evidence
      await clinicalEvidenceService.deleteEvidence(evidenceId);
      
      // Reload evidence list
      await loadEvidence();
    } catch (err) {
      console.error('Error deleting evidence:', err);
      setError('Failed to delete evidence. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateAssociation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (associationType === 'finding') {
        if (!findingType || !currentEvidence.id) {
          setError('Finding type and evidence ID are required.');
          setLoading(false);
          return;
        }
        
        // Associate finding with evidence
        await clinicalEvidenceService.associateFindingWithEvidence(
          findingType,
          currentEvidence.id,
          relevanceScore
        );
      } else {
        if (!procedureCode || !currentEvidence.id) {
          setError('Procedure code and evidence ID are required.');
          setLoading(false);
          return;
        }
        
        // Associate treatment with evidence
        await clinicalEvidenceService.associateTreatmentWithEvidence(
          procedureCode,
          currentEvidence.id,
          relevanceScore
        );
      }
      
      // Close dialog
      closeAssociationDialog();
      
      // Show success message
      alert(`Successfully associated ${associationType} with evidence.`);
    } catch (err) {
      console.error('Error creating association:', err);
      setError(`Failed to associate ${associationType} with evidence. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Clinical Evidence Management
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Search Evidence"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Evidence Type</InputLabel>
              <Select
                value={selectedEvidenceType}
                label="Evidence Type"
                onChange={(e) => setSelectedEvidenceType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="guideline">Clinical Guideline</MenuItem>
                <MenuItem value="systematic_review">Systematic Review</MenuItem>
                <MenuItem value="clinical_trial">Clinical Trial</MenuItem>
                <MenuItem value="cohort_study">Cohort Study</MenuItem>
                <MenuItem value="case_control">Case-Control Study</MenuItem>
                <MenuItem value="case_series">Case Series</MenuItem>
                <MenuItem value="expert_opinion">Expert Opinion</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Evidence Grade</InputLabel>
              <Select
                value={selectedEvidenceGrade}
                label="Evidence Grade"
                onChange={(e) => setSelectedEvidenceGrade(e.target.value)}
              >
                <MenuItem value="">All Grades</MenuItem>
                <MenuItem value="A">Grade A (High)</MenuItem>
                <MenuItem value="B">Grade B (Moderate)</MenuItem>
                <MenuItem value="C">Grade C (Low)</MenuItem>
                <MenuItem value="D">Grade D (Very Low)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Specialty</InputLabel>
              <Select
                value={selectedSpecialty}
                label="Specialty"
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <MenuItem value="">All Specialties</MenuItem>
                <MenuItem value="general_dentistry">General Dentistry</MenuItem>
                <MenuItem value="endodontics">Endodontics</MenuItem>
                <MenuItem value="periodontics">Periodontics</MenuItem>
                <MenuItem value="prosthodontics">Prosthodontics</MenuItem>
                <MenuItem value="oral_surgery">Oral Surgery</MenuItem>
                <MenuItem value="orthodontics">Orthodontics</MenuItem>
                <MenuItem value="pediatric_dentistry">Pediatric Dentistry</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              fullWidth
              onClick={openCreateDialog}
            >
              Add Evidence
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Publication</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Specialties</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evidenceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No evidence found. Try adjusting your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                evidenceList.map((evidence) => (
                  <TableRow key={evidence.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {evidence.title}
                      </Typography>
                      {evidence.authors && (
                        <Typography variant="caption" color="textSecondary">
                          {evidence.authors}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {evidence.publication}
                      {evidence.publication_date && (
                        <Typography variant="caption" display="block">
                          {new Date(evidence.publication_date.toString()).getFullYear()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={evidence.evidence_type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`Grade ${evidence.evidence_grade}`}
                        size="small"
                        color={
                          evidence.evidence_grade === 'A' ? 'success' :
                          evidence.evidence_grade === 'B' ? 'info' :
                          evidence.evidence_grade === 'C' ? 'warning' :
                          'error'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {evidence.specialties && evidence.specialties.map((specialty, index) => (
                        <Chip 
                          key={index}
                          label={specialty}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => openEditDialog(evidence)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteEvidence(evidence.id)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="success"
                        onClick={() => openAssociationDialog('finding', evidence.id)}
                        size="small"
                        sx={{ mr: 1 }}
                        title="Link to Finding"
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Evidence Form Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Evidence' : 'Add New Evidence'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Title"
                fullWidth
                required
                value={currentEvidence.title || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="authors"
                label="Authors"
                fullWidth
                placeholder="e.g., Smith J, Johnson K"
                value={currentEvidence.authors || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="publication"
                label="Publication/Journal"
                fullWidth
                value={currentEvidence.publication || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                name="publication_date"
                label="Publication Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={currentEvidence.publication_date ? 
                  new Date(currentEvidence.publication_date.toString()).toISOString().split('T')[0] : 
                  ''
                }
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Evidence Type</InputLabel>
                <Select
                  name="evidence_type"
                  value={currentEvidence.evidence_type || 'guideline'}
                  label="Evidence Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="guideline">Clinical Guideline</MenuItem>
                  <MenuItem value="systematic_review">Systematic Review</MenuItem>
                  <MenuItem value="clinical_trial">Clinical Trial</MenuItem>
                  <MenuItem value="cohort_study">Cohort Study</MenuItem>
                  <MenuItem value="case_control">Case-Control Study</MenuItem>
                  <MenuItem value="case_series">Case Series</MenuItem>
                  <MenuItem value="expert_opinion">Expert Opinion</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Evidence Grade</InputLabel>
                <Select
                  name="evidence_grade"
                  value={currentEvidence.evidence_grade || 'B'}
                  label="Evidence Grade"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="A">Grade A (High)</MenuItem>
                  <MenuItem value="B">Grade B (Moderate)</MenuItem>
                  <MenuItem value="C">Grade C (Low)</MenuItem>
                  <MenuItem value="D">Grade D (Very Low)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="doi"
                label="DOI"
                fullWidth
                placeholder="e.g., 10.1002/JPER.18-0157"
                value={currentEvidence.doi || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="url"
                label="URL"
                fullWidth
                placeholder="e.g., https://example.com/evidence"
                value={currentEvidence.url || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="summary"
                label="Summary"
                fullWidth
                multiline
                rows={3}
                value={currentEvidence.summary || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="specialties"
                label="Specialties (comma-separated)"
                fullWidth
                placeholder="e.g., periodontics, general_dentistry"
                value={Array.isArray(currentEvidence.specialties) ? currentEvidence.specialties.join(', ') : ''}
                onChange={(e) => {
                  setCurrentEvidence(prev => ({
                    ...prev,
                    specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }));
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDialog}>
            Cancel
          </Button>
          <Button 
            onClick={editMode ? handleUpdateEvidence : handleCreateEvidence} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editMode ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Association Dialog */}
      <Dialog open={associationDialogOpen} onClose={closeAssociationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Associate {associationType === 'finding' ? 'Finding' : 'Treatment'} with Evidence
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {associationType === 'finding' ? (
              <Grid item xs={12}>
                <TextField
                  label="Finding Type"
                  fullWidth
                  required
                  placeholder="e.g., caries, periapical_lesion"
                  value={findingType}
                  onChange={(e) => setFindingType(e.target.value)}
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  label="Procedure Code"
                  fullWidth
                  required
                  placeholder="e.g., D2391, D3310"
                  value={procedureCode}
                  onChange={(e) => setProcedureCode(e.target.value)}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                label="Relevance Score (0.0 to 1.0)"
                type="number"
                fullWidth
                InputProps={{
                  inputProps: { min: 0, max: 1, step: 0.1 }
                }}
                value={relevanceScore}
                onChange={(e) => setRelevanceScore(parseFloat(e.target.value))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeAssociationDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAssociation} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Association'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClinicalEvidenceAdmin; 