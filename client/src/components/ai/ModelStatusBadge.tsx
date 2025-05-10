import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';

interface ModelStatusProps {
  size?: 'small' | 'medium';
  showDetails?: boolean;
}

/**
 * Model Status Badge component
 * Shows the current status of the AI models
 */
const ModelStatusBadge: React.FC<ModelStatusProps> = ({ 
  size = 'medium', 
  showDetails = false 
}) => {
  // Mock status for now
  const status = {
    model: { 
      type: 'DentaMind AI', 
      version: '1.0.0', 
      mock: true 
    },
    components: {
      inference: 'mock'
    }
  };

  return (
    <Box>
      <Tooltip 
        title={
          showDetails ? 
          `Type: ${status.model.type}, Version: ${status.model.version}, Mode: Mock data` : 
          'Using mock AI data for development'
        }
      >
        <Chip
          size={size}
          label="Mock AI"
          color="warning"
          icon={<DataObjectIcon />}
        />
      </Tooltip>
    </Box>
  );
};

export default ModelStatusBadge; 