import axios from 'axios';
import { TreatmentPlan, TreatmentStatus } from './types';
import { ProposedEdit, EditStatus } from './types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export enum TreatmentPriority {
    URGENT = 'URGENT',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}

export interface TreatmentProcedure {
    code: string;
    description: string;
    tooth_numbers: string[];
    surfaces: string[];
    priority: TreatmentPriority;
    estimated_duration: number;
    estimated_cost: number;
    insurance_coverage?: number;
    notes?: string;
    requires_pre_auth?: boolean;
    pre_auth_status?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'DENIED';
    pre_auth_reference?: string;
}

export interface TreatmentPlanRequest {
    patient_id: string;
    procedures: TreatmentProcedureRequest[];
    notes?: string;
}

export interface TreatmentPlanUpdateRequest {
    procedures?: TreatmentProcedureRequest[];
    status?: TreatmentStatus;
    notes?: string;
    approved_by?: string;
}

export interface ProposedEditCreate {
    reason: string;
    changes: {
        added?: Array<{
            code: string;
            description: string;
            cost: number;
            quantity: number;
        }>;
        modified?: Array<{
            code: string;
            description: string;
            cost: number;
            quantity: number;
        }>;
        removed?: Array<{
            code: string;
            description: string;
        }>;
    };
}

export interface EditReviewRequest {
    status: EditStatus;
    notes: string;
}

class TreatmentService {
    private static instance: TreatmentService;
    private ws: WebSocket | null = null;

    private constructor() {}

    public static getInstance(): TreatmentService {
        if (!TreatmentService.instance) {
            TreatmentService.instance = new TreatmentService();
        }
        return TreatmentService.instance;
    }

    async createTreatmentPlan(request: TreatmentPlanRequest, createdBy: string): Promise<TreatmentPlan> {
        try {
            const response = await axios.post('/api/treatment/treatment-plans', request, {
                params: { created_by: createdBy }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to create treatment plan');
            }
            throw error;
        }
    }

    async getTreatmentPlan(planId: string): Promise<TreatmentPlan> {
        try {
            const response = await axios.get(`/api/treatment/treatment-plans/${planId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to fetch treatment plan');
            }
            throw error;
        }
    }

    async getPatientTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
        try {
            const response = await axios.get(`/api/treatment/patients/${patientId}/treatment-plans`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to fetch patient treatment plans');
            }
            throw error;
        }
    }

    async updateTreatmentPlan(planId: string, request: TreatmentPlanUpdateRequest): Promise<TreatmentPlan> {
        try {
            const response = await axios.put(`/api/treatment/treatment-plans/${planId}`, request);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to update treatment plan');
            }
            throw error;
        }
    }

    async deleteTreatmentPlan(planId: string): Promise<void> {
        try {
            await axios.delete(`/api/treatment/treatment-plans/${planId}`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to delete treatment plan');
            }
            throw error;
        }
    }

    async proposeEdit(planId: string, edit: ProposedEditCreate): Promise<ProposedEdit> {
        try {
            const response = await axios.post(`${API_URL}/treatment-plans/${planId}/propose-edit`, edit);
            return response.data;
        } catch (error) {
            console.error('Error proposing edit:', error);
            throw error;
        }
    }

    async reviewEdit(planId: string, editId: string, review: EditReviewRequest): Promise<ProposedEdit> {
        try {
            const response = await axios.post(
                `${API_URL}/treatment-plans/${planId}/review-edit/${editId}`,
                review
            );
            return response.data;
        } catch (error) {
            console.error('Error reviewing edit:', error);
            throw error;
        }
    }

    async getProposedEdits(planId: string): Promise<ProposedEdit[]> {
        try {
            const response = await axios.get(`${API_URL}/treatment-plans/${planId}/proposed-edits`);
            return response.data;
        } catch (error) {
            console.error('Error fetching proposed edits:', error);
            throw error;
        }
    }

    async lockFinancialFields(planId: string): Promise<void> {
        try {
            await axios.post(`${API_URL}/treatment-plans/${planId}/lock-financials`);
        } catch (error) {
            console.error('Error locking financial fields:', error);
            throw error;
        }
    }

    connectToEditWebSocket(planId: string, onEditUpdate: (edit: ProposedEdit) => void): void {
        if (this.ws) {
            this.ws.close();
        }

        const token = localStorage.getItem('token');
        this.ws = new WebSocket(`${API_URL.replace('http', 'ws')}/ws/treatment-plans/${planId}/edits?token=${token}`);

        this.ws.onmessage = (event) => {
            const edit = JSON.parse(event.data);
            onEditUpdate(edit);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }

    disconnectFromEditWebSocket(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export default TreatmentService.getInstance(); 