import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  ErrorOutline as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import AIDiagnosticsService from '../../services/aiDiagnosticsService';

// Types for training status data
interface TrainingJobInfo {
  id: string;
  status: string;
  created_at: string;
  triggered_by: string;
}

interface RecentJobInfo {
  id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  feedback_count: number;
}

interface TrainingStatusData {
  model_name: string;
  model_version: string;
  last_trained: string | null;
  active_jobs: TrainingJobInfo[];
  recent_jobs: RecentJobInfo[];
  metrics: {
    accuracy: number | null;
    total_samples: number;
  };
  new_feedback_count: number;
  feedback_by_type: Record<string, number>;
  retraining_recommended: boolean;
  reason?: string;
}

const ModelTrainingMetrics: React.FC<{
  modelName: string;
  modelVersion?: string;
}> = ({ modelName, modelVersion }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatusData | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [trainingReason, setTrainingReason] = useState('');
  
  const aiDiagnosticsService = AIDiagnosticsService.getInstance();
  
  const fetchTrainingStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const versionParam = modelVersion ? `&model_version=${modelVersion}` : '';
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/diagnostics/training/status?model_name=${modelName}${versionParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch training status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTrainingStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTrainingStatus();
    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchTrainingStatus, 30000);
    return () => clearInterval(intervalId);
  }, [modelName, modelVersion]);
  
  const handleRefresh = () => {
    fetchTrainingStatus();
  };
  
  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };
  
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleStartTraining = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/diagnostics/training/trigger`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_name: modelName,
            model_version: modelVersion || trainingStatus?.model_version,
            reason: trainingReason || 'Manual trigger by administrator'
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to trigger training: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh status after successful trigger
        fetchTrainingStatus();
      } else {
        throw new Error(result.message);
      }
      
      setConfirmDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  
  if (loading && !trainingStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !trainingStatus) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Training Status: {modelName} {modelVersion && `(${modelVersion})`}
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Updating...</Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {trainingStatus && (
        <Grid container spacing={3}>
          {/* Summary Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Model Summary</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Last Trained</Typography>
                    <Typography variant="body1">{formatDate(trainingStatus.last_trained)}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Accuracy</Typography>
                    <Typography variant="body1">
                      {trainingStatus.metrics.accuracy !== null 
                        ? `${(trainingStatus.metrics.accuracy * 100).toFixed(1)}%` 
                        : 'Unknown'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Training Samples</Typography>
                    <Typography variant="body1">{trainingStatus.metrics.total_samples}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">New Feedback</Typography>
                    <Typography variant="body1">
                      {trainingStatus.new_feedback_count}
                      {trainingStatus.new_feedback_count > 50 && (
                        <Chip 
                          label="Sufficient" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Typography>
                  </Grid>
                </Grid>
                
                {trainingStatus.retraining_recommended && (
                  <Alert 
                    severity="warning" 
                    sx={{ mt: 2 }}
                    action={
                      <Button 
                        color="inherit" 
                        size="small"
                        onClick={handleOpenConfirmDialog}
                        disabled={trainingStatus.active_jobs.length > 0}
                      >
                        Retrain Now
                      </Button>
                    }
                  >
                    <AlertTitle>Retraining Recommended</AlertTitle>
                    {trainingStatus.reason || 'Based on recent feedback and model performance'}
                  </Alert>
                )}
                
                {trainingStatus.active_jobs.length > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <AlertTitle>Training in Progress</AlertTitle>
                    A training job is currently {trainingStatus.active_jobs[0].status}.
                    Started at {formatDate(trainingStatus.active_jobs[0].created_at)}.
                  </Alert>
                )}
                
                {!trainingStatus.retraining_recommended && trainingStatus.active_jobs.length === 0 && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<StartIcon />}
                      onClick={handleOpenConfirmDialog}
                      disabled={loading}
                    >
                      Start Training
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Feedback Analysis Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Feedback Analysis</Typography>
                
                {Object.keys(trainingStatus.feedback_by_type).length > 0 ? (
                  <List>
                    {Object.entries(trainingStatus.feedback_by_type).map(([type, count]) => (
                      <React.Fragment key={type}>
                        <ListItem>
                          <ListItemText 
                            primary={`${type.replace('_', ' ')} (${count})`}
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={Math.min(100, (count / trainingStatus.new_feedback_count) * 100)} 
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No feedback analysis available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Recent Jobs Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Recent Training Jobs</Typography>
                
                {trainingStatus.recent_jobs.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Completed</TableCell>
                          <TableCell>Feedback Items</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trainingStatus.recent_jobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell>{job.id.substring(0, 8)}...</TableCell>
                            <TableCell>
                              {job.status === 'completed' ? (
                                <Chip icon={<CheckIcon />} label="Completed" color="success" size="small" />
                              ) : job.status === 'failed' ? (
                                <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />
                              ) : (
                                <Chip icon={<InfoIcon />} label={job.status} color="primary" size="small" />
                              )}
                            </TableCell>
                            <TableCell>{formatDate(job.created_at)}</TableCell>
                            <TableCell>{job.completed_at ? formatDate(job.completed_at) : 'N/A'}</TableCell>
                            <TableCell>{job.feedback_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No recent training jobs
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Model Retraining</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to start retraining the model?
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            This process will use all available feedback data to improve the model.
            The process may take some time to complete.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Reason for retraining (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={trainingReason}
            onChange={(e) => setTrainingReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button 
            onClick={handleStartTraining} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Start Training'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelTrainingMetrics;

// Helper component for missing LinearProgress
const LinearProgress: React.FC<{ variant: string; value: number }> = ({ variant, value }) => {
  return (
    <Box sx={{ width: '100%', height: 8, bgcolor: '#eee', borderRadius: 4, overflow: 'hidden' }}>
      <Box 
        sx={{ 
          width: `${value}%`, 
          height: '100%', 
          bgcolor: 'primary.main',
          transition: 'width 0.3s ease'
        }} 
      />
    </Box>
  );
}; 