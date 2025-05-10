import React from 'react';
import { Box, Typography, Paper, Breadcrumbs, Link } from '@mui/material';
import ClinicalEvidenceAdmin from '../../components/admin/ClinicalEvidenceAdmin';
import AdminLayout from '../../components/admin/AdminLayout';

const ClinicalEvidencePage: React.FC = () => {
  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/admin">
            Admin
          </Link>
          <Typography color="text.primary">Clinical Evidence</Typography>
        </Breadcrumbs>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Clinical Evidence Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage clinical evidence entries and their associations with findings and treatments.
            This enables transparent, evidence-based treatment suggestions for dental professionals.
          </Typography>
        </Paper>
        
        <ClinicalEvidenceAdmin />
      </Box>
    </AdminLayout>
  );
};

export default ClinicalEvidencePage; 