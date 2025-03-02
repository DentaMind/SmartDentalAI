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
import FinancialDashboardPage from "./pages/financial-dashboard"; // Added import
// Placeholder components -  These need to be implemented
const AIDashboardPage = () => <div>AI Dashboard (Under Construction)</div>;
const LoginPage = () => <div>Login Page (Placeholder)</div>; // Added placeholder


function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/patients" component={PatientsPage} />
      <ProtectedRoute path="/appointments" component={AppointmentsPage} />
      <ProtectedRoute path="/treatment-plans" component={TreatmentPlansPage} />
      <ProtectedRoute path="/ai-diagnostics" component={AIDiagnosticsPage} />
      <ProtectedRoute path="/billing" component={BillingPage} />
      <Route path="/ai-dashboard" component={AIDashboardPage} />
      <Route path="/ai-hub" component={() => import('./pages/ai-hub').then(m => <m.default />)} />
      <Route path="/orthodontic-dashboard" component={() => import('./pages/orthodontic-dashboard').then(m => <m.default />)} />
      <Route path="/dental-ai-hub" component={() => import('./pages/dental-ai-hub').then(m => <m.default />)} />
      <Route path="/financial" component={FinancialDashboardPage} /> {/* Added financial dashboard route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;