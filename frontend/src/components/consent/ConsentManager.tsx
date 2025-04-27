import React from 'react';
import { useConsentEvents } from '@/hooks/useConsentEvents';
import { useQuery, useMutation } from 'react-query';
import { apiRequest } from '@/lib/apiRequest';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';

interface ConsentManagerProps {
  patientId: number;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({ patientId }) => {
  const [revokeDialogOpen, setRevokeDialogOpen] = React.useState(false);
  const [selectedConsent, setSelectedConsent] = React.useState<any>(null);
  const [revocationReason, setRevocationReason] = React.useState('');

  const {
    collectConsentRevoked,
    collectConsentExpired,
    collectConsentRenewed,
    collectConsentDocumentUploaded,
    collectConsentDocumentViewed
  } = useConsentEvents();

  const { data: consents, isLoading } = useQuery(
    ['consents', patientId],
    () => apiRequest('GET', `/api/patients/${patientId}/consents`)
  );

  const revokeMutation = useMutation(
    async ({ consentId, reason }: { consentId: number; reason: string }) => {
      const response = await apiRequest('POST', `/api/consents/${consentId}/revoke`, { reason });
      return response;
    },
    {
      onSuccess: async (_, variables) => {
        await collectConsentRevoked(patientId, variables.consentId, variables.reason, {
          source: 'user'
        });
        setRevokeDialogOpen(false);
        setRevocationReason('');
      }
    }
  );

  const renewMutation = useMutation(
    async (consentId: number) => {
      const response = await apiRequest('POST', `/api/consents/${consentId}/renew`);
      return response;
    },
    {
      onSuccess: async (_, consentId) => {
        await collectConsentRenewed(patientId, consentId, {
          source: 'user'
        });
      }
    }
  );

  const handleDocumentUpload = async (consentId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiRequest('POST', `/api/consents/${consentId}/documents`, formData);
    await collectConsentDocumentUploaded(
      patientId,
      consentId,
      response.data.documentId,
      file.type,
      { source: 'user' }
    );
  };

  const handleDocumentView = async (consentId: number, documentId: number) => {
    await apiRequest('GET', `/api/consents/${consentId}/documents/${documentId}`);
    await collectConsentDocumentViewed(patientId, consentId, documentId, {
      source: 'user'
    });
  };

  const handleRevokeClick = (consent: any) => {
    setSelectedConsent(consent);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (selectedConsent && revocationReason) {
      await revokeMutation.mutateAsync({
        consentId: selectedConsent.id,
        reason: revocationReason
      });
    }
  };

  if (isLoading) {
    return <Typography>Loading consents...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Patient Consents
      </Typography>

      <List>
        {consents?.map((consent: any) => (
          <ListItem key={consent.id}>
            <ListItemText
              primary={consent.type}
              secondary={`Status: ${consent.status} | Expires: ${consent.expirationDate}`}
            />
            <ListItemSecondaryAction>
              <Button
                onClick={() => renewMutation.mutate(consent.id)}
                disabled={consent.status === 'revoked'}
              >
                Renew
              </Button>
              <Button
                onClick={() => handleRevokeClick(consent)}
                disabled={consent.status === 'revoked'}
                color="error"
              >
                Revoke
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle>Revoke Consent</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Revocation"
            fullWidth
            multiline
            rows={4}
            value={revocationReason}
            onChange={(e) => setRevocationReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRevokeConfirm} color="error">
            Confirm Revocation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 