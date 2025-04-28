export enum ImmunizationType {
    HEPATITIS_B = 'hepatitis_b',
    INFLUENZA = 'influenza',
    TETANUS = 'tetanus',
    MMR = 'mmr',
    VARICELLA = 'varicella',
    COVID_19 = 'covid_19',
    OTHER = 'other'
}

export enum BloodWorkType {
    CBC = 'cbc',
    HBA1C = 'hba1c',
    VITAMIN_D = 'vitamin_d',
    CRP = 'crp',
    GLUCOSE = 'glucose',
    LIPID_PANEL = 'lipid_panel',
    OTHER = 'other'
}

export interface Immunization {
    id: string;
    patient_id: string;
    type: ImmunizationType;
    date_administered: string;
    next_due_date?: string;
    lot_number?: string;
    administered_by: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface BloodWorkResult {
    id: string;
    patient_id: string;
    type: BloodWorkType;
    date_taken: string;
    value: number;
    unit: string;
    reference_range: string;
    notes?: string;
    uploaded_by: string;
    created_at: string;
    updated_at: string;
}

export interface PatientHealthSummary {
    patient_id: string;
    immunizations: Immunization[];
    blood_work: BloodWorkResult[];
    last_updated: string;
    immunization_status: Record<ImmunizationType, {
        last_administered?: string;
        next_due?: string;
        is_current: boolean;
    }>;
    blood_work_trends: Record<BloodWorkType, {
        latest_value?: number;
        latest_date?: string;
        previous_value?: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    }>;
} 