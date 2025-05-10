import React, { useEffect, useState } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertTitle, 
  Typography, 
  Box,
  Button,
  IconButton
} from '@mui/material';
import { 
  Warning as WarningIcon,
  Close as CloseIcon,
  Security as SecurityIcon 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { alertService, Alert as AlertType } from '../../services/AlertService';

const SecurityAlertNotification: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [currentAlert, setCurrentAlert] = useState<AlertType | null>(null);
  const [alertQueue, setAlertQueue] = useState<AlertType[]>([]);

  // Start the alert service polling when the component mounts
  useEffect(() => {
    // Subscribe to the alert service for real-time notifications
    const subscription = alertService.alerts$.subscribe(alert => {
      // Only queue high severity alerts for immediate notification
      if (alert.severity === 'high') {
        setAlertQueue(prev => [...prev, alert]);
      }
    });

    // Start polling for high severity alerts
    alertService.startPolling();

    // Clean up on unmount
    return () => {
      subscription.unsubscribe();
      alertService.stopPolling();
    };
  }, []);

  // Process the alert queue when it changes
  useEffect(() => {
    if (alertQueue.length > 0 && !open) {
      // Take the first alert from the queue
      setCurrentAlert(alertQueue[0]);
      setOpen(true);
      // Remove the alert from the queue
      setAlertQueue(prev => prev.slice(1));
    }
  }, [alertQueue, open]);

  // Handle closing the alert
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  // Handle view details action
  const handleViewDetails = () => {
    // Close this alert
    setOpen(false);
    // Navigate to security dashboard handled by the Link component
  };

  // Render nothing if no alert
  if (!currentAlert) {
    return null;
  }

  // Get the appropriate severity for the alert
  const getSeverity = () => {
    switch (currentAlert?.severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Format the alert title
  const formatAlertTitle = () => {
    const alertType = currentAlert?.type?.replace(/_/g, ' ') || '';
    return alertType.charAt(0).toUpperCase() + alertType.slice(1);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={10000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity={getSeverity()}
        icon={<SecurityIcon />}
        action={
          <Box>
            <Button
              color="inherit"
              size="small"
              component={Link}
              to="/admin/security"
              onClick={handleViewDetails}
            >
              View Details
            </Button>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{ width: '100%' }}
      >
        <AlertTitle>{formatAlertTitle()}</AlertTitle>
        <Typography variant="body2">
          {currentAlert?.description}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          {currentAlert?.user_id && `User: ${currentAlert.user_id}`}
          {currentAlert?.user_id && currentAlert?.ip_address && ' | '}
          {currentAlert?.ip_address && `IP: ${currentAlert.ip_address}`}
        </Typography>
      </Alert>
    </Snackbar>
  );
};

export default SecurityAlertNotification; 