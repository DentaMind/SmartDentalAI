import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowUpward as ArrowUpwardIcon,
  PersonAdd as PersonAddIcon,
  ErrorOutline as ErrorOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import {
  SecurityAlert,
  AlertStatus,
  securityAlertService,
  AlertUpdateParams
} from '../../services/SecurityAlertService';
import { format } from 'date-fns';

interface SecurityAlertDetailProps {
  alert: SecurityAlert;
  onAlertUpdated?: (updatedAlert: SecurityAlert) => void;
}

const SecurityAlertDetail: React.FC<SecurityAlertDetailProps> = ({ alert, onAlertUpdated }) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<AlertStatus>(alert.status);
  const [assignee, setAssignee] = useState<string>(alert.assigned_to || '');
  const [notes, setNotes] = useState<string>(alert.resolution_notes || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  // Format the timestamp
  const formattedTime = alert.timestamp 
    ? format(new Date(alert.timestamp), 'MMM d, yyyy h:mm a')
    : 'Unknown';

  // Helper to get status color
  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case AlertStatus.OPEN:
        return 'error';
      case AlertStatus.ACKNOWLEDGED:
        return 'info';
      case AlertStatus.RESOLVED:
        return 'success';
      case AlertStatus.FALSE_POSITIVE:
        return 'default';
      case AlertStatus.ESCALATED:
        return 'warning';
      default:
        return 'default';
    }
  };

  // Helper to get severity color
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Handle opening the update dialog
  const handleOpenUpdateDialog = () => {
    setUpdateStatus(alert.status);
    setAssignee(alert.assigned_to || '');
    setNotes(alert.resolution_notes || '');
    setUpdateDialogOpen(true);
  };

  // Handle closing the update dialog
  const handleCloseUpdateDialog = () => {
    setUpdateDialogOpen(false);
    setError(null);
  };

  // Handle updating the alert
  const handleUpdateAlert = async () => {
    setLoading(true);
    setError(null);

    try {
      const updateData: AlertUpdateParams = {
        status: updateStatus,
      };

      if (assignee) {
        updateData.assigned_to = assignee;
      }

      if (notes) {
        updateData.resolution_notes = notes;
      }

      const updatedAlert = await securityAlertService.updateAlertStatus(
        alert.alert_id,
        updateData
      );

      // Close the dialog
      setUpdateDialogOpen(false);

      // Notify parent component
      if (onAlertUpdated) {
        onAlertUpdated(updatedAlert);
      }
    } catch (err: any) {
      console.error('Error updating alert:', err);
      setError(err.message || 'Failed to update alert');
    } finally {
      setLoading(false);
    }
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Quick action buttons for common status changes
  const getQuickActionButtons = () => {
    const actions = [];

    // For open alerts, add acknowledge button
    if (alert.status === AlertStatus.OPEN) {
      actions.push(
        <Tooltip title="Acknowledge Alert" key="acknowledge">
          <Button
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => {
              setUpdateStatus(AlertStatus.ACKNOWLEDGED);
              setUpdateDialogOpen(true);
            }}
            sx={{ mr: 1 }}
          >
            Acknowledge
          </Button>
        </Tooltip>
      );
    }

    // For acknowledged alerts, add resolve and false positive buttons
    if (alert.status === AlertStatus.ACKNOWLEDGED) {
      actions.push(
        <Tooltip title="Mark as Resolved" key="resolve">
          <Button
            size="small"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => {
              setUpdateStatus(AlertStatus.RESOLVED);
              setUpdateDialogOpen(true);
            }}
            sx={{ mr: 1 }}
          >
            Resolve
          </Button>
        </Tooltip>
      );

      actions.push(
        <Tooltip title="Mark as False Positive" key="false-positive">
          <Button
            size="small"
            color="inherit"
            startIcon={<CancelIcon />}
            onClick={() => {
              setUpdateStatus(AlertStatus.FALSE_POSITIVE);
              setUpdateDialogOpen(true);
            }}
            sx={{ mr: 1 }}
          >
            False Positive
          </Button>
        </Tooltip>
      );
    }

    // For any status, provide escalate option if not already escalated
    if (alert.status !== AlertStatus.ESCALATED) {
      actions.push(
        <Tooltip title="Escalate Alert" key="escalate">
          <Button
            size="small"
            color="warning"
            startIcon={<ArrowUpwardIcon />}
            onClick={() => {
              setUpdateStatus(AlertStatus.ESCALATED);
              setUpdateDialogOpen(true);
            }}
            sx={{ mr: 1 }}
          >
            Escalate
          </Button>
        </Tooltip>
      );
    }

    // Always provide assign option
    actions.push(
      <Tooltip title="Assign Alert" key="assign">
        <Button
          size="small"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenUpdateDialog}
        >
          Assign
        </Button>
      </Tooltip>
    );

    return actions;
  };

  return (
    <Card sx={{ mb: 2, borderLeft: 6, borderColor: `${getSeverityColor()}.main` }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <Typography variant="h6" component="div" sx={{ mr: 2 }}>
              {alert.alert_type.replace(/_/g, ' ')}
            </Typography>
            <Chip
              label={alert.severity}
              color={getSeverityColor()}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip
              label={alert.status}
              color={getStatusColor(alert.status)}
              size="small"
            />
          </Box>
        }
        subheader={
          <Box display="flex" flexDirection="column" mt={1}>
            <Typography variant="body2" color="text.secondary">
              {formattedTime} • {alert.category}
            </Typography>
            {alert.user_id && (
              <Typography variant="body2" color="text.secondary">
                User: {alert.user_id}
              </Typography>
            )}
          </Box>
        }
        action={
          <IconButton onClick={toggleExpanded} aria-expanded={expanded}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          <Typography variant="body2" paragraph>
            {alert.description}
          </Typography>

          <Grid container spacing={2}>
            {alert.ip_address && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>IP Address:</strong> {alert.ip_address}
                </Typography>
              </Grid>
            )}
            
            {alert.patient_id && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Patient ID:</strong> {alert.patient_id}
                </Typography>
              </Grid>
            )}
            
            {alert.resource_path && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Resource:</strong> {alert.resource_path}
                </Typography>
              </Grid>
            )}
            
            {alert.assigned_to && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Assigned to:</strong> {alert.assigned_to}
                </Typography>
              </Grid>
            )}
            
            {alert.count > 1 && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Occurrence count:</strong> {alert.count}
                </Typography>
              </Grid>
            )}
          </Grid>

          {alert.resolution_notes && (
            <Box mt={2}>
              <Typography variant="subtitle2">Resolution Notes:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {alert.resolution_notes}
              </Typography>
            </Box>
          )}

          {alert.details && (
            <Box mt={2}>
              <Typography variant="subtitle2">Additional Details:</Typography>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.85rem',
                  maxHeight: '200px'
                }}
              >
                {JSON.stringify(alert.details, null, 2)}
              </Box>
            </Box>
          )}

          <Box mt={3} display="flex" justifyContent="flex-end">
            {getQuickActionButtons()}
          </Box>
        </CardContent>
      </Collapse>

      {!expanded && (
        <CardContent>
          <Typography variant="body2" noWrap>
            {alert.description}
          </Typography>
          
          <Box mt={2} display="flex" justifyContent="flex-end">
            {getQuickActionButtons()}
          </Box>
        </CardContent>
      )}

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Security Alert
          <Typography variant="subtitle2" color="text.secondary">
            {alert.alert_id}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value as AlertStatus)}
              label="Status"
            >
              <MenuItem value={AlertStatus.OPEN}>Open</MenuItem>
              <MenuItem value={AlertStatus.ACKNOWLEDGED}>Acknowledged</MenuItem>
              <MenuItem value={AlertStatus.RESOLVED}>Resolved</MenuItem>
              <MenuItem value={AlertStatus.FALSE_POSITIVE}>False Positive</MenuItem>
              <MenuItem value={AlertStatus.ESCALATED}>Escalated</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label="Assign to"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            helperText="Enter user ID to assign this alert to"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={4}
            helperText="Add resolution notes or investigation details"
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseUpdateDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateAlert}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SecurityAlertDetail; 