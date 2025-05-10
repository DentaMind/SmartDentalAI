import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Box,
  Divider,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Paper
} from '@mui/material';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import ModelStatusBadge from '../ai/ModelStatusBadge';
import { useApi } from '../../hooks/useApi';

const AIConfigPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    useMockData: true,
    modelType: '',
    maxConcurrentRequests: 5,
    confidenceThreshold: 0.7
  });
  
  const api = useApi();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        // In a real implementation, fetch from dedicated admin config endpoint
        const response = await api.get('/api/admin/ai-config');
        setConfig(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching AI configuration:', err);
        setError('Unable to load AI configuration. Using defaults.');
        // Set default values if fetch fails
        setConfig({
          useMockData: true,
          modelType: 'mock',
          maxConcurrentRequests: 5,
          confidenceThreshold: 0.7
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [api]);

  const handleToggleMockData = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({
      ...config,
      useMockData: event.target.checked
    });
  };

  const handleModelTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({
      ...config,
      modelType: event.target.value
    });
  };

  const handleConfidenceThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setConfig({
        ...config,
        confidenceThreshold: value
      });
    }
  };

  const handleMaxRequestsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setConfig({
        ...config,
        maxConcurrentRequests: value
      });
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      // In a real implementation, save to a dedicated admin config endpoint
      await api.post('/api/admin/ai-config', config);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving AI configuration:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="AI System Configuration" 
        avatar={<DeveloperModeIcon />}
        action={<ModelStatusBadge />}
      />
      <Divider />
      <CardContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Configuration saved successfully!</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Operation Mode</Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.useMockData}
                      onChange={handleToggleMockData}
                      name="useMockData"
                      color="primary"
                    />
                  }
                  label="Use Mock Data"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  When enabled, the system will use simulated data instead of real AI inference.
                  Useful for development and testing without loading actual models.
                </Typography>
              </FormGroup>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Model Configuration</Typography>
              <TextField
                label="Model Type"
                select
                value={config.modelType}
                onChange={handleModelTypeChange}
                SelectProps={{
                  native: true,
                }}
                fullWidth
                disabled={config.useMockData}
                margin="normal"
                variant="outlined"
              >
                <option value="onnx">ONNX</option>
                <option value="pytorch">PyTorch</option>
                <option value="tensorflow">TensorFlow</option>
                <option value="roboflow">Roboflow API</option>
                <option value="openai">OpenAI API</option>
                <option value="mock">Mock Data</option>
              </TextField>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Performance Settings</Typography>
              <TextField
                label="Max Concurrent Requests"
                type="number"
                value={config.maxConcurrentRequests}
                onChange={handleMaxRequestsChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1, max: 20 } }}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Maximum number of AI inference requests processed simultaneously.
                Higher values increase throughput but require more resources.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Quality Settings</Typography>
              <TextField
                label="Confidence Threshold"
                type="number"
                value={config.confidenceThreshold}
                onChange={handleConfidenceThresholdChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { step: 0.05, min: 0, max: 1 } }}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Minimum confidence level required for findings to be reported.
                Higher values reduce false positives but may miss subtle findings.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveConfig}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={24} /> : null}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIConfigPanel; 