import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface DimensionData {
  dimension: string;
  current: number;
  average: number;
  std_dev: number;
  z_score: number;
}

interface AnomalyDetailsProps {
  anomaly: any;
}

const AnomalyDetails: React.FC<AnomalyDetailsProps> = ({ anomaly }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Render different details based on anomaly type
  const renderTypeSpecificDetails = () => {
    switch (anomaly.type) {
      case 'multiple_failed_logins':
      case 'user_multiple_failed_logins':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">First Attempt</Typography>
              <Typography variant="body2">{formatTimestamp(anomaly.first_attempt)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Last Attempt</Typography>
              <Typography variant="body2">{formatTimestamp(anomaly.last_attempt)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Timespan</Typography>
              <Typography variant="body2">{anomaly.timespan_minutes} minutes</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">IP Address</Typography>
              <Typography variant="body2">{anomaly.ip_address || 'N/A'}</Typography>
            </Grid>
          </Grid>
        );

      case 'excessive_patient_access':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Patients Accessed</Typography>
              <Typography variant="body2">{anomaly.count}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Average for Role</Typography>
              <Typography variant="body2">{anomaly.average_for_role}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Standard Deviations</Typography>
              <Typography variant="body2">{anomaly.standard_deviations}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">User Role</Typography>
              <Typography variant="body2">{anomaly.user_role}</Typography>
            </Grid>
          </Grid>
        );

      case 'unusual_hours_access':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Unique Patients</Typography>
              <Typography variant="body2">{anomaly.unique_patients}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">First Access</Typography>
              <Typography variant="body2">{formatTimestamp(anomaly.first_access)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Last Access</Typography>
              <Typography variant="body2">{formatTimestamp(anomaly.last_access)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">User Role</Typography>
              <Typography variant="body2">{anomaly.user_role}</Typography>
            </Grid>
          </Grid>
        );

      case 'behavioral_anomaly':
        return (
          <Box>
            <Typography variant="subtitle2">Anomalous Dimensions: {anomaly.anomalous_dimensions}</Typography>
            <List>
              {anomaly.dimensions?.map((dim: DimensionData, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${dim.dimension.replace(/_/g, ' ')} (${Math.abs(Math.round(dim.z_score * 10) / 10)} std dev)`}
                    secondary={`Current: ${dim.current}, Average: ${Math.round(dim.average * 10) / 10}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 'new_ip_address':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">IP Address</Typography>
              <Typography variant="body2">{anomaly.ip_address}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">First Seen</Typography>
              <Typography variant="body2">{formatTimestamp(anomaly.first_seen)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Last Seen</Typography>
              <Typography variant="body2">{formatTimestamp(anomaly.last_seen)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">PHI Accessed</Typography>
              <Typography variant="body2">{anomaly.accessed_phi ? 'Yes' : 'No'}</Typography>
            </Grid>
          </Grid>
        );

      case 'api_abuse':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">API Path</Typography>
              <Typography variant="body2">{anomaly.path}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Requests</Typography>
              <Typography variant="body2">{anomaly.count}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Rate</Typography>
              <Typography variant="body2">{anomaly.rate_per_minute} req/min</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Duration</Typography>
              <Typography variant="body2">{anomaly.duration_minutes} minutes</Typography>
            </Grid>
          </Grid>
        );

      case 'api_scraping':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Unique Endpoints</Typography>
              <Typography variant="body2">{anomaly.unique_endpoints}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Duration</Typography>
              <Typography variant="body2">{anomaly.duration_minutes} minutes</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">IP Address</Typography>
              <Typography variant="body2">{anomaly.ip_address}</Typography>
            </Grid>
          </Grid>
        );

      default:
        return (
          <Typography variant="body2">
            No detailed information available for this anomaly type.
          </Typography>
        );
    }
  };

  // Get icon based on anomaly type
  const getAnomalyIcon = () => {
    switch (anomaly.type) {
      case 'multiple_failed_logins':
      case 'user_multiple_failed_logins':
        return <FingerprintIcon />;
      case 'excessive_patient_access':
      case 'many_patients_accessed':
        return <PersonIcon />;
      case 'unusual_hours_access':
        return <TimeIcon />;
      case 'behavioral_anomaly':
        return <AssessmentIcon />;
      case 'new_ip_address':
        return <LocationIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const renderSeverityChip = () => {
    let color: "error" | "warning" | "info" | "success" = "info";
    
    switch (anomaly.severity) {
      case 'high':
        color = "error";
        break;
      case 'medium':
        color = "warning";
        break;
      case 'low':
        color = "info";
        break;
      default:
        color = "info";
    }
    
    return (
      <Chip
        label={anomaly.severity.toUpperCase()}
        color={color}
        size="small"
        sx={{ mr: 1 }}
      />
    );
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center">
            <Box sx={{ mr: 2 }}>
              {getAnomalyIcon()}
            </Box>
            <Box>
              <Typography variant="h6">
                {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Typography>
              <Box display="flex" alignItems="center" mt={0.5}>
                {renderSeverityChip()}
                <Typography variant="body2" color="textSecondary">
                  {anomaly.user_id && `User: ${anomaly.user_id}`}
                  {anomaly.ip_address && anomaly.user_id && ' | '}
                  {anomaly.ip_address && `IP: ${anomaly.ip_address}`}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton onClick={handleExpandClick}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Typography variant="body1" paragraph>
          {anomaly.description}
        </Typography>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Paper variant="outlined" sx={{ p: 2 }}>
            {renderTypeSpecificDetails()}
          </Paper>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AnomalyDetails; 