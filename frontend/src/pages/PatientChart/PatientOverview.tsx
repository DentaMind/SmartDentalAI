import React from 'react';
import { Grid, Paper } from '@mui/material';
import { BenefitsWidget } from '../../components/BenefitsWidget';
import { useParams } from 'react-router-dom';

export const PatientOverview: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();

  const handlePreAuthRequired = (cdtCodes: string[]) => {
    // TODO: Implement pre-auth workflow
    console.log('Pre-auth required for:', cdtCodes);
  };

  return (
    <Grid container spacing={3}>
      {/* Left column */}
      <Grid item xs={12} md={8}>
        {/* Other patient information components */}
      </Grid>

      {/* Right column */}
      <Grid item xs={12} md={4}>
        <BenefitsWidget
          patientId={patientId}
          onPreAuthRequired={handlePreAuthRequired}
        />
      </Grid>
    </Grid>
  );
}; 