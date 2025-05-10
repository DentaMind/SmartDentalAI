export enum ClaimStatus {
    SUBMITTED = 'SUBMITTED',
    PAID = 'PAID',
    DENIED = 'DENIED',
    APPEALED = 'APPEALED'
}

export interface ClaimProcedure {
    code: string;
    description: string;
    amount: number;
}

export interface InsuranceClaim {
    id: string;
    claimNumber: string;
    patientId: string;
    patientName: string;
    submissionDate: string;
    status: ClaimStatus;
    totalAmount: number;
    procedures: ClaimProcedure[];
    paymentDate?: string;
    paymentAmount?: number;
    denialReason?: string;
    appealReason?: string;
    appealDate?: string;
}

export interface ClaimAppeal {
    reason: string;
    additionalInfo?: string;
}

export interface ClaimFilters {
    status?: ClaimStatus;
    startDate?: string;
    endDate?: string;
    searchText?: string;
} 