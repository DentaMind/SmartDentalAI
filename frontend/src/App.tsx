import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InsuranceClaimsRoutes from './routes/insuranceClaims';
import UnauthorizedPage from './pages/UnauthorizedPage';
import './App.css';
import RiskEvaluationPage from './pages/RiskEvaluationPage';
import SystemHealthPage from './pages/SystemHealthPage';
import MetricsAnalysisPage from './pages/MetricsAnalysisPage';
import AiOpsDashboard from './pages/AiOpsDashboard';
import TrainingOrchestrationPage from './pages/TrainingOrchestrationPage';
import CanaryDeploymentPage from './pages/CanaryDeploymentPage';
import TreatmentPlansPage from './pages/TreatmentPlansPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import FinancialArrangementPage from './pages/FinancialArrangementPage';
import AITrainingPage from './pages/ai-training';
import AIDiagnosticsPage from './pages/ai-diagnostics';
import WebSocketAnalyticsPage from './pages/admin/websocket-analytics';
import AIDiagnosticsAnalyticsPage from './pages/admin/ai-diagnostics-analytics';
import AIModelTrainingPage from './pages/admin/ai-model-training';
import { Navigation } from './components/Navigation';
import { ToastContainer } from './components/ui/toast';
import { AIModelProvider } from './contexts/AIModelContext';
import AITreatmentSuggestionsPage from './pages/ai-treatment-suggestions';

const { Content } = Layout;

const App: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AIModelProvider>
            <Router>
                <div className="flex h-screen bg-background">
                    <div className="w-64 border-r shrink-0">
                        <Navigation />
                    </div>
                    <div className="flex-1 overflow-auto">
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/claims/*" element={<InsuranceClaimsRoutes />} />
                            <Route path="/unauthorized" element={<UnauthorizedPage />} />
                            <Route path="/ai-training" element={<AITrainingPage />} />
                            <Route path="/ai-diagnostics" element={<AIDiagnosticsPage />} />
                            <Route path="/admin/websocket-analytics" element={<WebSocketAnalyticsPage />} />
                            <Route path="/admin/ai-diagnostics-analytics" element={<AIDiagnosticsAnalyticsPage />} />
                            <Route path="/admin/ai-model-training" element={<AIModelTrainingPage />} />
                            <Route path="/ai-treatment-suggestions" element={<AITreatmentSuggestionsPage />} />
                            <Route path="/patients/:patientId/ai-treatment-suggestions" element={<AITreatmentSuggestionsPage />} />
                            <Route path="/patients/:patientId/diagnoses/:diagnosisId/ai-treatment-suggestions" element={<AITreatmentSuggestionsPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </div>
                
                {/* Toast container for notifications */}
                <ToastContainer />
            </Router>
        </AIModelProvider>
    );
};

export default App; 