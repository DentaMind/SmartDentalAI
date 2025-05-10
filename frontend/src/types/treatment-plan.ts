export type TreatmentStatus = 'planned' | 'accepted' | 'rejected' | 'completed';
export type TreatmentPhase = 'urgent' | 'phase_1' | 'phase_2' | 'maintenance';

export interface TreatmentProcedure {
    id: string;
    cdt_code: string;
    description: string;
    tooth_number?: string;
    surface?: string;
    phase: TreatmentPhase;
    fee: number;
    insurance_covered: number;
    patient_responsibility: number;
    status: TreatmentStatus;
    completed_date?: string;
    clinical_notes?: string;
    preauth_required: boolean;
}

export interface TreatmentPlan {
    id: string;
    patient_id: string;
    created_at: string;
    updated_at: string;
    procedures: TreatmentProcedure[];
}

export interface TreatmentPlanSummary {
    total_treatment_fee: number;
    total_insurance_coverage: number;
    total_patient_responsibility: number;
    procedures_requiring_preauth: number;
    procedures_by_phase: Record<TreatmentPhase, number>;
}

export interface CreateTreatmentPlanRequest {
    patient_id: string;
    created_by: string;
    notes?: string;
    procedures?: Array<{
        cdt_code: string;
        description: string;
        tooth_number?: string;
        surface?: string;
        phase?: TreatmentPhase;
        fee: number;
        clinical_notes?: string;
        ai_findings?: string;
        radiographs?: string[];
    }>;
}

export interface AddProcedureRequest {
    cdt_code: string;
    description: string;
    tooth_number?: string;
    surface?: string;
    phase?: TreatmentPhase;
    fee: number;
    clinical_notes?: string;
    ai_findings?: string;
    radiographs?: string[];
}

export interface BenefitsCoverage {
    cdtCode: string;
    description: string;
    fee?: number;
    coverage_percentage: number;
    preauth_required: boolean;
    waiting_period_months: number;
    frequency_months?: number;
    annual_max_applies: boolean;
}

export interface BenefitsData {
    coverage: BenefitsCoverage[];
    annual_maximum: number;
    remaining_benefit: number;
    deductible: number;
    remaining_deductible: number;
} 