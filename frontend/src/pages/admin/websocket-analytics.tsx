import React from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import WebSocketAnalyticsDashboard from '../../components/WebSocketAnalyticsDashboard';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const WebSocketAnalyticsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Check if the user is an admin
  if (!isLoading && (!user || user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <AdminLayout>
      <WebSocketAnalyticsDashboard />
    </AdminLayout>
  );
};

export default WebSocketAnalyticsPage; 