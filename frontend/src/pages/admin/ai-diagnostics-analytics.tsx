import React from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import AIDiagnosticsAnalytics from '../../components/admin/AIDiagnosticsAnalytics';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const AIDiagnosticsAnalyticsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Check if the user is an admin
  if (!isLoading && (!user || user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <AdminLayout>
      <AIDiagnosticsAnalytics />
    </AdminLayout>
  );
};

export default AIDiagnosticsAnalyticsPage; 