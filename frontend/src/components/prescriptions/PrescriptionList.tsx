import React, { useEffect, useState } from 'react';
import { Prescription } from '../../types/prescriptions';
import { getPrescriptionsByPatientId } from '../../services/prescriptionService';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
} from '@mui/material';

interface PrescriptionListProps {
  patientId: string;
}

const PrescriptionList: React.FC<PrescriptionListProps> = ({ patientId }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const data = await getPrescriptionsByPatientId(patientId);
        setPrescriptions(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch prescriptions');
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [patientId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading prescriptions...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (prescriptions.length === 0) {
    return <Typography>No prescriptions found</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Medication</TableCell>
            <TableCell>Dosage</TableCell>
            <TableCell>Frequency</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {prescriptions.map((prescription) => (
            <TableRow key={prescription.id}>
              <TableCell>{prescription.medicationName}</TableCell>
              <TableCell>{prescription.dosage}</TableCell>
              <TableCell>{prescription.frequency}</TableCell>
              <TableCell>{new Date(prescription.startDate).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(prescription.endDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Chip
                  label={prescription.status}
                  color={getStatusColor(prescription.status) as any}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PrescriptionList; 