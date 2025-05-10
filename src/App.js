import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Layout Components
import Navigation from './components/Navigation/Navigation';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

// Auth Components
import Login from './components/Login/Login';

// Main Pages
import Dashboard from './components/DashBoard/DashBoard';

// Patient Management
import Patient from './components/Patient/Patient'; 
import AddPatient from './components/AddPatient/AddPatient';
import SearchPatient from './components/SearchPatient/SearchPatient';

// Appointments
import Appointments from './components/Rendezvous/Rendezvous';

// Treatment Components
import TreatmentPlans from './pages/TreatmentPlans/TreatmentPlans';
import TreatmentPlanDetails from './pages/TreatmentPlans/TreatmentPlanDetails';
import NewTreatmentPlan from './pages/TreatmentPlans/NewTreatmentPlan';

// Placeholder pages for new sections
import PerioChart from './pages/PerioChart/PerioChart';
import RestorativeChart from './pages/RestorativeChart/RestorativeChart';
import XRayViewer from './pages/XRayViewer/XRayViewer';
import AIDiagnosis from './pages/AI/AIDiagnosis';
import VoiceAssistant from './pages/AI/VoiceAssistant';
import ClinicalNotes from './pages/ClinicalNotes/ClinicalNotes';

// Settings
import Settings from './components/Configuration/Configuration';

// Context Providers
import { TreatmentProvider } from './contexts/TreatmentContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you would verify the token with your backend
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (status) => {
    setIsAuthenticated(status);
  };

  return (
    <AuthProvider>
      <TreatmentProvider>
        <Router>
          {isAuthenticated ? (
            <div className="app-container">
              <Navigation connected={isAuthenticated} />
              <div id="right-panel" className="right-panel">
                <Header connected={isAuthenticated} handleClick={handleLogin} />
                <div className="content">
                  <div className="animated fadeIn">
                    <div className="row">
                      <Routes>
                        {/* Dashboard */}
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        
                        {/* Patient Management */}
                        <Route path="/patients" element={<Patient />} />
                        <Route path="/patients/add" element={<AddPatient />} />
                        <Route path="/patients/search" element={<SearchPatient />} />
                        <Route path="/patients/:patientId" element={<Patient />} />
                        
                        {/* Appointments */}
                        <Route path="/appointments" element={<Appointments />} />
                        <Route path="/appointments/add" element={<Appointments />} />
                        <Route path="/appointments/upcoming" element={<Appointments />} />
                        
                        {/* Treatment Plans */}
                        <Route path="/treatment-plans" element={<TreatmentPlans />} />
                        <Route path="/treatment-plans/new" element={<NewTreatmentPlan />} />
                        <Route path="/patients/:patientId/treatment-plans/new" element={<NewTreatmentPlan />} />
                        <Route path="/patients/:patientId/treatment-plans/:planId" element={<TreatmentPlanDetails />} />
                        
                        {/* Clinical */}
                        <Route path="/perio-chart" element={<PerioChart />} />
                        <Route path="/perio-chart/:patientId" element={<PerioChart />} />
                        <Route path="/restorative-chart" element={<RestorativeChart />} />
                        <Route path="/restorative-chart/:patientId" element={<RestorativeChart />} />
                        <Route path="/clinical-notes" element={<ClinicalNotes />} />
                        <Route path="/clinical-notes/:patientId" element={<ClinicalNotes />} />
                        
                        {/* X-Rays */}
                        <Route path="/xrays" element={<XRayViewer />} />
                        <Route path="/xrays/upload" element={<XRayViewer upload={true} />} />
                        <Route path="/xrays/ai-analysis" element={<XRayViewer analysis={true} />} />
                        <Route path="/xrays/:patientId" element={<XRayViewer />} />
                        
                        {/* AI Hub */}
                        <Route path="/ai/diagnosis" element={<AIDiagnosis />} />
                        <Route path="/ai/treatment-suggestions" element={<AIDiagnosis suggestions={true} />} />
                        <Route path="/ai/voice-assistant" element={<VoiceAssistant />} />
                        
                        {/* Settings */}
                        <Route path="/settings" element={<Settings />} />
                        
                        {/* Legacy Routes */}
                        <Route path="/configuration" element={<Settings />} />
                        <Route path="/rendezvous" element={<Navigate to="/appointments" />} />
                      </Routes>
                    </div>
                  </div>
                </div>
                <Footer connected={isAuthenticated} />
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="*" element={<Login handleClick={handleLogin} />} />
            </Routes>
          )}
        </Router>
      </TreatmentProvider>
    </AuthProvider>
  );
}

export default App; 