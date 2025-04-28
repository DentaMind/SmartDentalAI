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

const { Content } = Layout;

const App: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            {user ? (
                <Layout style={{ minHeight: '100vh' }}>
                    <Sidebar />
                    <Layout>
                        <Header />
                        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                            <Routes>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/claims/*" element={<InsuranceClaimsRoutes />} />
                                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Content>
                    </Layout>
                </Layout>
            ) : (
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            )}
        </Router>
    );
};

export default App; 