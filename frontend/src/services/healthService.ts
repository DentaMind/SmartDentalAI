import axios from 'axios';
import { Immunization, ImmunizationType, BloodWorkResult, BloodWorkType, PatientHealthSummary } from '../types/health';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class HealthService {
    private static instance: HealthService;
    private constructor() {}

    public static getInstance(): HealthService {
        if (!HealthService.instance) {
            HealthService.instance = new HealthService();
        }
        return HealthService.instance;
    }

    // Health Summary
    async getHealthSummary(patientId: string): Promise<PatientHealthSummary> {
        try {
            const response = await axios.get(`${API_BASE_URL}/health/summary/${patientId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching health summary:', error);
            throw error;
        }
    }

    // Immunizations
    async addImmunization(
        patientId: string,
        immunizationType: ImmunizationType,
        dateAdministered: Date,
        nextDueDate?: Date,
        lotNumber?: string,
        notes?: string
    ): Promise<Immunization> {
        try {
            const response = await axios.post(`${API_BASE_URL}/health/immunizations`, {
                patient_id: patientId,
                immunization_type: immunizationType,
                date_administered: dateAdministered,
                next_due_date: nextDueDate,
                lot_number: lotNumber,
                notes: notes
            });
            return response.data;
        } catch (error) {
            console.error('Error adding immunization:', error);
            throw error;
        }
    }

    async getImmunizations(
        patientId: string,
        immunizationType?: ImmunizationType
    ): Promise<Immunization[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/health/immunizations/${patientId}`, {
                params: { immunization_type: immunizationType }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching immunizations:', error);
            throw error;
        }
    }

    // Blood Work
    async addBloodWork(
        patientId: string,
        bloodWorkType: BloodWorkType,
        dateTaken: Date,
        value: number,
        unit: string,
        referenceRange: string,
        notes?: string
    ): Promise<BloodWorkResult> {
        try {
            const response = await axios.post(`${API_BASE_URL}/health/blood-work`, {
                patient_id: patientId,
                blood_work_type: bloodWorkType,
                date_taken: dateTaken,
                value: value,
                unit: unit,
                reference_range: referenceRange,
                notes: notes
            });
            return response.data;
        } catch (error) {
            console.error('Error adding blood work:', error);
            throw error;
        }
    }

    async getBloodWork(
        patientId: string,
        bloodWorkType?: BloodWorkType
    ): Promise<BloodWorkResult[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/health/blood-work/${patientId}`, {
                params: { blood_work_type: bloodWorkType }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching blood work:', error);
            throw error;
        }
    }

    // Health Alerts
    async getHealthAlerts(patientId: string): Promise<string[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/health/alerts/${patientId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching health alerts:', error);
            throw error;
        }
    }

    // Upcoming Immunizations
    async getUpcomingImmunizations(daysAhead: number = 30): Promise<Record<string, Immunization[]>> {
        try {
            const response = await axios.get(`${API_BASE_URL}/health/upcoming-immunizations`, {
                params: { days_ahead: daysAhead }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching upcoming immunizations:', error);
            throw error;
        }
    }
}

export const healthService = HealthService.getInstance(); 