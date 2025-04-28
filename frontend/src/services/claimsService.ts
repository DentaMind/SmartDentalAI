import axios from 'axios';
import { InsuranceClaim, ClaimAppeal, ClaimFilters } from '../types/claims';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const claimsService = {
    // Get all claims with optional filters
    async getClaims(filters?: ClaimFilters): Promise<InsuranceClaim[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/claims`, {
                params: filters
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching claims:', error);
            throw error;
        }
    },

    // Get a single claim by ID
    async getClaim(claimId: string): Promise<InsuranceClaim> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/claims/${claimId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching claim:', error);
            throw error;
        }
    },

    // Create a new claim
    async createClaim(claim: Omit<InsuranceClaim, 'id' | 'status' | 'submissionDate'>): Promise<InsuranceClaim> {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/claims`, claim);
            return response.data;
        } catch (error) {
            console.error('Error creating claim:', error);
            throw error;
        }
    },

    // Submit a claim
    async submitClaim(claimId: string): Promise<InsuranceClaim> {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/claims/${claimId}/submit`);
            return response.data;
        } catch (error) {
            console.error('Error submitting claim:', error);
            throw error;
        }
    },

    // Update claim status
    async updateClaimStatus(
        claimId: string,
        status: string,
        paymentAmount?: number,
        denialReason?: string
    ): Promise<InsuranceClaim> {
        try {
            const response = await axios.put(`${API_BASE_URL}/api/claims/${claimId}/status`, {
                status,
                paymentAmount,
                denialReason
            });
            return response.data;
        } catch (error) {
            console.error('Error updating claim status:', error);
            throw error;
        }
    },

    // Appeal a denied claim
    async appealClaim(claimId: string, appeal: ClaimAppeal): Promise<InsuranceClaim> {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/claims/${claimId}/appeal`, appeal);
            return response.data;
        } catch (error) {
            console.error('Error appealing claim:', error);
            throw error;
        }
    },

    // Get claims by patient ID
    async getPatientClaims(patientId: string): Promise<InsuranceClaim[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/claims/patient/${patientId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching patient claims:', error);
            throw error;
        }
    },

    // Get claims by treatment plan ID
    async getTreatmentPlanClaims(treatmentPlanId: string): Promise<InsuranceClaim[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/claims/treatment-plan/${treatmentPlanId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching treatment plan claims:', error);
            throw error;
        }
    },

    // Export claims to CSV
    async exportClaims(filters?: ClaimFilters): Promise<Blob> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/claims/export`, {
                params: filters,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting claims:', error);
            throw error;
        }
    }
};

export default claimsService; 