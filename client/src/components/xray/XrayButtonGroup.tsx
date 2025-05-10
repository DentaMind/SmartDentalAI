import React from 'react';
import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface XrayButtonGroupProps {
  patientId: string;
  compact?: boolean;
}

/**
 * XrayButtonGroup component
 * 
 * Provides consistent X-ray navigation buttons with error handling
 */
const XrayButtonGroup: React.FC<XrayButtonGroupProps> = ({ patientId, compact = false }) => {
  const navigate = useNavigate();

  const handleViewXrays = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigate(`/patients/${patientId}/x-rays/view`);
    } catch (error) {
      console.error('Failed to navigate to X-ray viewer:', error);
      // Fallback to direct URL navigation
      window.location.href = `/patients/${patientId}/x-rays/view`;
    }
  };

  const handleTakeNewXray = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigate(`/patients/${patientId}/x-rays/upload`);
    } catch (error) {
      console.error('Failed to navigate to X-ray upload:', error);
      // Fallback to direct URL navigation
      window.location.href = `/patients/${patientId}/x-rays/upload`;
    }
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button 
          size="small" 
          variant="outlined"
          onClick={handleViewXrays}
        >
          View X-Rays
        </Button>
        <Button 
          size="small" 
          variant="outlined"
          onClick={handleTakeNewXray}
        >
          Take New X-Ray
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleViewXrays}
      >
        View X-Ray Images
      </Button>
      <Button 
        variant="outlined" 
        color="primary"
        onClick={handleTakeNewXray}
      >
        Take New X-Ray
      </Button>
    </Box>
  );
};

export default XrayButtonGroup; 