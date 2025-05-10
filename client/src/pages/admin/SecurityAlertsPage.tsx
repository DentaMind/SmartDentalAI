import React from 'react';
import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Home as HomeIcon, Security as SecurityIcon } from '@mui/icons-material';
import SecurityAlertsDashboard from '../../components/admin/SecurityAlertsDashboard';

const SecurityAlertsPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box my={3}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link 
            component={RouterLink} 
            to="/admin/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Admin
          </Link>
          <Typography 
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <SecurityIcon sx={{ mr: 0.5 }} fontSize="small" />
            Security Alerts
          </Typography>
        </Breadcrumbs>
        
        <SecurityAlertsDashboard />
      </Box>
    </Container>
  );
};

export default SecurityAlertsPage; 