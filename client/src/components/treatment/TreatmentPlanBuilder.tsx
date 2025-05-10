import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Typography,
  Button,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

import { treatmentPlanService } from '../../services/TreatmentPlanService';
import { 
  TreatmentPlan,
  TreatmentProcedure,
  PlanPhase,
  PlanStatus
} from '../../types/treatment-plan';
import { ProcedureDialog } from './ProcedureDialog';
import { ProcedureList } from './ProcedureList';
import { PhaseSummary } from './PhaseSummary';
import { PlanActions } from './PlanActions';
import { PlanVersionHistory } from './PlanVersionHistory';
import { PlanFinancialSummary } from './PlanFinancialSummary';

interface TreatmentPlanBuilderProps {
  patientId: string;
  planId?: string;
  onPlanCreated?: (planId: string) => void;
  onPlanUpdated?: (plan: TreatmentPlan) => void;
}

export const TreatmentPlanBuilder: React.FC<TreatmentPlanBuilderProps> = ({
  patientId,
  planId,
  onPlanCreated,
  onPlanUpdated
}) => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<PlanPhase>('phase_1');
  const [tabValue, setTabValue] = useState<number>(0);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState<boolean>(false);
  
  // Load treatment plan
  useEffect(() => {
    if (planId) {
      loadPlan(planId);
    } else {
      setLoading(false);
    }
  }, [planId]);
  
  const loadPlan = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const planData = await treatmentPlanService.getTreatmentPlan(id);
      setPlan(planData);
      
    } catch (err: any) {
      console.error('Error loading treatment plan:', err);
      setError(err.response?.data?.detail || 'Failed to load treatment plan');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newPlan = await treatmentPlanService.createTreatmentPlan({
        patient_id: patientId,
        status: 'draft',
        priority: 'medium'
      });
      
      setPlan(newPlan);
      
      if (onPlanCreated) {
        onPlanCreated(newPlan.id);
      }
    } catch (err: any) {
      console.error('Error creating treatment plan:', err);
      setError(err.response?.data?.detail || 'Failed to create treatment plan');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdatePlan = async (updateData: any) => {
    if (!plan) return;
    
    try {
      const updatedPlan = await treatmentPlanService.updateTreatmentPlan(
        plan.id,
        updateData
      );
      
      setPlan(updatedPlan);
      
      if (onPlanUpdated) {
        onPlanUpdated(updatedPlan);
      }
    } catch (err: any) {
      console.error('Error updating treatment plan:', err);
      setError(err.response?.data?.detail || 'Failed to update treatment plan');
    }
  };
  
  const handleAddProcedure = async (procedureData: any) => {
    if (!plan) return;
    
    try {
      await treatmentPlanService.addProcedure({
        treatment_plan_id: plan.id,
        ...procedureData
      });
      
      // Reload the plan to get updated data
      await loadPlan(plan.id);
      setProcedureDialogOpen(false);
    } catch (err: any) {
      console.error('Error adding procedure:', err);
      setError(err.response?.data?.detail || 'Failed to add procedure');
    }
  };
  
  const handleUpdateProcedure = async (procedureId: string, updateData: any) => {
    try {
      await treatmentPlanService.updateProcedure(procedureId, updateData);
      
      // Reload the plan to get updated data
      if (plan) {
        await loadPlan(plan.id);
      }
    } catch (err: any) {
      console.error('Error updating procedure:', err);
      setError(err.response?.data?.detail || 'Failed to update procedure');
    }
  };
  
  const handleDeleteProcedure = async (procedureId: string) => {
    try {
      await treatmentPlanService.deleteProcedure(procedureId);
      
      // Reload the plan to get updated data
      if (plan) {
        await loadPlan(plan.id);
      }
    } catch (err: any) {
      console.error('Error deleting procedure:', err);
      setError(err.response?.data?.detail || 'Failed to delete procedure');
    }
  };
  
  const handleApprovePlan = async () => {
    if (!plan) return;
    
    try {
      const updatedPlan = await treatmentPlanService.approveTreatmentPlan(plan.id);
      setPlan(updatedPlan);
      
      if (onPlanUpdated) {
        onPlanUpdated(updatedPlan);
      }
    } catch (err: any) {
      console.error('Error approving treatment plan:', err);
      setError(err.response?.data?.detail || 'Failed to approve treatment plan');
    }
  };
  
  const handleSignConsent = async (signedBy: string) => {
    if (!plan) return;
    
    try {
      const updatedPlan = await treatmentPlanService.signConsent(plan.id, signedBy);
      setPlan(updatedPlan);
      
      if (onPlanUpdated) {
        onPlanUpdated(updatedPlan);
      }
    } catch (err: any) {
      console.error('Error signing consent:', err);
      setError(err.response?.data?.detail || 'Failed to sign consent');
    }
  };
  
  const handleCompletePlan = async () => {
    if (!plan) return;
    
    try {
      const updatedPlan = await treatmentPlanService.completeTreatmentPlan(plan.id);
      setPlan(updatedPlan);
      
      if (onPlanUpdated) {
        onPlanUpdated(updatedPlan);
      }
    } catch (err: any) {
      console.error('Error completing treatment plan:', err);
      setError(err.response?.data?.detail || 'Failed to complete treatment plan');
    }
  };
  
  const downloadPdf = () => {
    if (!plan) return;
    
    // Use the PDF URL to trigger download
    window.open(treatmentPlanService.getPlanPdfUrl(plan.id), '_blank');
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  // Show empty state if no plan exists yet
  if (!plan) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <Typography variant="h6" gutterBottom>
              No Treatment Plan
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Create a new treatment plan for this patient
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreatePlan}
            >
              Create Treatment Plan
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  // Determine which procedures to show based on selected phase
  const filteredProcedures = plan.procedures.filter(
    (proc) => proc.phase === selectedPhase
  );
  
  // Get status chip color
  const getStatusColor = (status: PlanStatus) => {
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
  
  return (
    <Card>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center">
            <Typography variant="h6" component="div">
              {plan.title || 'Treatment Plan'}
            </Typography>
            <Chip 
              label={plan.status.toUpperCase().replace('_', ' ')}
              color={getStatusColor(plan.status)} 
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
        }
        action={
          <Box>
            <Tooltip title="Download PDF">
              <IconButton onClick={downloadPdf} size="small" sx={{ mr: 1 }}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setProcedureDialogOpen(true)}
              disabled={['completed', 'cancelled'].includes(plan.status)}
            >
              Add Procedure
            </Button>
          </Box>
        }
      />
      
      <Divider />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Treatment Plan" />
          <Tab label="Financial Summary" />
          <Tab label="Version History" />
        </Tabs>
      </Box>
      
      {/* Tab Panels */}
      <CardContent>
        {/* Treatment Plan Tab */}
        {tabValue === 0 && (
          <>
            {/* Plan Actions */}
            <PlanActions 
              plan={plan}
              onApprove={handleApprovePlan}
              onSignConsent={handleSignConsent}
              onComplete={handleCompletePlan}
              onUpdate={handleUpdatePlan}
            />
            
            {/* Phase Selection */}
            <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <PhaseSummary
                  phase="urgent"
                  count={plan.summary?.procedures_by_phase.urgent || 0}
                  selected={selectedPhase === 'urgent'}
                  onClick={() => setSelectedPhase('urgent')}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <PhaseSummary
                  phase="phase_1"
                  count={plan.summary?.procedures_by_phase.phase_1 || 0}
                  selected={selectedPhase === 'phase_1'}
                  onClick={() => setSelectedPhase('phase_1')}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <PhaseSummary
                  phase="phase_2"
                  count={plan.summary?.procedures_by_phase.phase_2 || 0}
                  selected={selectedPhase === 'phase_2'}
                  onClick={() => setSelectedPhase('phase_2')}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <PhaseSummary
                  phase="maintenance"
                  count={plan.summary?.procedures_by_phase.maintenance || 0}
                  selected={selectedPhase === 'maintenance'}
                  onClick={() => setSelectedPhase('maintenance')}
                />
              </Grid>
            </Grid>
            
            {/* Procedures List */}
            <ProcedureList
              procedures={filteredProcedures}
              planStatus={plan.status}
              onUpdate={handleUpdateProcedure}
              onDelete={handleDeleteProcedure}
            />
          </>
        )}
        
        {/* Financial Summary Tab */}
        {tabValue === 1 && (
          <PlanFinancialSummary plan={plan} />
        )}
        
        {/* Version History Tab */}
        {tabValue === 2 && (
          <PlanVersionHistory planId={plan.id} />
        )}
      </CardContent>
      
      {/* Add Procedure Dialog */}
      <ProcedureDialog
        open={procedureDialogOpen}
        onClose={() => setProcedureDialogOpen(false)}
        onSave={handleAddProcedure}
        initialPhase={selectedPhase}
      />
    </Card>
  );
}; 