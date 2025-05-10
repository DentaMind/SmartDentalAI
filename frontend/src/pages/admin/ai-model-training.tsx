import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import ModelTrainingMetrics from '../../components/admin/ModelTrainingMetrics';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { API_URL } from '../../config/constants';

interface ModelInfo {
  model_name: string;
  model_version: string;
  last_seen: string;
}

const AIModelTrainingPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if the user is an admin
  if (!isLoading && (!user || user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }
  
  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ai/diagnostics/models`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        
        const data = await response.json();
        setModels(data.models);
        
        // Select the first model by default
        if (data.models.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].model_name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, []);
  
  const handleModelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedModel(event.target.value as string);
  };
  
  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Model Training
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Monitor and manage AI model training based on clinical feedback
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Select Model</InputLabel>
                <Select
                  value={selectedModel}
                  label="Select Model"
                  onChange={handleModelChange}
                >
                  {models.map(model => (
                    <MenuItem key={model.model_name} value={model.model_name}>
                      {model.model_name} ({model.model_version})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {selectedModel && (
              <Card>
                <CardContent>
                  <ModelTrainingMetrics 
                    modelName={selectedModel}
                    modelVersion={models.find(m => m.model_name === selectedModel)?.model_version}
                  />
                </CardContent>
              </Card>
            )}
            
            {!selectedModel && models.length > 0 && (
              <Alert severity="info">
                Please select a model to view training metrics
              </Alert>
            )}
            
            {models.length === 0 && (
              <Alert severity="warning">
                No AI diagnostic models found in the system
              </Alert>
            )}
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AIModelTrainingPage; 