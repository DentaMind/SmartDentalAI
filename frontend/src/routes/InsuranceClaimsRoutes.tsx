import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import ClaimsListPage from '../pages/claims/ClaimsListPage';
import ClaimDetailsPage from '../pages/claims/ClaimDetailsPage';
import NewClaimPage from '../pages/claims/NewClaimPage';

const InsuranceClaimsRoutes: React.FC = () => {
    const { user } = useAuth();

    if (!user || !user.roles.includes('admin')) {
        return <UnauthorizedPage />;
    }

    return (
        <Routes>
            <Route path="/" element={<ClaimsListPage />} />
            <Route path="/new" element={<NewClaimPage />} />
            <Route path="/:claimId" element={<ClaimDetailsPage />} />
        </Routes>
    );
};

export default InsuranceClaimsRoutes; 