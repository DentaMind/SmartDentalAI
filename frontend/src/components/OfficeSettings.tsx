import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';

interface BusinessHours {
  start: string;
  end: string;
}

interface BusinessHoursMap {
  [key: string]: BusinessHours | null;
}

interface OfficeSettings {
  id: string;
  office_name: string;
  office_email: string;
  office_phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  timezone: string;
  logo_url: string;
  sms_sender_id: string;
  email_signature: string;
  business_hours: BusinessHoursMap;
  settings_metadata: {
    version: string;
    last_updated_by: string;
    features: {
      online_scheduling: boolean;
      patient_portal: boolean;
      automated_reminders: boolean;
    };
  };
}

const OfficeSettings: React.FC = () => {
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/office/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof OfficeSettings, value: string) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleBusinessHoursChange = (day: string, field: 'start' | 'end', value: string) => {
    if (settings) {
      const newHours = { ...settings.business_hours };
      if (!newHours[day]) newHours[day] = { start: '09:00', end: '17:00' };
      newHours[day]![field] = value;
      setSettings({ ...settings, business_hours: newHours });
    }
  };

  const handleFeatureToggle = (feature: keyof OfficeSettings['settings_metadata']['features']) => {
    if (settings) {
      const newSettings = { ...settings };
      newSettings.settings_metadata.features[feature] = !newSettings.settings_metadata.features[feature];
      setSettings(newSettings);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/office/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error">
        Failed to load office settings. Please try again later.
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Office Settings
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Office Name"
                value={settings.office_name}
                onChange={(e) => handleInputChange('office_name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Office Email"
                type="email"
                value={settings.office_email}
                onChange={(e) => handleInputChange('office_email', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Office Phone"
                value={settings.office_phone}
                onChange={(e) => handleInputChange('office_phone', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Timezone"
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                required
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={settings.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={settings.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={settings.zip_code}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
                required
              />
            </Grid>

            {/* Business Hours */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Business Hours
              </Typography>
            </Grid>
            
            {Object.entries(settings.business_hours).map(([day, hours]) => (
              <Grid item xs={12} key={day}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                          {day}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={5}>
                        <TimePicker
                          label="Open"
                          value={hours ? parse(hours.start, 'HH:mm', new Date()) : null}
                          onChange={(date) => {
                            if (date) {
                              handleBusinessHoursChange(day, 'start', format(date, 'HH:mm'));
                            }
                          }}
                          disabled={!hours}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={5}>
                        <TimePicker
                          label="Close"
                          value={hours ? parse(hours.end, 'HH:mm', new Date()) : null}
                          onChange={(date) => {
                            if (date) {
                              handleBusinessHoursChange(day, 'end', format(date, 'HH:mm'));
                            }
                          }}
                          disabled={!hours}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Features */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.settings_metadata.features.online_scheduling}
                    onChange={() => handleFeatureToggle('online_scheduling')}
                  />
                }
                label="Online Scheduling"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.settings_metadata.features.patient_portal}
                    onChange={() => handleFeatureToggle('patient_portal')}
                  />
                }
                label="Patient Portal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.settings_metadata.features.automated_reminders}
                    onChange={() => handleFeatureToggle('automated_reminders')}
                  />
                }
                label="Automated Reminders"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default OfficeSettings; 