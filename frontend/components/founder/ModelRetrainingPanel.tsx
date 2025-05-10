import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRetrainingStatus,
  updateRetrainingThresholds,
  triggerRetraining,
  getRetrainingHistory,
} from '@/api/founder';

interface RetrainingThresholds {
  diagnosis_accuracy: number;
  treatment_stability: number;
  billing_accuracy: number;
  min_samples: number;
}

interface RetrainingMetrics {
  last_retrained: string;
  status: string;
  performance: {
    accuracy: number;
    validation_loss: number;
  };
  retraining_count_30d: number;
}

const ModelRetrainingPanel: React.FC = () => {
  const [thresholds, setThresholds] = useState<RetrainingThresholds>({
    diagnosis_accuracy: 0.10,
    treatment_stability: 0.15,
    billing_accuracy: 0.08,
    min_samples: 50,
  });
  const [manualDialog, setManualDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [retrainingReason, setRetrainingReason] = useState('');
  const [forceRetrain, setForceRetrain] = useState(false);

  const queryClient = useQueryClient();

  // Fetch current status
  const { data: status, isLoading: statusLoading } = useQuery(
    ['retrainingStatus'],
    getRetrainingStatus
  );

  // Fetch history
  const { data: history } = useQuery(
    ['retrainingHistory'],
    () => getRetrainingHistory()
  );

  // Mutations
  const updateThresholdsMutation = useMutation(updateRetrainingThresholds, {
    onSuccess: () => {
      queryClient.invalidateQueries(['retrainingStatus']);
    },
  });

  const triggerRetrainingMutation = useMutation(triggerRetraining, {
    onSuccess: () => {
      queryClient.invalidateQueries(['retrainingStatus', 'retrainingHistory']);
      setManualDialog(false);
    },
  });

  const handleThresholdChange = (type: keyof RetrainingThresholds) => (event: Event, value: number | number[]) => {
    setThresholds(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveThresholds = () => {
    updateThresholdsMutation.mutate(thresholds);
  };

  const handleManualRetrain = () => {
    if (!selectedModel) return;

    triggerRetrainingMutation.mutate({
      model_type: selectedModel,
      reason: retrainingReason,
      force: forceRetrain,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <CircularProgress size={20} />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  if (statusLoading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Model Retraining Control
      </Typography>

      <Grid container spacing={3}>
        {/* Status Cards */}
        {status?.metrics && Object.entries(status.metrics).map(([model, metrics]) => (
          <Grid item xs={12} md={4} key={model}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {model.charAt(0).toUpperCase() + model.slice(1)} Model
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <Chip
                    label={metrics.status}
                    color={getStatusColor(metrics.status)}
                    icon={getStatusIcon(metrics.status)}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Last trained: {format(new Date(metrics.last_retrained), 'PPp')}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Accuracy: {(metrics.performance.accuracy * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2">
                  30-day retrains: {metrics.retraining_count_30d}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setSelectedModel(model);
                    setManualDialog(true);
                  }}
                >
                  Retrain
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Thresholds Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Retraining Thresholds
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography>Diagnosis Accuracy Threshold (%)</Typography>
                  <Slider
                    value={thresholds.diagnosis_accuracy * 100}
                    onChange={handleThresholdChange('diagnosis_accuracy')}
                    min={1}
                    max={30}
                    valueLabelDisplay="auto"
                    valueLabelFormat={x => `${x}%`}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography>Treatment Stability Threshold (%)</Typography>
                  <Slider
                    value={thresholds.treatment_stability * 100}
                    onChange={handleThresholdChange('treatment_stability')}
                    min={1}
                    max={30}
                    valueLabelDisplay="auto"
                    valueLabelFormat={x => `${x}%`}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography>Billing Accuracy Threshold (%)</Typography>
                  <Slider
                    value={thresholds.billing_accuracy * 100}
                    onChange={handleThresholdChange('billing_accuracy')}
                    min={1}
                    max={30}
                    valueLabelDisplay="auto"
                    valueLabelFormat={x => `${x}%`}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography>Minimum Samples Required</Typography>
                  <Slider
                    value={thresholds.min_samples}
                    onChange={handleThresholdChange('min_samples')}
                    min={10}
                    max={200}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleSaveThresholds}
                    startIcon={<RefreshIcon />}
                  >
                    Update Thresholds
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* History Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Retraining History
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Started</TableCell>
                      <TableCell>Completed</TableCell>
                      <TableCell>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history?.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>{event.model_type}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.status}
                            color={getStatusColor(event.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(event.started_at), 'PPp')}
                        </TableCell>
                        <TableCell>
                          {event.completed_at
                            ? format(new Date(event.completed_at), 'PPp')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {event.performance_metrics
                            ? `${(event.performance_metrics.accuracy * 100).toFixed(1)}% acc`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Manual Retraining Dialog */}
      <Dialog open={manualDialog} onClose={() => setManualDialog(false)}>
        <DialogTitle>Manual Model Retraining</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Retraining"
            fullWidth
            multiline
            rows={4}
            value={retrainingReason}
            onChange={(e) => setRetrainingReason(e.target.value)}
          />
          <Box display="flex" alignItems="center" mt={2}>
            <Switch
              checked={forceRetrain}
              onChange={(e) => setForceRetrain(e.target.checked)}
            />
            <Typography>Force Retrain (bypass checks)</Typography>
          </Box>
          {forceRetrain && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Forcing retraining will bypass all safety checks and thresholds
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualDialog(false)}>Cancel</Button>
          <Button
            onClick={handleManualRetrain}
            color="primary"
            variant="contained"
            disabled={!retrainingReason}
          >
            Start Retraining
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelRetrainingPanel; 