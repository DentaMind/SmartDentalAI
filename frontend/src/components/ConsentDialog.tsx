import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const SignatureBox = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  '& canvas': {
    width: '100% !important',
    height: '200px !important',
  },
}));

interface ConsentDialogProps {
  open: boolean;
  onClose: () => void;
  treatmentPlanId: number;
  onConsentSigned: () => void;
}

interface ConsentData {
  signed_by: string;
  signed_at: string;
  signature_data: string;
  ip_address: string;
  status: string;
}

export const ConsentDialog: React.FC<ConsentDialogProps> = ({
  open,
  onClose,
  treatmentPlanId,
  onConsentSigned,
}) => {
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const signaturePadRef = useRef<SignaturePad>(null);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const validateForm = (): boolean => {
    if (!patientName.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setError('Please provide your signature');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const signatureData = signaturePadRef.current?.toDataURL() || '';

      const response = await fetch(`/api/treatment-plan/${treatmentPlanId}/sign-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signed_by: patientName,
          signature_data: signatureData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to sign consent');
      }

      const consentData: ConsentData = await response.json();
      setSuccess(true);
      onConsentSigned();

      // Close dialog after showing success for a moment
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign consent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Treatment Plan Consent</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            Consent successfully signed! The treatment plan is now locked.
          </Alert>
        ) : (
          <>
            <Typography variant="body1" gutterBottom>
              By signing this consent form, you agree to proceed with the proposed treatment plan.
              This will lock the treatment plan and create a record in our system.
            </Typography>

            <TextField
              fullWidth
              label="Patient Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              margin="normal"
              error={!!error && !patientName}
              helperText={!patientName && error}
            />

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Signature
            </Typography>

            <SignatureBox>
              <SignaturePad
                ref={signaturePadRef}
                canvasProps={{
                  className: 'signature-canvas',
                }}
              />
            </SignatureBox>

            <Button variant="text" onClick={handleClear} sx={{ mb: 2 }}>
              Clear Signature
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || success}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign Consent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 