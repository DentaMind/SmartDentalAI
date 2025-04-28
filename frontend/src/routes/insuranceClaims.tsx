import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import InsuranceClaimsPage from '../pages/InsuranceClaimsPage';
import ClaimDetailsPage from '../pages/ClaimDetailsPage';
import CreateClaimPage from '../pages/CreateClaimPage';

const InsuranceClaimsRoutes: React.FC = () => {
    const { user } = useAuth();

    // Check if user has required role
    const hasAccess = user?.roles?.some(role => 
        ['admin', 'financial_manager', 'insurance_coordinator'].includes(role)
    );

    if (!hasAccess) {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <Routes>
            <Route path="/" element={<InsuranceClaimsPage />} />
            <Route path="/create" element={<CreateClaimPage />} />
            <Route path="/create/:patientId" element={<CreateClaimPage />} />
            <Route path="/create/:patientId/:treatmentPlanId" element={<CreateClaimPage />} />
            <Route path="/:claimId" element={<ClaimDetailsPage />} />
            <Route path="*" element={<Navigate to="/claims" replace />} />
        </Routes>
    );
};

export default InsuranceClaimsRoutes; 