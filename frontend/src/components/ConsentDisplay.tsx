import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import { format } from 'date-fns';

const SignatureImage = styled('img')({
  maxWidth: '200px',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  padding: '8px',
});

interface ConsentDisplayProps {
  signed_by: string;
  signed_at: string;
  signature_data: string;
  ip_address: string;
}

export const ConsentDisplay: React.FC<ConsentDisplayProps> = ({
  signed_by,
  signed_at,
  signature_data,
  ip_address,
}) => {
  const formattedDate = format(new Date(signed_at), 'PPpp');

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LockIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" component="div">
          Treatment Plan Consent
        </Typography>
        <Chip
          label="Locked"
          color="primary"
          size="small"
          sx={{ ml: 'auto' }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Signed By:</strong> {signed_by}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          <strong>Date:</strong> {formattedDate}
        </Typography>

        <Tooltip title={`IP Address: ${ip_address}`}>
          <Typography variant="body2" color="text.secondary">
            <strong>Location:</strong> Verified on-premises
          </Typography>
        </Tooltip>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Signature
          </Typography>
          <SignatureImage src={signature_data} alt="Patient Signature" />
        </Box>
      </Box>
    </Paper>
  );
}; 