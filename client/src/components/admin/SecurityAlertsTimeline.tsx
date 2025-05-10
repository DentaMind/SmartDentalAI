import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  ButtonBase,
  useTheme,
  Popover,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  SecurityAlert,
  AlertSeverity,
  AlertStatus
} from '../../services/SecurityAlertService';
import SecurityAlertDetail from './SecurityAlertDetail';

interface DayColumn {
  date: Date;
  alerts: SecurityAlert[];
}

interface SecurityAlertsTimelineProps {
  alerts: SecurityAlert[];
  loading: boolean;
  error: string | null;
  onAlertUpdated?: (updatedAlert: SecurityAlert) => void;
}

const SecurityAlertsTimeline: React.FC<SecurityAlertsTimelineProps> = ({
  alerts,
  loading,
  error,
  onAlertUpdated
}) => {
  const theme = useTheme();
  const [timelineData, setTimelineData] = useState<DayColumn[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [alertDetailOpen, setAlertDetailOpen] = useState<boolean>(false);
  const [hoveredAlert, setHoveredAlert] = useState<SecurityAlert | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Group alerts by day when alerts change
  useEffect(() => {
    if (alerts.length === 0) {
      setTimelineData([]);
      return;
    }

    // Create a map of dates to alerts
    const dateMap = new Map<string, SecurityAlert[]>();
    
    // Sort alerts by timestamp (newest first)
    const sortedAlerts = [...alerts].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Add alerts to date map
    sortedAlerts.forEach(alert => {
      const date = new Date(alert.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      
      dateMap.get(dateKey)!.push(alert);
    });

    // Convert map to array of day columns
    const days: DayColumn[] = [];
    dateMap.forEach((alertsForDay, dateKey) => {
      days.push({
        date: new Date(dateKey),
        alerts: alertsForDay
      });
    });

    // Sort days by date (newest first)
    days.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Limit to last 14 days for better visualization
    const last14Days = days.slice(0, 14);
    setTimelineData(last14Days);
  }, [alerts]);

  // Get color based on severity
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return theme.palette.error.main;
      case AlertSeverity.HIGH:
        return theme.palette.error.light;
      case AlertSeverity.MEDIUM:
        return theme.palette.warning.main;
      case AlertSeverity.LOW:
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Get color based on status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case AlertStatus.OPEN:
        return theme.palette.error.main;
      case AlertStatus.ACKNOWLEDGED:
        return theme.palette.warning.main;
      case AlertStatus.RESOLVED:
        return theme.palette.success.main;
      case AlertStatus.FALSE_POSITIVE:
        return theme.palette.info.main;
      case AlertStatus.ESCALATED:
        return theme.palette.error.dark;
      default:
        return theme.palette.grey[500];
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle alert click
  const handleAlertClick = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setAlertDetailOpen(true);
  };

  // Handle alert hover
  const handleAlertHover = (
    event: React.MouseEvent<HTMLDivElement>,
    alert: SecurityAlert
  ) => {
    setHoveredAlert(alert);
    setAnchorEl(event.currentTarget);
  };

  // Handle alert updated
  const handleAlertUpdated = (updatedAlert: SecurityAlert) => {
    if (onAlertUpdated) {
      onAlertUpdated(updatedAlert);
    }
    setAlertDetailOpen(false);
  };

  // Close alert detail dialog
  const handleCloseAlertDetail = () => {
    setAlertDetailOpen(false);
  };

  // Close hover popover
  const handleClosePopover = () => {
    setHoveredAlert(null);
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (timelineData.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No security alerts found for the timeline view.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Security Alerts Timeline (Last 14 Days)
      </Typography>
      
      <Box 
        sx={{ 
          display: 'flex',
          padding: 2,
          minWidth: timelineData.length * 150,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          mt: 2
        }}
      >
        {timelineData.map((day, index) => (
          <Box 
            key={day.date.toISOString()} 
            sx={{ 
              width: 150,
              minWidth: 150,
              borderRight: index < timelineData.length - 1 ? `1px dashed ${theme.palette.divider}` : 'none',
              px: 1
            }}
          >
            <Typography 
              variant="subtitle2" 
              align="center" 
              sx={{ 
                pb: 1, 
                borderBottom: `1px solid ${theme.palette.divider}`, 
                mb: 1 
              }}
            >
              {formatDate(day.date)}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {day.alerts.map((alert) => (
                <ButtonBase 
                  key={alert.alert_id}
                  onClick={() => handleAlertClick(alert)}
                  onMouseEnter={(e) => handleAlertHover(e, alert)}
                  onMouseLeave={handleClosePopover}
                  sx={{ 
                    display: 'block', 
                    width: '100%', 
                    textAlign: 'left',
                    borderRadius: 1,
                    p: 0.5,
                    mb: 0.5,
                    border: '1px solid',
                    borderColor: getStatusColor(alert.status),
                    bgcolor: `${getSeverityColor(alert.severity)}22`, // Add transparency
                    '&:hover': {
                      bgcolor: `${getSeverityColor(alert.severity)}44` // More opaque on hover
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="caption" noWrap>
                      {new Date(alert.timestamp).toLocaleTimeString(undefined, { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                    <Chip
                      label={alert.severity}
                      size="small"
                      sx={{ 
                        height: 18, 
                        fontSize: '0.6rem',
                        bgcolor: getSeverityColor(alert.severity),
                        color: '#fff'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                    {alert.alert_type.replace(/_/g, ' ')}
                  </Typography>
                </ButtonBase>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Alert hover popover */}
      <Popover
        open={Boolean(anchorEl) && Boolean(hoveredAlert)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ mt: 1 }}
      >
        {hoveredAlert && (
          <Card sx={{ maxWidth: 320, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, pb: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {hoveredAlert.alert_type.replace(/_/g, ' ')}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                {hoveredAlert.description.substring(0, 100)}
                {hoveredAlert.description.length > 100 ? '...' : ''}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={hoveredAlert.status.replace(/_/g, ' ')} 
                  size="small"
                  sx={{ 
                    bgcolor: getStatusColor(hoveredAlert.status),
                    color: '#fff'
                  }}
                />
                <Typography variant="caption">
                  {new Date(hoveredAlert.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Popover>

      {/* Alert detail dialog */}
      <Dialog
        open={alertDetailOpen}
        onClose={handleCloseAlertDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Security Alert Details</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <SecurityAlertDetail 
              alert={selectedAlert} 
              onAlertUpdated={handleAlertUpdated}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAlertDetail}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityAlertsTimeline; 