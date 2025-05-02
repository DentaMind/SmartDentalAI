import React from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import WebSocketClientMetricsDashboard from '../../components/WebSocketClientMetricsDashboard';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const WebSocketClientMetricsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Check if the user is an admin
  if (!isLoading && (!user || user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <AdminLayout>
      <WebSocketClientMetricsDashboard />
    </AdminLayout>
  );
};

export default WebSocketClientMetricsPage; 