import React, { Suspense, lazy, useState, useEffect, useCallback } from "react";
import { Switch, Route, Navigate } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import PatientsPage from "@/pages/patients-page";
import PatientListPage from "@/pages/patient-list-page";
import AppointmentsPage from "@/pages/appointments-page";
import TreatmentPlansPage from "@/pages/treatment-plans-page";
import AIDiagnosticsPage from "@/pages/ai-diagnostics";
import InteractiveDiagnosisPage from "@/pages/interactive-diagnosis";
import BillingPage from "@/pages/billing";
import TimeClockPage from "@/pages/time-clock-page";
import { ProtectedRoute } from "./lib/protected-route";
import FinancialDashboardPage from "./pages/financial-dashboard";
import DashboardPage from "@/pages/dashboard-page";
import PatientProfilePage from "@/pages/patient-profile-page";
import { WebSocketProvider } from "./hooks/use-websocket";
import { AIAssistant } from "@/components/ui/ai-assistant";
import AIHubPage from "@/pages/ai-hub-page";
import AIRecommendationsPage from "@/pages/ai-recommendations";
import PrescriptionsPage from "@/pages/prescriptions";
import PostOpInstructionsPage from "@/pages/post-op-instructions-page";
import AppointmentRequestPage from "@/pages/appointment-request-page";
import UnifiedEmailPage from "@/pages/unified-email-page";
import EmailIntegrationPage from "@/pages/email-integration-page";
import XRayFMXPage from "@/pages/xray-fmx-page";
import XRayComparisonTestPage from "@/pages/xray-comparison-test";
import FormPage from "@/pages/form-page";
import FormSubmittedPage from "@/pages/form-submitted-page";
import LabsSuppliesPage from "@/pages/labs-supplies-page";
import DebugAuthPage from "@/pages/debug-auth";
import AssistantTrainingPage from "@/pages/assistant-training-page";
import TrainingDashboardPage from "@/pages/training-dashboard-page";
import { CrownBridgePage } from './pages/CrownBridgePage';
import PatientCases from './pages/patient/PatientCases';
import { SplashScreen } from './components/SplashScreen';
import { BrandedTransitions } from './components/BrandedTransitions';
import { useAppTransitions } from './hooks/useAppTransitions';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { AIAssistantView } from './views/AIAssistantView';
import { BrandedLoading } from './components/BrandedLoading';

// Lazy-loaded components
const AIHub = lazy(() => import('./pages/ai-hub'));
const OrthodonticDashboard = lazy(() => import('./pages/orthodontic-dashboard'));
const DentalAIHub = lazy(() => import('./pages/dental-ai-hub'));
const SubscriptionPage = lazy(() => import('./pages/subscription-page'));

// Component wrappers for lazy-loaded and FC components to fix TypeScript issues
const AIHubWrapper = () => <AIHub />;
const OrthodonticDashboardWrapper = () => <OrthodonticDashboard />;
const DentalAIHubWrapper = () => <DentalAIHub />;
const SubscriptionPageWrapper = () => <SubscriptionPage />;
const EmailIntegrationWrapper = () => <EmailIntegrationPage />;
const XRayFMXWrapper = () => <XRayFMXPage />;
const XRayComparisonTestWrapper = () => <XRayComparisonTestPage />;

// Replace the Loading component with our new branded version
const Loading = () => (
  <BrandedLoading
    type="fullscreen"
    message="Loading DentaMind"
    size="large"
    delay={500}
  />
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  const {
    currentView,
    isAnimating,
    transition,
    skipTransitions
  } = useAppTransitions({
    initialView: 'splash',
    transitionDuration: 700,
    onTransitionComplete: (view) => {
      console.log(`Transitioned to ${view}`);
    }
  });

  const handleSplashComplete = useCallback(() => {
    transition('login');
  }, [transition]);

  const handleLoginSuccess = useCallback(() => {
    transition('dashboard');
  }, [transition]);

  const handleAIAssistantOpen = useCallback(() => {
    transition('ai');
  }, [transition]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'splash':
        return <SplashScreen onAnimationComplete={handleSplashComplete} />;
      case 'login':
        return <LoginView onSuccess={handleLoginSuccess} />;
      case 'dashboard':
        return <DashboardView onAIAssistantOpen={handleAIAssistantOpen} />;
      case 'ai':
        return <AIAssistantView />;
      default:
        return null;
    }
  };

  // Development mode shortcut
  if (process.env.NODE_ENV === 'development') {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        skipTransitions();
      }
    });
  }

  return (
    <Suspense fallback={<Loading />}>
      <BrandedTransitions
        currentView={currentView}
        isAnimating={isAnimating}
      >
        {renderCurrentView()}
      </BrandedTransitions>
    </Suspense>
  );
};

function App() {
  const isAuthPage = window.location.pathname.includes('/auth');
  const isFormPage = window.location.pathname.includes('/form');
  const hideAssistant = isAuthPage || isFormPage;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WebSocketProvider>
            <div className="min-h-screen bg-white">
              <AppContent />
              <Toaster />
              {!hideAssistant && <AIAssistant />}
            </div>
          </WebSocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;