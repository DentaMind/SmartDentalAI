import React, { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster, ToastProvider } from "./components/ui/toaster";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Import pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import NoMatch from "./pages/NoMatch";
import PatientsPage from "./pages/PatientsPage";
import Layout from "./components/Layout";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={{}}>
        <CssBaseline />
        <HelmetProvider>
          <ToastProvider>
            <AuthProvider>
              <Router>
                <AppRoutes />
              </Router>
            </AuthProvider>
          </ToastProvider>
        </HelmetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// App routes
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/patients" element={
        <ProtectedRoute>
          <Layout>
            <PatientsPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
};

export default App;