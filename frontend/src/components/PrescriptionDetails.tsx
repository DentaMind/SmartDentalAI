import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import prescriptionService from '../services/prescriptionService';
import { Prescription, PrescriptionHistory } from '../types/prescriptions';

interface PrescriptionDetailsProps {
  prescriptionId: string;
}

const PrescriptionDetails: React.FC<PrescriptionDetailsProps> = ({ prescriptionId }) => {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [history, setHistory] = useState<PrescriptionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prescriptionData, historyData] = await Promise.all([
          prescriptionService.getPrescription(prescriptionId),
          prescriptionService.getPrescriptionHistory(prescriptionId),
        ]);
        setPrescription(prescriptionData);
        setHistory(historyData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch prescription details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [prescriptionId]);

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

  if (!prescription) {
    return (
      <Box p={3}>
        <Alert severity="warning">Prescription not found</Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          {prescription.medicationName}
        </Typography>
        <Chip
          label={prescription.status}
          color={
            prescription.status === 'active'
              ? 'success'
              : prescription.status === 'completed'
              ? 'primary'
              : 'error'
          }
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Prescription Details
          </Typography>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Dosage
            </Typography>
            <Typography variant="body1">{prescription.dosage}</Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary">
              Frequency
            </Typography>
            <Typography variant="body1">{prescription.frequency}</Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary">
              Route
            </Typography>
            <Typography variant="body1">{prescription.route}</Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Duration
          </Typography>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Start Date
            </Typography>
            <Typography variant="body1">
              {new Date(prescription.startDate).toLocaleDateString()}
            </Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary">
              End Date
            </Typography>
            <Typography variant="body1">
              {new Date(prescription.endDate).toLocaleDateString()}
            </Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary">
              Refills Remaining
            </Typography>
            <Typography variant="body1">{prescription.refillsRemaining}</Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom>
            Instructions
          </Typography>
          <Typography variant="body1">{prescription.instructions}</Typography>
        </Grid>

        {history.length > 0 && (
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom>
              History
            </Typography>
            {history.map((entry, index) => (
              <Box key={index} mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {new Date(entry.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="body1">{entry.description}</Typography>
              </Box>
            ))}
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default PrescriptionDetails; 