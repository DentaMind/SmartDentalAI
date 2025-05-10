import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Done as DoneIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';

import { TreatmentProcedure, ProcedureStatus, PlanStatus } from '../../types/treatment-plan';

interface ProcedureListProps {
  procedures: TreatmentProcedure[];
  planStatus: PlanStatus;
  onUpdate: (procedureId: string, updateData: any) => void;
  onDelete: (procedureId: string) => void;
}

export const ProcedureList: React.FC<ProcedureListProps> = ({
  procedures,
  planStatus,
  onUpdate,
  onDelete
}) => {
  // State
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<TreatmentProcedure | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ProcedureStatus | null>(null);
  
  // Open action menu
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, procedure: TreatmentProcedure) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedProcedure(procedure);
  };
  
  // Close action menu
  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
  };
  
  // Status update dialog
  const openStatusUpdate = (status: ProcedureStatus) => {
    setSelectedStatus(status);
    setStatusNote('');
    setStatusUpdateOpen(true);
    handleActionMenuClose();
  };
  
  // Confirm delete dialog
  const openConfirmDelete = () => {
    setConfirmDeleteOpen(true);
    handleActionMenuClose();
  };
  
  // Confirm status update
  const handleStatusUpdate = () => {
    if (selectedProcedure && selectedStatus) {
      onUpdate(selectedProcedure.id, {
        status: selectedStatus,
        notes: statusNote ? `${selectedProcedure.notes || ''}\n${new Date().toLocaleString()}: ${statusNote}` : undefined
      });
      setStatusUpdateOpen(false);
      setSelectedStatus(null);
    }
  };
  
  // Confirm procedure delete
  const handleConfirmDelete = () => {
    if (selectedProcedure) {
      onDelete(selectedProcedure.id);
      setConfirmDeleteOpen(false);
    }
  };
  
  // Get chip color based on status
  const getStatusColor = (status: ProcedureStatus) => {
    switch (status) {
      case 'recommended': return 'default';
      case 'planned': return 'primary';
      case 'scheduled': return 'info';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };
  
  // Check if there are no procedures
  if (procedures.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No procedures in this phase. Add procedures using the 'Add Procedure' button.
      </Alert>
    );
  }
  
  // Check if actions are allowed (based on plan status)
  const actionsAllowed = !['completed', 'cancelled'].includes(planStatus);
  
  return (
    <>
      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tooth #</TableCell>
              <TableCell>Procedure</TableCell>
              <TableCell>CDT Code</TableCell>
              <TableCell>Phase</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Fee</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {procedures.map((procedure) => (
              <TableRow key={procedure.id}>
                <TableCell>{procedure.tooth_number || '-'}</TableCell>
                <TableCell>
                  <Typography variant="body2">{procedure.procedure_name}</Typography>
                  {procedure.description && (
                    <Typography variant="caption" color="textSecondary">
                      {procedure.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{procedure.cdt_code || '-'}</TableCell>
                <TableCell>
                  {procedure.phase.replace('_', ' ').toUpperCase()}
                </TableCell>
                <TableCell>
                  <Chip 
                    size="small"
                    label={procedure.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(procedure.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  ${procedure.fee.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  {actionsAllowed && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionMenuOpen(e, procedure)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionMenuClose}
      >
        {/* Status Update Options */}
        <MenuItem 
          disabled={selectedProcedure?.status === 'planned'} 
          onClick={() => openStatusUpdate('planned')}
        >
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Planned</ListItemText>
        </MenuItem>
        
        <MenuItem 
          disabled={selectedProcedure?.status === 'scheduled'} 
          onClick={() => openStatusUpdate('scheduled')}
        >
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Scheduled</ListItemText>
        </MenuItem>
        
        <MenuItem 
          disabled={selectedProcedure?.status === 'in_progress'} 
          onClick={() => openStatusUpdate('in_progress')}
        >
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as In Progress</ListItemText>
        </MenuItem>
        
        <MenuItem 
          disabled={selectedProcedure?.status === 'completed'} 
          onClick={() => openStatusUpdate('completed')}
        >
          <ListItemIcon>
            <DoneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Completed</ListItemText>
        </MenuItem>
        
        <MenuItem 
          disabled={selectedProcedure?.status === 'cancelled'} 
          onClick={() => openStatusUpdate('cancelled')}
        >
          <ListItemIcon>
            <CancelIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Cancelled</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={openConfirmDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Procedure</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onClose={() => setStatusUpdateOpen(false)}>
        <DialogTitle>
          Update Procedure Status
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Changing status to: {selectedStatus?.replace('_', ' ').toUpperCase()}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Add any additional information about this status change"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained" color="primary">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the procedure: {selectedProcedure?.procedure_name}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 