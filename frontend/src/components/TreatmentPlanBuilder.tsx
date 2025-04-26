import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Divider,
  Alert,
  Stack,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import { ConsentDialog } from './ConsentDialog';
import { ConsentDisplay } from './ConsentDisplay';
import { useTreatmentPlanConsent } from '../hooks/useTreatmentPlanConsent';

interface TreatmentPlanBuilderProps {
  planId: number;
  onPlanUpdate?: () => void;
  readOnly?: boolean;
}

export const TreatmentPlanBuilder: React.FC<TreatmentPlanBuilderProps> = ({
  planId,
  onPlanUpdate,
  readOnly = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    consentData,
    loading: consentLoading,
    error: consentError,
    fetchConsentData,
    isPlanLocked,
  } = useTreatmentPlanConsent(planId);

  useEffect(() => {
    // Fetch consent data when component mounts
    fetchConsentData();
  }, [fetchConsentData]);

  const handleConsentSigned = () => {
    fetchConsentData();
    if (onPlanUpdate) {
      onPlanUpdate();
    }
  };

  return (
    <Box>
      {/* Treatment Plan Content */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Treatment Plan
          </Typography>
          {isPlanLocked && (
            <LockIcon color="primary" sx={{ ml: 1 }} />
          )}
          {!isPlanLocked && !readOnly && (
            <EditIcon color="action" sx={{ ml: 1 }} />
          )}
        </Box>

        {/* Treatment Plan Builder UI goes here */}
        {/* ... existing treatment plan content ... */}

        {/* Consent Section */}
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          
          {consentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load consent data: {consentError}
            </Alert>
          )}

          {!isPlanLocked && !readOnly && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body1" color="text.secondary">
                This treatment plan requires patient consent before proceeding.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setDialogOpen(true)}
                disabled={consentLoading}
              >
                Sign Consent
              </Button>
            </Stack>
          )}

          {isPlanLocked && consentData && (
            <ConsentDisplay
              signed_by={consentData.signed_by}
              signed_at={consentData.signed_at}
              signature_data={consentData.signature_data}
              ip_address={consentData.ip_address}
            />
          )}
        </Box>
      </Paper>

      {/* Consent Dialog */}
      <ConsentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        treatmentPlanId={planId}
        onConsentSigned={handleConsentSigned}
      />
    </Box>
  );
} 