import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { usePatients } from '../hooks/usePatients';
import { treatmentPlanApi } from '../api/treatmentPlan';
import { ROUTES } from '../config/constants';
import Loading from '../components/ui/Loading';

const TreatmentPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, isLoading: isLoadingPatients } = usePatients();
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newPlanData, setNewPlanData] = useState({
    patientId: '',
    title: '',
    description: '',
    priority: 'medium',
  });

  // Fetch treatment plans for all patients
  const fetchTreatmentPlans = async () => {
    setIsLoading(true);
    try {
      const allPlans = [];
      for (const patient of patients) {
        const plans = await treatmentPlanApi.getPatientTreatmentPlans(patient.id);
        allPlans.push(...plans);
      }
      setTreatmentPlans(allPlans);
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patients.length > 0) {
      fetchTreatmentPlans();
    }
  }, [patients]);

  const handleCreatePlan = async () => {
    setIsLoading(true);
    try {
      const newPlan = await treatmentPlanApi.createTreatmentPlan({
        patient_id: newPlanData.patientId,
        title: newPlanData.title,
        description: newPlanData.description || undefined,
        priority: newPlanData.priority as any,
        created_by: 'current-user-id', // This should come from auth context
      });
      
      setOpenCreateDialog(false);
      navigate(ROUTES.TREATMENT_PLAN_DETAIL(newPlan.id));
    } catch (error) {
      console.error('Error creating treatment plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get patient name by ID
  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Unknown Patient';
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

  if (isLoadingPatients) {
    return <Loading />;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Treatment Plans</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Create Treatment Plan
        </Button>
      </Box>

      <Card>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : (
            <>
              {treatmentPlans.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="textSecondary">
                    No treatment plans found. Create your first treatment plan to get started.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Created Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {treatmentPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell>{plan.id.substring(0, 8)}...</TableCell>
                          <TableCell>{getPatientName(plan.patient_id)}</TableCell>
                          <TableCell>{plan.title || 'Untitled Plan'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={plan.status} 
                              color={getStatusColor(plan.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={plan.priority} 
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(plan.created_at)}</TableCell>
                          <TableCell>
                            <IconButton 
                              onClick={() => navigate(ROUTES.TREATMENT_PLAN_DETAIL(plan.id))}
                              size="small"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              onClick={() => navigate(`/treatment-plans/${plan.id}/edit`)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Treatment Plan Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Treatment Plan</DialogTitle>
        <DialogContent>
          <Box py={1}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="patient-select-label">Patient</InputLabel>
              <Select
                labelId="patient-select-label"
                value={newPlanData.patientId}
                label="Patient"
                onChange={(e) => setNewPlanData({ ...newPlanData, patientId: e.target.value })}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Title"
              value={newPlanData.title}
              onChange={(e) => setNewPlanData({ ...newPlanData, title: e.target.value })}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Description"
              multiline
              rows={3}
              value={newPlanData.description}
              onChange={(e) => setNewPlanData({ ...newPlanData, description: e.target.value })}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="priority-select-label">Priority</InputLabel>
              <Select
                labelId="priority-select-label"
                value={newPlanData.priority}
                label="Priority"
                onChange={(e) => setNewPlanData({ ...newPlanData, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreatePlan} 
            variant="contained" 
            color="primary"
            disabled={!newPlanData.patientId}
          >
            Create Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TreatmentPlansPage; 