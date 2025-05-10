import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useRouteError } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Import core pages
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));

// Import patient pages
const PatientList = lazy(() => import('./pages/patient/PatientList'));
const PatientDetail = lazy(() => import('./pages/patient/PatientDetail'));
const PatientChart = lazy(() => import('./pages/patient/PatientChart'));
const PatientPerioChart = lazy(() => import('./pages/patient/PatientPerioChart'));
const EnhancedPatientPerioChart = lazy(() => import('./pages/patient/EnhancedPatientPerioChart'));
const ScheduleAppointmentPage = lazy(() => import('./pages/ScheduleAppointmentPage'));

// Import dental chart demo
const DentalChartDemo = lazy(() => import('./pages/test/DentalChartDemo'));

// Add XRayViewer and XRayUpload components
const XRayViewer = lazy(() => import('./pages/patient/XRayViewer'));

// Import AI pages
const AIDashboard = lazy(() => import('./pages/ai-dashboard'));
const AIHub = lazy(() => import('./pages/ai-hub'));

// Create a wrapper component to handle the XRayUpload more safely
const SafeXRayUpload = React.lazy(async () => {
  try {
    // Try to import the XRayUpload component
    return await import('./pages/patient/XRayUpload');
  } catch (error) {
    console.error("Error loading XRayUpload:", error);
    // Return a fallback component if import fails
    return { 
      default: () => (
        <div style={{ padding: '20px' }}>
          <h2>Error Loading X-Ray Upload</h2>
          <p>There was a problem loading the X-Ray upload interface. Please try again later.</p>
        </div>
      )
    };
  }
});

// Error page
const ErrorPage = () => {
  const error = useRouteError();
  
  return (
    <div style={{ 
      padding: '40px 20px', 
      textAlign: 'center', 
      maxWidth: '800px', 
      margin: '0 auto' 
    }}>
      <h1>Oops! Something went wrong</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '4px',
        marginTop: '20px',
        textAlign: 'left',
        overflow: 'auto'
      }}>
        {error instanceof Error ? (
          <pre>{error.message}</pre>
        ) : (
          <p>Unknown error occurred</p>
        )}
      </div>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Go Home
        </button>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

// Loading component
const Loading = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    Loading...
  </div>
);

// Define the router with our routes
const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <Suspense fallback={<Loading />}><Home /></Suspense>,
    errorElement: <ErrorPage />
  },
  {
    path: '/login',
    element: <Suspense fallback={<Loading />}><Login /></Suspense>,
    errorElement: <ErrorPage />
  },
  
  // Protected routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ErrorBoundary>
          <Layout />
        </ErrorBoundary>
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'dashboard',
        element: <Suspense fallback={<Loading />}><Dashboard /></Suspense>
      },
      {
        path: 'patients',
        element: <Suspense fallback={<Loading />}><PatientList /></Suspense>
      },
      {
        path: 'patients/:patientId',
        element: <Suspense fallback={<Loading />}><PatientDetail /></Suspense>
      },
      {
        path: 'patients/:patientId/chart',
        element: <Suspense fallback={<Loading />}><PatientChart /></Suspense>
      },
      {
        path: 'patients/:patientId/perio',
        element: <Suspense fallback={<Loading />}><PatientPerioChart /></Suspense>
      },
      {
        path: 'patients/:patientId/perio-enhanced',
        element: <Suspense fallback={<Loading />}><EnhancedPatientPerioChart /></Suspense>
      },
      {
        path: 'patients/:patientId/x-rays/view',
        element: <Suspense fallback={<Loading />}><XRayViewer /></Suspense>
      },
      {
        path: 'patients/:patientId/x-rays/upload',
        element: <Suspense fallback={<Loading />}><SafeXRayUpload /></Suspense>
      },
      {
        path: 'patients/:patientId/appointments/new',
        element: <Suspense fallback={<Loading />}><ScheduleAppointmentPage /></Suspense>
      },
      {
        path: 'settings',
        element: <Suspense fallback={<Loading />}><Settings /></Suspense>
      },
      {
        path: 'ai-dashboard',
        element: <Suspense fallback={<Loading />}><AIDashboard /></Suspense>
      },
      {
        path: 'ai-hub',
        element: <Suspense fallback={<Loading />}><AIHub /></Suspense>
      },
      {
        path: 'dental-chart-demo',
        element: <Suspense fallback={<Loading />}><DentalChartDemo /></Suspense>
      },
      {
        path: 'ai/diagnosis',
        element: <Suspense fallback={<Loading />}><Navigate to="/ai-dashboard" replace /></Suspense>
      },
      {
        path: 'ai/xray',
        element: <Suspense fallback={<Loading />}><Navigate to="/ai-dashboard" replace /></Suspense>
      },
      {
        path: 'ai/new-analysis',
        element: <Suspense fallback={<Loading />}><Navigate to="/ai-dashboard" replace /></Suspense>
      },
      {
        path: 'ai/treatment-plan',
        element: <Suspense fallback={<Loading />}><Navigate to="/ai-dashboard" replace /></Suspense>
      },
      {
        path: 'ai/reports',
        element: <Suspense fallback={<Loading />}><Navigate to="/ai-dashboard" replace /></Suspense>
      },
      {
        path: 'ai/chat',
        element: <Suspense fallback={<Loading />}><Navigate to="/ai-dashboard" replace /></Suspense>
      },
    ]
  },
  // Catch all other routes and redirect to home
  {
    path: '*',
    element: <Navigate to="/" replace />,
    errorElement: <ErrorPage />
  }
]);

// Main Router component
const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter; 