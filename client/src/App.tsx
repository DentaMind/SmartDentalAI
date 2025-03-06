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
import BillingPage from "@/pages/billing";
import { ProtectedRoute } from "./lib/protected-route";
import FinancialDashboardPage from "./pages/financial-dashboard";
import { WebSocketProvider } from "./hooks/use-websocket";

// Placeholder component
const AIDashboardPage = () => <div>AI Dashboard (Under Construction)</div>;

// Lazy-loaded components
const AIHub = lazy(() => import('./pages/ai-hub'));
const OrthodonticDashboard = lazy(() => import('./pages/orthodontic-dashboard'));
const DentalAIHub = lazy(() => import('./pages/dental-ai-hub'));

// Loading fallback
const Loading = () => <div className="flex items-center justify-center h-screen">Loading...</div>;

function Router() {
  return (
    <Suspense fallback={<Loading />}>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/patients" component={PatientsPage} />
        <ProtectedRoute path="/appointments" component={AppointmentsPage} />
        <ProtectedRoute path="/treatment-plans" component={TreatmentPlansPage} />
        <ProtectedRoute path="/ai-diagnostics" component={AIDiagnosticsPage} />
        <ProtectedRoute path="/billing" component={BillingPage} />
        <Route path="/ai-dashboard" component={AIDashboardPage} />
        <Route path="/ai-hub" component={AIHub} />
        <Route path="/orthodontic-dashboard" component={OrthodonticDashboard} />
        <Route path="/dental-ai-hub" component={DentalAIHub} />
        <Route path="/financial" component={FinancialDashboardPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router />
          <Toaster />
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;