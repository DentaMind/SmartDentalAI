import React, { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import PatientsPage from "@/pages/patients-page";
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

// Loading fallback
const Loading = () => <div className="flex items-center justify-center h-screen">Loading...</div>;

function Router() {
  return (
    <Suspense fallback={<Loading />}>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/signup" component={AuthPage} />
        <Route path="/auth/subscription" component={SubscriptionPageWrapper} />
        <Route path="/form/:formToken" component={FormPage} />
        <Route path="/form-submitted" component={FormSubmittedPage} />
        <ProtectedRoute path="/" component={AppointmentsPage} />
        <ProtectedRoute path="/dashboard" component={AppointmentsPage} />
        <ProtectedRoute path="/patients" component={PatientsPage} />
        <ProtectedRoute path="/patients/:id" component={PatientProfilePage} />
        <ProtectedRoute path="/appointments" component={AppointmentsPage} />
        <ProtectedRoute path="/treatment-plans" component={TreatmentPlansPage} />
        <ProtectedRoute path="/ai-diagnostics" component={AIDiagnosticsPage} />
        <ProtectedRoute path="/interactive-diagnosis" component={InteractiveDiagnosisPage} />
        <ProtectedRoute path="/billing" component={BillingPage} />
        <ProtectedRoute path="/time-clock" component={TimeClockPage} />
        <ProtectedRoute path="/ai-hub" component={AIHubPage} />
        <ProtectedRoute path="/ai-hub/:patientId" component={AIHubPage} />
        <ProtectedRoute path="/ai-hub-old" component={AIHubWrapper} />
        <ProtectedRoute path="/orthodontic-dashboard" component={OrthodonticDashboardWrapper} />
        <ProtectedRoute path="/dental-ai-hub" component={DentalAIHubWrapper} />
        <ProtectedRoute path="/ai-recommendations" component={AIRecommendationsPage} />
        <ProtectedRoute path="/financial" component={FinancialDashboardPage} />
        <ProtectedRoute path="/financial-dashboard" component={FinancialDashboardPage} />
        <ProtectedRoute path="/prescriptions" component={PrescriptionsPage} />
        <ProtectedRoute path="/post-op-instructions" component={PostOpInstructionsPage} />
        <ProtectedRoute path="/appointment-request" component={AppointmentRequestPage} />
        <ProtectedRoute path="/email" component={UnifiedEmailPage} />
        <ProtectedRoute path="/email-integration" component={EmailIntegrationWrapper} />
        <ProtectedRoute path="/xray-fmx" component={XRayFMXWrapper} />
        <ProtectedRoute path="/xray-fmx/:patientId" component={XRayFMXWrapper} />
        <ProtectedRoute path="/xray-comparison-test" component={XRayComparisonTestWrapper} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Check if we're on auth or form pages, don't show assistant there
  const isAuthPage = window.location.pathname.includes('/auth');
  const isFormPage = window.location.pathname.includes('/form');
  const hideAssistant = isAuthPage || isFormPage;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router />
          <Toaster />
          {!hideAssistant && <AIAssistant />}
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;