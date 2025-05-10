import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Chip,
  Button,
  Link,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as EditIcon,
  AddCircle as AddIcon,
  Delete as DeleteIcon,
  Compare as CompareIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { treatmentPlanService } from '../../services/TreatmentPlanService';
import { PlanVersionInfo, TreatmentPlanHistoryEntry } from '../../types/treatment-plan';

interface PlanVersionHistoryProps {
  planId: string;
}

export const PlanVersionHistory: React.FC<PlanVersionHistoryProps> = ({
  planId
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<PlanVersionInfo[]>([]);
  const [history, setHistory] = useState<TreatmentPlanHistoryEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [versionDetailsOpen, setVersionDetailsOpen] = useState(false);
  
  // Load versions and history on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load versions and history in parallel
        const [versionsData, historyData] = await Promise.all([
          treatmentPlanService.getPlanVersions(planId),
          treatmentPlanService.getPlanHistory(planId)
        ]);
        
        setVersions(versionsData);
        setHistory(historyData);
      } catch (err: any) {
        console.error('Error loading treatment plan history:', err);
        setError(err.response?.data?.detail || 'Failed to load treatment plan history');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [planId]);
  
  // Load version details
  const handleViewVersion = async (version: number) => {
    try {
      setLoading(true);
      const versionData = await treatmentPlanService.getPlanVersion(planId, version);
      setSelectedVersion(versionData);
      setVersionDetailsOpen(true);
    } catch (err: any) {
      console.error('Error loading version details:', err);
      setError(err.response?.data?.detail || 'Failed to load version details');
    } finally {
      setLoading(false);
    }
  };
  
  // Get icon for action type
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <AddIcon color="primary" />;
      case 'updated':
        return <EditIcon color="primary" />;
      case 'status_changed':
        return <CheckCircleIcon color="info" />;
      case 'procedure_added':
        return <AddIcon color="success" />;
      case 'procedure_updated':
        return <EditIcon color="primary" />;
      case 'procedure_deleted':
        return <DeleteIcon color="error" />;
      case 'consent_signed':
        return <CheckCircleIcon color="success" />;
      default:
        return <HistoryIcon color="action" />;
    }
  };
  
  // Format the action for display
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Render version details
  const renderVersionDetails = () => {
    if (!selectedVersion) return null;
    
    return (
      <Dialog
        open={versionDetailsOpen}
        onClose={() => setVersionDetailsOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Version Details
        </DialogTitle>
        <DialogContent dividers>
          {/* Version metadata */}
          <Box mb={2}>
            <Typography variant="subtitle1">
              Version {selectedVersion.version || 'N/A'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Created by {selectedVersion.created_by || 'Unknown'} on {
                selectedVersion.created_at 
                  ? format(new Date(selectedVersion.created_at), 'PPpp') 
                  : 'Unknown date'
              }
            </Typography>
            {selectedVersion.notes && (
              <Typography variant="body2" mt={1}>
                Notes: {selectedVersion.notes}
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Plan details */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Plan Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Title" 
                    secondary={selectedVersion.title || 'Untitled Plan'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Status" 
                    secondary={selectedVersion.status?.toUpperCase() || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Description" 
                    secondary={selectedVersion.description || 'No description'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Notes" 
                    secondary={selectedVersion.notes || 'No notes'} 
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
          
          {/* Procedures */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Procedures</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {selectedVersion.procedures && selectedVersion.procedures.length > 0 ? (
                <List dense>
                  {selectedVersion.procedures.map((proc: any, index: number) => (
                    <React.Fragment key={proc.id || index}>
                      <ListItem>
                        <ListItemText 
                          primary={proc.procedure_name} 
                          secondary={
                            <>
                              {proc.cdt_code && `CDT: ${proc.cdt_code} | `}
                              {proc.tooth_number && `Tooth: ${proc.tooth_number} | `}
                              Status: {proc.status?.toUpperCase() || 'N/A'} | 
                              Fee: ${proc.fee?.toFixed(2) || '0.00'}
                            </>
                          } 
                        />
                      </ListItem>
                      {index < selectedVersion.procedures.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No procedures in this version
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Show loading state
  if (loading && versions.length === 0 && history.length === 0) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error state
  if (error && versions.length === 0 && history.length === 0) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Versions section */}
      <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
        <Typography variant="h6" gutterBottom>
          Plan Versions
        </Typography>
        
        {versions.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No version history available
          </Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            {versions.map((version) => (
              <Box 
                key={version.version} 
                sx={{ 
                  p: 2, 
                  mb: 1, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="subtitle1">
                    Version {version.version}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Created by {version.created_by} on {format(new Date(version.created_at), 'PPp')}
                  </Typography>
                  {version.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {version.notes}
                    </Typography>
                  )}
                </Box>
                
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleViewVersion(version.version)}
                >
                  View Details
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
      
      {/* Audit History section */}
      <Paper sx={{ p: 2 }} variant="outlined">
        <Typography variant="h6" gutterBottom>
          Audit History
        </Typography>
        
        {history.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No audit history available
          </Typography>
        ) : (
          <Timeline position="right">
            {history.map((entry) => (
              <TimelineItem key={entry.id}>
                <TimelineOppositeContent 
                  sx={{ maxWidth: 150 }}
                  color="text.secondary"
                >
                  {format(new Date(entry.action_at), 'PPp')}
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <TimelineDot color="primary">
                    {getActionIcon(entry.action)}
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                
                <TimelineContent sx={{ py: 2, px: 2 }}>
                  <Typography variant="subtitle1" component="span">
                    {formatAction(entry.action)}
                  </Typography>
                  <Typography variant="body2">
                    By {entry.action_by}
                  </Typography>
                  
                  {entry.details && (
                    <Paper sx={{ p: 1, mt: 1, bgcolor: 'background.default' }}>
                      {entry.action === 'procedure_added' && (
                        <Typography variant="body2">
                          Added procedure: {entry.details.procedure_name}
                          {entry.details.tooth_number && ` for tooth ${entry.details.tooth_number}`}
                          {entry.details.cdt_code && ` (${entry.details.cdt_code})`}
                        </Typography>
                      )}
                      
                      {entry.action === 'procedure_deleted' && (
                        <Typography variant="body2">
                          Deleted procedure: {entry.details.procedure_name}
                          {entry.details.tooth_number && ` for tooth ${entry.details.tooth_number}`}
                          {entry.details.cdt_code && ` (${entry.details.cdt_code})`}
                        </Typography>
                      )}
                      
                      {entry.action === 'status_changed' && (
                        <Typography variant="body2">
                          Status changed from {entry.details.old_status?.toUpperCase() || 'N/A'} to {entry.details.new_status?.toUpperCase() || 'N/A'}
                          {entry.details.notes && <Box mt={1}>Notes: {entry.details.notes}</Box>}
                        </Typography>
                      )}
                      
                      {entry.action === 'consent_signed' && (
                        <Typography variant="body2">
                          Status changed from {entry.details.status_change?.old} to {entry.details.status_change?.new}
                        </Typography>
                      )}
                      
                      {entry.action === 'updated' && (
                        <Typography variant="body2">
                          Updated fields: {Object.keys(entry.details).join(', ')}
                        </Typography>
                      )}
                    </Paper>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Paper>
      
      {/* Version details dialog */}
      {renderVersionDetails()}
    </Box>
  );
}; 