import React from 'react';
import { IntegratedDashboard } from '../components/dashboard/integrated-dashboard';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <IntegratedDashboard />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;