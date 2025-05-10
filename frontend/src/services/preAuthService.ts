import axios from 'axios';

export enum PreAuthStatus {
    NOT_REQUIRED = 'NOT_REQUIRED',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DENIED = 'DENIED'
}

export interface PreAuthHistoryEntry {
    date: string;
    status: PreAuthStatus;
    notes?: string;
}

export interface PreAuthRequest {
    id: string;
    treatment_plan_id: string;
    procedure_code: string;
    status: PreAuthStatus;
    submitted_date: string;
    response_date?: string;
    insurance_provider: string;
    reference_number?: string;
    notes?: string;
    history: PreAuthHistoryEntry[];
}

export interface PreAuthRequestCreate {
    treatment_plan_id: string;
    procedure_code: string;
    insurance_provider: string;
    notes?: string;
}

export interface PreAuthRequestUpdate {
    status: PreAuthStatus;
    notes?: string;
    reference_number?: string;
}

const preAuthService = {
    async createRequest(request: PreAuthRequestCreate): Promise<PreAuthRequest> {
        try {
            const response = await axios.post('/api/pre-auth', request);
            return response.data;
        } catch (error) {
            console.error('Error creating pre-authorization request:', error);
            throw error;
        }
    },

    async getRequest(requestId: string): Promise<PreAuthRequest> {
        try {
            const response = await axios.get(`/api/pre-auth/${requestId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching pre-authorization request:', error);
            throw error;
        }
    },

    async getRequestsByTreatmentPlan(treatmentPlanId: string): Promise<PreAuthRequest[]> {
        try {
            const response = await axios.get(`/api/pre-auth/treatment-plan/${treatmentPlanId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching pre-authorization requests by treatment plan:', error);
            throw error;
        }
    },

    async updateRequest(requestId: string, update: PreAuthRequestUpdate): Promise<PreAuthRequest> {
        try {
            const response = await axios.put(`/api/pre-auth/${requestId}`, update);
            return response.data;
        } catch (error) {
            console.error('Error updating pre-authorization request:', error);
            throw error;
        }
    },

    async getAllRequests(): Promise<PreAuthRequest[]> {
        try {
            const response = await axios.get('/api/pre-auth');
            return response.data;
        } catch (error) {
            console.error('Error fetching all pre-authorization requests:', error);
            throw error;
        }
    },

    async getRequestsByStatus(status: PreAuthStatus): Promise<PreAuthRequest[]> {
        try {
            const response = await axios.get(`/api/pre-auth/status/${status}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching pre-authorization requests by status:', error);
            throw error;
        }
    },

    async getRequestsByProvider(provider: string): Promise<PreAuthRequest[]> {
        try {
            const response = await axios.get(`/api/pre-auth/provider/${provider}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching pre-authorization requests by provider:', error);
            throw error;
        }
    }
};

export default preAuthService; 