import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  CircularProgress,
  Tooltip,
  Box,
  Typography,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ModelStatusBadge from './ModelStatusBadge';
import { useApi } from '../../hooks/useApi';

interface ReanalyzeButtonProps {
  patientId: string;
  imageId: string;
  imageType: string;
  onAnalysisComplete?: (result: any) => void;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
}

const ReanalyzeButton: React.FC<ReanalyzeButtonProps> = ({
  patientId,
  imageId,
  imageType,
  onAnalysisComplete,
  disabled = false,
  variant = 'contained',
  size = 'medium'
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const handleClickOpen = () => {
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  const handleReanalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to re-analyze the image
      const response = await api.post('/api/diagnostics/reanalyze', {
        patientId,
        imageId,
        imageType
      });
      
      // Call the callback with the results
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data);
      }
      
      // Close the dialog
      setOpen(false);
    } catch (err: any) {
      console.error('Error re-analyzing image:', err);
      setError(err.response?.data?.detail || 'Failed to re-analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Re-analyze this image with the latest AI model">
        <span>
          <Button
            variant={variant}
            color="primary"
            onClick={handleClickOpen}
            disabled={disabled}
            startIcon={<RefreshIcon />}
            size={size}
          >
            Re-analyze with AI
          </Button>
        </span>
      </Tooltip>
      
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="reanalyze-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="reanalyze-dialog-title">
          <Box display="flex" alignItems="center">
            <PsychologyIcon sx={{ mr: 1 }} />
            Re-analyze with AI
            <Box ml="auto">
              <ModelStatusBadge size="small" />
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <DialogContentText>
            This will analyze the image using the latest AI model and update the findings.
            Any manual modifications to the current analysis may be lost.
          </DialogContentText>
          
          <Box mt={2} mb={1}>
            <Typography variant="body2" color="text.secondary">
              <strong>Patient ID:</strong> {patientId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Image Type:</strong> {imageType}
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleClose} 
            color="inherit" 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReanalyze} 
            color="primary" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Analyzing...' : 'Confirm Re-analysis'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReanalyzeButton; 