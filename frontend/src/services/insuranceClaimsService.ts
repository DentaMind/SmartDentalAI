import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Enums
export enum ClaimStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    RECEIVED = 'RECEIVED',
    PROCESSING = 'PROCESSING',
    PAID = 'PAID',
    DENIED = 'DENIED',
    APPEALED = 'APPEALED',
    REJECTED = 'REJECTED',
    VOIDED = 'VOIDED'
}

export enum ClaimType {
    INITIAL = 'INITIAL',
    SUPPLEMENTAL = 'SUPPLEMENTAL',
    CORRECTION = 'CORRECTION',
    APPEAL = 'APPEAL'
}

// Interfaces
export interface ClaimProcedure {
    procedure_code: string;
    description: string;
    tooth_number?: string;
    surface?: string;
    fee: number;
    date_of_service: string;
    provider_id: string;
    notes?: string;
}

export interface InsuranceClaim {
    id: string;
    patient_id: string;
    treatment_plan_id: string;
    insurance_provider_id: string;
    claim_type: ClaimType;
    status: ClaimStatus;
    procedures: ClaimProcedure[];
    total_amount: number;
    submitted_date?: string;
    received_date?: string;
    processed_date?: string;
    paid_date?: string;
    paid_amount?: number;
    denial_reason?: string;
    appeal_date?: string;
    appeal_status?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface ClaimProcedureCreate {
    procedure_code: string;
    description: string;
    tooth_number?: string;
    surface?: string;
    fee: number;
    date_of_service: string;
    provider_id: string;
    notes?: string;
}

export interface InsuranceClaimCreate {
    patient_id: string;
    treatment_plan_id: string;
    insurance_provider_id: string;
    procedures: ClaimProcedureCreate[];
    claim_type?: ClaimType;
    notes?: string;
}

export interface ClaimStatusUpdate {
    status: ClaimStatus;
    paid_amount?: number;
    denial_reason?: string;
}

export interface ClaimAppeal {
    appeal_reason: string;
    supporting_docs: string[];
}

// WebSocket event types
export interface ClaimStatusUpdateEvent {
    type: 'status_updated';
    claim_id: string;
    status: ClaimStatus;
}

export interface ClaimErrorEvent {
    type: 'error';
    message: string;
}

export type ClaimWebSocketEvent = ClaimStatusUpdateEvent | ClaimErrorEvent;

class InsuranceClaimsService {
    private socket: Socket | null = null;
    private eventHandlers: Map<string, (event: ClaimWebSocketEvent) => void> = new Map();

    constructor() {
        this.connectWebSocket = this.connectWebSocket.bind(this);
        this.disconnectWebSocket = this.disconnectWebSocket.bind(this);
    }

    // WebSocket methods
    connectWebSocket(clinicId: string, onEvent: (event: ClaimWebSocketEvent) => void): void {
        if (this.socket) {
            this.disconnectWebSocket();
        }

        this.socket = io(`/ws/claims/${clinicId}`, {
            path: '/socket.io',
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        const handlerId = Date.now().toString();
        this.eventHandlers.set(handlerId, onEvent);

        this.socket.on('connect', () => {
            console.log('Connected to claims WebSocket');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from claims WebSocket');
        });

        this.socket.on('status_updated', (data: ClaimStatusUpdateEvent) => {
            onEvent(data);
        });

        this.socket.on('error', (data: ClaimErrorEvent) => {
            onEvent(data);
        });

        return () => {
            this.eventHandlers.delete(handlerId);
            if (this.eventHandlers.size === 0) {
                this.disconnectWebSocket();
            }
        };
    }

    disconnectWebSocket(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.eventHandlers.clear();
        }
    }

    // API methods
    async createClaim(claimData: InsuranceClaimCreate): Promise<InsuranceClaim> {
        try {
            const response = await axios.post('/api/claims', claimData);
            return response.data;
        } catch (error) {
            console.error('Error creating claim:', error);
            throw error;
        }
    }

    async submitClaim(claimId: string): Promise<InsuranceClaim> {
        try {
            const response = await axios.post(`/api/claims/${claimId}/submit`);
            return response.data;
        } catch (error) {
            console.error('Error submitting claim:', error);
            throw error;
        }
    }

    async updateClaimStatus(
        claimId: string,
        statusUpdate: ClaimStatusUpdate
    ): Promise<InsuranceClaim> {
        try {
            const response = await axios.put(
                `/api/claims/${claimId}/status`,
                statusUpdate
            );
            return response.data;
        } catch (error) {
            console.error('Error updating claim status:', error);
            throw error;
        }
    }

    async appealClaim(
        claimId: string,
        appealData: ClaimAppeal
    ): Promise<InsuranceClaim> {
        try {
            const response = await axios.post(
                `/api/claims/${claimId}/appeal`,
                appealData
            );
            return response.data;
        } catch (error) {
            console.error('Error appealing claim:', error);
            throw error;
        }
    }

    async getClaim(claimId: string): Promise<InsuranceClaim> {
        try {
            const response = await axios.get(`/api/claims/${claimId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting claim:', error);
            throw error;
        }
    }

    async getPatientClaims(patientId: string): Promise<InsuranceClaim[]> {
        try {
            const response = await axios.get(`/api/patients/${patientId}/claims`);
            return response.data;
        } catch (error) {
            console.error('Error getting patient claims:', error);
            throw error;
        }
    }

    async getTreatmentPlanClaims(
        treatmentPlanId: string
    ): Promise<InsuranceClaim[]> {
        try {
            const response = await axios.get(
                `/api/treatment-plans/${treatmentPlanId}/claims`
            );
            return response.data;
        } catch (error) {
            console.error('Error getting treatment plan claims:', error);
            throw error;
        }
    }

    async getClaimsByStatus(status: ClaimStatus): Promise<InsuranceClaim[]> {
        try {
            const response = await axios.get(`/api/claims/status/${status}`);
            return response.data;
        } catch (error) {
            console.error('Error getting claims by status:', error);
            throw error;
        }
    }

    async getClaimsByDateRange(
        startDate: string,
        endDate: string
    ): Promise<InsuranceClaim[]> {
        try {
            const response = await axios.get('/api/claims', {
                params: { start_date: startDate, end_date: endDate }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting claims by date range:', error);
            throw error;
        }
    }
}

export const insuranceClaimsService = new InsuranceClaimsService(); 