import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  AssignmentTurnedIn as ConsentIcon,
  Done as CompleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { TreatmentPlan, PlanStatus } from '../../types/treatment-plan';

interface PlanActionsProps {
  plan: TreatmentPlan;
  onApprove: () => void;
  onSignConsent: (signedBy: string) => void;
  onComplete: () => void;
  onUpdate: (updateData: any) => void;
}

export const PlanActions: React.FC<PlanActionsProps> = ({
  plan,
  onApprove,
  onSignConsent,
  onComplete,
  onUpdate
}) => {
  // State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: plan.title || '',
    description: plan.description || '',
    notes: plan.notes || ''
  });
  
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [signedBy, setSignedBy] = useState('');
  
  // Get action availability based on status
  const canApprove = ['draft', 'proposed'].includes(plan.status);
  const canSignConsent = plan.status === 'approved' && !plan.consent_signed;
  const canComplete = plan.status === 'in_progress';
  const canEdit = !['completed', 'cancelled'].includes(plan.status);
  
  // Handle edit dialog
  const handleOpenEditDialog = () => {
    setEditData({
      title: plan.title || '',
      description: plan.description || '',
      notes: plan.notes || ''
    });
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };
  
  const handleSaveEdit = () => {
    onUpdate(editData);
    setEditDialogOpen(false);
  };
  
  // Handle consent dialog
  const handleOpenConsentDialog = () => {
    setSignedBy('');
    setConsentDialogOpen(true);
  };
  
  const handleCloseConsentDialog = () => {
    setConsentDialogOpen(false);
  };
  
  const handleSubmitConsent = () => {
    if (signedBy.trim()) {
      onSignConsent(signedBy);
      setConsentDialogOpen(false);
    }
  };
  
  // Handle edit input changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Get status warnings
  const getPlanWarning = () => {
    if (plan.status === 'draft') {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          This treatment plan is in draft status and needs to be approved before proceeding.
        </Alert>
      );
    }
    
    if (plan.status === 'approved' && !plan.consent_signed) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This treatment plan is approved but requires patient consent before proceeding.
        </Alert>
      );
    }
    
    return null;
  };
  
  // Get action buttons based on status
  const getActionButton = () => {
    if (canApprove) {
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<ApproveIcon />}
          onClick={onApprove}
        >
          Approve Plan
        </Button>
      );
    }
    
    if (canSignConsent) {
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<ConsentIcon />}
          onClick={handleOpenConsentDialog}
        >
          Sign Consent
        </Button>
      );
    }
    
    if (canComplete) {
      return (
        <Button
          variant="contained"
          color="success"
          startIcon={<CompleteIcon />}
          onClick={onComplete}
        >
          Complete Plan
        </Button>
      );
    }
    
    return null;
  };
  
  return (
    <>
      {/* Warnings & Status Info */}
      {getPlanWarning()}
      
      {/* Action Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }} variant="outlined">
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Typography variant="subtitle1">
                  {plan.title || 'Treatment Plan'}
                </Typography>
                {plan.description && (
                  <Typography variant="body2" color="textSecondary">
                    {plan.description}
                  </Typography>
                )}
              </Grid>
              
              <Grid item>
                <Chip
                  label={plan.status.replace('_', ' ').toUpperCase()}
                  color={
                    plan.status === 'completed' ? 'success' :
                    plan.status === 'cancelled' ? 'error' :
                    plan.status === 'in_progress' ? 'warning' :
                    plan.status === 'approved' ? 'primary' :
                    'default'
                  }
                />
              </Grid>
              
              {plan.consent_signed && (
                <Grid item>
                  <Chip
                    label="Consent Signed"
                    color="info"
                    icon={<ConsentIcon />}
                    size="small"
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box display="flex" gap={1} height="100%" alignItems="center" justifyContent="flex-end">
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
              >
                Edit Details
              </Button>
            )}
            
            {getActionButton()}
          </Box>
        </Grid>
      </Grid>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Treatment Plan</DialogTitle>
        <DialogContent>
          <Box py={1}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={editData.title}
              onChange={handleEditChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              margin="normal"
              multiline
              rows={2}
            />
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={editData.notes}
              onChange={handleEditChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            color="primary"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Consent Dialog */}
      <Dialog open={consentDialogOpen} onClose={handleCloseConsentDialog} fullWidth maxWidth="sm">
        <DialogTitle>Sign Treatment Plan Consent</DialogTitle>
        <DialogContent>
          <Box py={1}>
            <Alert severity="info" sx={{ mb: 2 }}>
              By signing this consent form, the patient acknowledges they understand and agree to proceed with the recommended treatment.
            </Alert>
            
            <TextField
              fullWidth
              label="Signed By"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              margin="normal"
              placeholder="Patient name"
              required
              error={!signedBy.trim()}
              helperText={!signedBy.trim() ? "Signature is required" : ""}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConsentDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitConsent} 
            variant="contained" 
            color="primary"
            disabled={!signedBy.trim()}
          >
            Sign Consent
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 