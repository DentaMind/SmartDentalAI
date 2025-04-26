import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Link,
} from '@mui/material';
import { usePreAuth } from '@hooks/usePreAuth';

interface PreAuthDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  cdtCode: string;
  procedureDescription: string;
}

export const PreAuthDialog: React.FC<PreAuthDialogProps> = ({
  open,
  onClose,
  patientId,
  cdtCode,
  procedureDescription,
}) => {
  const { submitPreAuth, isSubmitting, status } = usePreAuth();
  const [clinicalNotes, setClinicalNotes] = useState('');

  const handleSubmit = async () => {
    try {
      await submitPreAuth({
        patientId,
        cdtCode,
        clinicalNotes,
      });
    } catch (error) {
      console.error('Error submitting pre-auth:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Pre-Authorization Request
        <Typography variant="subtitle2" color="text.secondary">
          {cdtCode} - {procedureDescription}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {status?.status === 'submitted' ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              {status.message}
            </Alert>
            {status.documentUrl && (
              <Link href={status.documentUrl} target="_blank" rel="noopener">
                View Pre-Authorization Document
              </Link>
            )}
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              This procedure requires pre-authorization. Please provide clinical notes to support the request.
            </Alert>
            <TextField
              autoFocus
              multiline
              rows={4}
              label="Clinical Notes"
              fullWidth
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              disabled={isSubmitting}
              sx={{ mt: 1 }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {status?.status === 'submitted' ? 'Close' : 'Cancel'}
        </Button>
        {status?.status !== 'submitted' && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || !clinicalNotes.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            Submit Request
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}; 