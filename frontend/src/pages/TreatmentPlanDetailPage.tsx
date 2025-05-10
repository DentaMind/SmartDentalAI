import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTreatmentPlan } from '../hooks/useTreatmentPlan';
import { usePatient } from '../hooks/usePatients';
import Loading from '../components/ui/Loading';
import { ROUTES } from '../config/constants';

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
      id={`treatment-tabpanel-${index}`}
      aria-labelledby={`treatment-tab-${index}`}
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

const TreatmentPlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plan, summary, isLoading, addProcedure, updateProcedureStatus, approvePlan, signConsent, completePlan, isError } = useTreatmentPlan(planId);
  const [tabValue, setTabValue] = useState(0);
  const [openProcedureDialog, setOpenProcedureDialog] = useState(false);
  const [openSignConsentDialog, setOpenSignConsentDialog] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [signedBy, setSignedBy] = useState('');
  const [procedureData, setProcedureData] = useState({
    procedureName: '',
    toothNumber: '',
    cdtCode: '',
    description: '',
    fee: 0,
    priority: 'medium',
    phase: 'phase_1',
  });
  const [note, setNote] = useState('');

  // Get patient information if available
  const { patient, isLoading: isLoadingPatient } = usePatient(plan?.patient_id);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddProcedure = async () => {
    if (!planId) return;
    
    try {
      await addProcedure({
        procedure_name: procedureData.procedureName,
        tooth_number: procedureData.toothNumber || undefined,
        cdt_code: procedureData.cdtCode || undefined,
        description: procedureData.description || undefined,
        fee: procedureData.fee,
        priority: procedureData.priority as any,
        phase: procedureData.phase as any,
      });
      
      setOpenProcedureDialog(false);
      setProcedureData({
        procedureName: '',
        toothNumber: '',
        cdtCode: '',
        description: '',
        fee: 0,
        priority: 'medium',
        phase: 'phase_1',
      });
    } catch (error) {
      console.error('Error adding procedure:', error);
    }
  };

  const handleSignConsent = async () => {
    if (!signedBy) return;
    
    try {
      await signConsent(signedBy);
      setOpenSignConsentDialog(false);
      setSignedBy('');
    } catch (error) {
      console.error('Error signing consent:', error);
    }
  };

  const handleApprovePlan = async () => {
    if (!planId) return;
    
    try {
      await approvePlan(planId, note);
      setOpenNoteDialog(false);
      setNote('');
    } catch (error) {
      console.error('Error approving plan:', error);
    }
  };

  const handleCompletePlan = async () => {
    if (!planId) return;
    
    try {
      await completePlan(note);
      setOpenNoteDialog(false);
      setNote('');
    } catch (error) {
      console.error('Error completing plan:', error);
    }
  };

  const handleProcedureStatusChange = async (procedureId: string, newStatus: string) => {
    try {
      await updateProcedureStatus(procedureId, newStatus);
    } catch (error) {
      console.error('Error updating procedure status:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'proposed': return 'info';
      case 'approved': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  // Get phase display name
  const getPhaseDisplay = (phase: string) => {
    switch (phase) {
      case 'urgent': return 'Urgent';
      case 'phase_1': return 'Phase 1';
      case 'phase_2': return 'Phase 2';
      case 'maintenance': return 'Maintenance';
      default: return phase;
    }
  };

  if (isLoading || isLoadingPatient) {
    return <Loading />;
  }

  if (isError || !plan) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading treatment plan. The plan may not exist or you don't have permission to view it.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate(ROUTES.TREATMENT_PLANS)}
        >
          Back to Treatment Plans
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {plan.title || 'Treatment Plan'}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            sx={{ mr: 1 }}
            onClick={() => navigate(`/treatment-plans/${planId}/history`)}
          >
            History
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => window.open(`/api/treatment-plans/${planId}/pdf`, '_blank')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip 
                  label={plan.status} 
                  color={getStatusColor(plan.status) as any} 
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Priority</Typography>
                <Chip 
                  label={plan.priority} 
                  color={getPriorityColor(plan.priority) as any}
                  variant="outlined" 
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Patient</Typography>
                <Typography variant="body1">
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                    {patient ? patient.name : 'Unknown Patient'}
                  </Box>
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Created</Typography>
                <Typography variant="body1">
                  {new Date(plan.created_at).toLocaleDateString()}
                </Typography>
              </Box>

              {plan.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography variant="body2">{plan.description}</Typography>
                </Box>
              )}

              {summary && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">Total Procedures</Typography>
                    <Typography variant="body1">{summary.total_procedures}</Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">Completed</Typography>
                    <Typography variant="body1">
                      {summary.completed_procedures} ({summary.progress_percentage.toFixed(0)}%)
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">Total Fee</Typography>
                    <Typography variant="body1">{formatCurrency(summary.total_treatment_fee)}</Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">Insurance Coverage</Typography>
                    <Typography variant="body1">{formatCurrency(summary.total_insurance_coverage)}</Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">Patient Responsibility</Typography>
                    <Typography variant="body1">{formatCurrency(summary.total_patient_responsibility)}</Typography>
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" flexDirection="column" gap={1}>
                {plan.status === 'draft' && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenNoteDialog(true)}
                  >
                    Approve Plan
                  </Button>
                )}

                {plan.status === 'approved' && !plan.consent_signed && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenSignConsentDialog(true)}
                  >
                    Sign Consent
                  </Button>
                )}

                {plan.status === 'in_progress' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setOpenNoteDialog(true)}
                  >
                    Mark as Complete
                  </Button>
                )}

                <Button
                  variant="outlined"
                  onClick={() => navigate(`/treatment-plans/${planId}/edit`)}
                >
                  Edit Plan
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <Box display="flex" justifyContent="space-between" alignItems="center" px={3} pt={2}>
              <Typography variant="h6">Procedures</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setOpenProcedureDialog(true)}
              >
                Add Procedure
              </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                aria-label="treatment plan tabs"
                centered
              >
                <Tab label="All Procedures" />
                <Tab label="By Phase" />
                <Tab label="Financial" />
              </Tabs>
            </Box>

            {/* All Procedures Tab */}
            <TabPanel value={tabValue} index={0}>
              {plan.procedures.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <Typography variant="body1" color="textSecondary">
                    No procedures added yet. Click "Add Procedure" to get started.
                  </Typography>
                </Box>
              ) : (
                <TableView 
                  procedures={plan.procedures} 
                  onStatusChange={handleProcedureStatusChange} 
                />
              )}
            </TabPanel>

            {/* By Phase Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                {['urgent', 'phase_1', 'phase_2', 'maintenance'].map((phase) => {
                  const phaseProcedures = plan.procedures.filter(p => p.phase === phase);
                  if (phaseProcedures.length === 0) return null;
                  
                  return (
                    <Grid item xs={12} key={phase}>
                      <Typography variant="h6" gutterBottom>
                        {getPhaseDisplay(phase)}
                      </Typography>
                      <TableView 
                        procedures={phaseProcedures} 
                        onStatusChange={handleProcedureStatusChange} 
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </TabPanel>

            {/* Financial Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>Financial Summary</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Total Treatment Fee
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(summary?.total_treatment_fee || 0)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Insurance Coverage
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(summary?.total_insurance_coverage || 0)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Patient Responsibility
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(summary?.total_patient_responsibility || 0)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>Procedure Costs</Typography>
                <Paper>
                  <Box p={2}>
                    {plan.procedures.map((procedure) => (
                      <Box 
                        key={procedure.id} 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center"
                        py={1}
                        borderBottom={1}
                        borderColor="divider"
                      >
                        <Box>
                          <Typography variant="body1">{procedure.procedure_name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {procedure.cdt_code && `${procedure.cdt_code} - `}
                            {procedure.tooth_number && `Tooth #${procedure.tooth_number}`}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body1">{formatCurrency(procedure.fee)}</Typography>
                          {procedure.insurance_coverage && (
                            <Typography variant="body2" color="textSecondary">
                              {procedure.insurance_coverage}% covered
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Box>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>

      {/* Add Procedure Dialog */}
      <Dialog open={openProcedureDialog} onClose={() => setOpenProcedureDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Procedure</DialogTitle>
        <DialogContent>
          <Box py={1}>
            <TextField
              fullWidth
              margin="normal"
              label="Procedure Name"
              required
              value={procedureData.procedureName}
              onChange={(e) => setProcedureData({ ...procedureData, procedureName: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Tooth Number"
                  value={procedureData.toothNumber}
                  onChange={(e) => setProcedureData({ ...procedureData, toothNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="CDT Code"
                  value={procedureData.cdtCode}
                  onChange={(e) => setProcedureData({ ...procedureData, cdtCode: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              margin="normal"
              label="Fee ($)"
              type="number"
              value={procedureData.fee}
              onChange={(e) => setProcedureData({ ...procedureData, fee: parseFloat(e.target.value) })}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Description"
              multiline
              rows={3}
              value={procedureData.description}
              onChange={(e) => setProcedureData({ ...procedureData, description: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="priority-select-label">Priority</InputLabel>
                  <Select
                    labelId="priority-select-label"
                    value={procedureData.priority}
                    label="Priority"
                    onChange={(e) => setProcedureData({ ...procedureData, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="phase-select-label">Phase</InputLabel>
                  <Select
                    labelId="phase-select-label"
                    value={procedureData.phase}
                    label="Phase"
                    onChange={(e) => setProcedureData({ ...procedureData, phase: e.target.value })}
                  >
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="phase_1">Phase 1</MenuItem>
                    <MenuItem value="phase_2">Phase 2</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProcedureDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddProcedure} 
            variant="contained" 
            color="primary"
            disabled={!procedureData.procedureName}
          >
            Add Procedure
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sign Consent Dialog */}
      <Dialog open={openSignConsentDialog} onClose={() => setOpenSignConsentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sign Consent</DialogTitle>
        <DialogContent>
          <Box py={1}>
            <Typography variant="body1" paragraph>
              By signing this consent, you agree to proceed with the treatment plan as described.
            </Typography>
            <TextField
              fullWidth
              margin="normal"
              label="Signed By"
              required
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              placeholder="Patient/Guardian Name"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignConsentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSignConsent} 
            variant="contained" 
            color="primary"
            disabled={!signedBy}
          >
            Sign Consent
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog for Approve/Complete */}
      <Dialog open={openNoteDialog} onClose={() => setOpenNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {plan.status === 'draft' ? 'Approve Treatment Plan' : 'Complete Treatment Plan'}
        </DialogTitle>
        <DialogContent>
          <Box py={1}>
            <TextField
              fullWidth
              margin="normal"
              label="Notes"
              multiline
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNoteDialog(false)}>Cancel</Button>
          <Button 
            onClick={plan.status === 'draft' ? handleApprovePlan : handleCompletePlan} 
            variant="contained" 
            color="primary"
          >
            {plan.status === 'draft' ? 'Approve' : 'Complete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Table component for procedures
const TableView: React.FC<{
  procedures: any[];
  onStatusChange: (id: string, status: string) => void;
}> = ({ procedures, onStatusChange }) => {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Procedure</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Tooth #</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>CDT Code</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Fee</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {procedures.map((procedure) => (
            <tr key={procedure.id}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                <Typography variant="body1">{procedure.procedure_name}</Typography>
                {procedure.description && (
                  <Typography variant="body2" color="textSecondary">
                    {procedure.description}
                  </Typography>
                )}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                {procedure.tooth_number || '—'}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                {procedure.cdt_code || '—'}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(procedure.fee)}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={procedure.status}
                    onChange={(e) => onStatusChange(procedure.id, e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="recommended">Recommended</MenuItem>
                    <MenuItem value="planned">Planned</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                <IconButton size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

export default TreatmentPlanDetailPage; 