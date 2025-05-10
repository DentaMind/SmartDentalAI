import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fetchSystemAlerts } from '../../api/alerts';

interface Alert {
  type: string;
  severity: 'critical' | 'high' | 'warning';
  message: string;
  timestamp: string;
  metadata: Record<string, any>;
}

const severityColors = {
  critical: '#ff1744',
  high: '#ff9100',
  warning: '#ffd600',
};

const severityIcons = {
  critical: <ErrorIcon color="error" />,
  high: <WarningIcon sx={{ color: severityColors.high }} />,
  warning: <WarningIcon sx={{ color: severityColors.warning }} />,
};

export const AlertPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  const fetchAlerts = async () => {
    try {
      const data = await fetchSystemAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleAlert = (index: number) => {
    setExpandedAlerts(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const renderMetadata = (metadata: Record<string, any>) => {
    return Object.entries(metadata).map(([key, value]) => (
      <Typography key={key} variant="body2" color="text.secondary" sx={{ ml: 6, mt: 1 }}>
        {key}: {typeof value === 'number' ? value.toFixed(2) : value}
      </Typography>
    ));
  };

  if (alerts.length === 0) {
    return (
      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SuccessIcon color="success" />
          <Typography>All systems operational</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        System Alerts
      </Typography>
      <List>
        {alerts.map((alert, index) => (
          <ListItem
            key={`${alert.type}-${alert.timestamp}-${index}`}
            sx={{
              mb: 1,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              width="100%"
              onClick={() => toggleAlert(index)}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon>{severityIcons[alert.severity]}</ListItemIcon>
              <ListItemText
                primary={alert.message}
                secondary={format(new Date(alert.timestamp), 'PPp')}
              />
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={alert.type}
                  size="small"
                  sx={{ backgroundColor: '#e3f2fd' }}
                />
                <Chip
                  label={alert.severity}
                  size="small"
                  sx={{
                    backgroundColor: severityColors[alert.severity] + '22',
                    color: severityColors[alert.severity],
                  }}
                />
                <IconButton size="small">
                  {expandedAlerts[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            </Box>
            <Collapse in={expandedAlerts[index]} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 1 }}>{renderMetadata(alert.metadata)}</Box>
            </Collapse>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}; 