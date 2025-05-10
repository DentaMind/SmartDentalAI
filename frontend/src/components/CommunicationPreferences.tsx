import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import { communicationService } from '../services/communicationService';
import {
  CommunicationPreference,
  CommunicationChannel,
} from '../types/communication';

interface CommunicationPreferencesProps {
  patientId: number;
}

export const CommunicationPreferences: React.FC<CommunicationPreferencesProps> = ({
  patientId,
}) => {
  const [preferences, setPreferences] = useState<CommunicationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [patientId]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const data = await communicationService.getCommunicationPreferences(patientId);
      setPreferences(data);
      setError(null);
    } catch (err) {
      setError('Failed to load communication preferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: keyof CommunicationPreference) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const updatedPreferences = {
        ...preferences,
        [field]: !preferences[field],
      };

      await communicationService.updateCommunicationPreferences(
        patientId,
        updatedPreferences
      );

      setPreferences(updatedPreferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChannelChange = async (channel: CommunicationChannel) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const updatedPreferences = {
        ...preferences,
        preferred_channel: channel,
      };

      await communicationService.updateCommunicationPreferences(
        patientId,
        updatedPreferences
      );

      setPreferences(updatedPreferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update preferred channel');
      console.error(err);
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

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!preferences) {
    return (
      <Box p={3}>
        <Alert severity="warning">No communication preferences found</Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Communication Preferences
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Preferences updated successfully
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Preferred Communication Channel
          </Typography>
          <Box display="flex" gap={2}>
            {Object.values(CommunicationChannel).map((channel) => (
              <Button
                key={channel}
                variant={preferences.preferred_channel === channel ? 'contained' : 'outlined'}
                onClick={() => handleChannelChange(channel)}
                disabled={saving}
              >
                {channel.charAt(0).toUpperCase() + channel.slice(1)}
              </Button>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Communication Permissions
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.allow_email}
                  onChange={() => handleToggle('allow_email')}
                  disabled={saving}
                />
              }
              label="Allow Email Communications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.allow_sms}
                  onChange={() => handleToggle('allow_sms')}
                  disabled={saving}
                />
              }
              label="Allow SMS Communications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.allow_voice}
                  onChange={() => handleToggle('allow_voice')}
                  disabled={saving}
                />
              }
              label="Allow Voice Calls"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.allow_urgent_calls}
                  onChange={() => handleToggle('allow_urgent_calls')}
                  disabled={saving}
                />
              }
              label="Allow Urgent Calls"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.allow_sensitive_emails}
                  onChange={() => handleToggle('allow_sensitive_emails')}
                  disabled={saving}
                />
              }
              label="Allow Sensitive Information via Email"
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Consent Dates
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {preferences.sms_consent_date && (
              <Typography>
                SMS Consent Date: {new Date(preferences.sms_consent_date).toLocaleDateString()}
              </Typography>
            )}
            {preferences.voice_consent_date && (
              <Typography>
                Voice Consent Date: {new Date(preferences.voice_consent_date).toLocaleDateString()}
              </Typography>
            )}
            {preferences.email_consent_date && (
              <Typography>
                Email Consent Date: {new Date(preferences.email_consent_date).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}; 