import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../../components/Layout';
import SecurityAlertsDashboard from '../../components/admin/SecurityAlertsDashboard';

const SecurityAlertsDashboardPage: React.FC = () => {
  return (
    <Layout>
      <Helmet>
        <title>Security Alerts | DentaMind Admin</title>
      </Helmet>
      <SecurityAlertsDashboard />
    </Layout>
  );
};

export default SecurityAlertsDashboardPage; 