import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, subDays } from 'date-fns';
import {
  FileDownload as FileDownloadIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';

import {
  securityAlertService,
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  SecurityAlert,
  AlertFilterParams,
  AlertCategories
} from '../../services/SecurityAlertService';

interface SecurityAlertsExportProps {
  categories: AlertCategories | null;
}

const SecurityAlertsExport: React.FC<SecurityAlertsExportProps> = ({ categories }) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      await securityAlertService.exportAlerts();
      handleClose();
    } catch (error) {
      console.error('Error exporting alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Export Alerts">
        <IconButton onClick={handleOpen}>
          <FileDownloadIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Export Security Alerts</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Export security alerts for compliance reporting and further analysis.
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={format}
              label="Export Format"
              onChange={(e) => setFormat(e.target.value)}
            >
              <MenuItem value="csv">CSV (Spreadsheet)</MenuItem>
              <MenuItem value="json">JSON (Data)</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            HIPAA Compliance Note: The exported file will contain all alert details including
            any associated patient identifiers. Please ensure this data is handled securely
            and appropriately anonymized for any reports shared outside the organization.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            disabled={loading}
          >
            {loading ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SecurityAlertsExport; 