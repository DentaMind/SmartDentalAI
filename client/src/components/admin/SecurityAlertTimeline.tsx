import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SecurityAlert, AlertStatus } from '../../services/SecurityAlertService';

interface SecurityAlertTimelineProps {
  alerts: SecurityAlert[];
}

const SecurityAlertTimeline: React.FC<SecurityAlertTimelineProps> = ({ alerts }) => {
  // Sort alerts by timestamp, newest first
  const sortedAlerts = [...alerts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Format the timestamp
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };

  // Get icon and color for alert status
  const getStatusIconAndColor = (alert: SecurityAlert) => {
    switch (alert.status) {
      case AlertStatus.RESOLVED:
        return { icon: <CheckCircleIcon />, color: 'success.main' };
      case AlertStatus.ACKNOWLEDGED:
        return { icon: <SecurityIcon />, color: 'info.main' };
      case AlertStatus.ESCALATED:
        return { icon: <ArrowUpwardIcon />, color: 'warning.main' };
      case AlertStatus.FALSE_POSITIVE:
        return { icon: <CancelIcon />, color: 'text.secondary' };
      case AlertStatus.OPEN:
      default:
        return { icon: <ErrorIcon />, color: 'error.main' };
    }
  };

  // Get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error.dark';
      case 'high':
        return 'error.main';
      case 'medium':
        return 'warning.main';
      case 'low':
        return 'info.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Security Event Timeline
      </Typography>
      
      <Timeline position="alternate" sx={{ p: 0 }}>
        {sortedAlerts.map((alert) => {
          const { icon, color } = getStatusIconAndColor(alert);
          
          return (
            <TimelineItem key={alert.alert_id}>
              <TimelineOppositeContent color="text.secondary">
                {formatTime(alert.timestamp)}
              </TimelineOppositeContent>
              
              <TimelineSeparator>
                <TimelineDot sx={{ bgcolor: color }}>
                  {icon}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              
              <TimelineContent>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    boxShadow: 1,
                    borderLeft: 3,
                    borderColor: getSeverityColor(alert.severity)
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    component="div" 
                    color={getSeverityColor(alert.severity)}
                  >
                    {alert.alert_type.replace(/_/g, ' ')}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {alert.description}
                  </Typography>
                  
                  {alert.user_id && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      User: {alert.user_id}
                    </Typography>
                  )}
                  
                  {alert.ip_address && (
                    <Typography variant="caption" display="block">
                      IP: {alert.ip_address}
                    </Typography>
                  )}
                  
                  {alert.acknowledged_at && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Acknowledged: {formatTime(alert.acknowledged_at)}
                      {alert.acknowledged_by && ` by ${alert.acknowledged_by}`}
                    </Typography>
                  )}
                  
                  {alert.resolution_time && (
                    <Typography variant="caption" display="block">
                      Resolved: {formatTime(alert.resolution_time)}
                      {alert.resolved_by && ` by ${alert.resolved_by}`}
                    </Typography>
                  )}
                </Box>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
      
      {sortedAlerts.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No security events found
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SecurityAlertTimeline; 