import axios from 'axios';

export interface BalanceEntry {
    id: string;
    patient_id: string;
    amount: number;
    type: 'charge' | 'payment' | 'adjustment' | 'insurance';
    reference_id: string;
    date: string;
    description: string;
    status: 'pending' | 'completed' | 'cancelled';
}

export interface PatientBalance {
    patient_id: string;
    current_balance: number;
    pending_charges: number;
    pending_payments: number;
    last_updated: string;
    entries: BalanceEntry[];
}

export interface BalanceEntryCreate {
    amount: number;
    type: 'charge' | 'payment' | 'adjustment' | 'insurance';
    reference_id: string;
    description: string;
}

export interface BalanceEntryUpdate {
    status: 'pending' | 'completed' | 'cancelled';
}

const balanceService = {
    async getPatientBalance(patientId: string): Promise<PatientBalance> {
        try {
            const response = await axios.get(`/api/patients/${patientId}/balance`);
            return response.data;
        } catch (error) {
            console.error('Error fetching patient balance:', error);
            throw error;
        }
    },

    async addCharge(patientId: string, charge: BalanceEntryCreate): Promise<BalanceEntry> {
        try {
            const response = await axios.post(`/api/patients/${patientId}/charges`, charge);
            return response.data;
        } catch (error) {
            console.error('Error adding charge:', error);
            throw error;
        }
    },

    async addPayment(patientId: string, payment: BalanceEntryCreate): Promise<BalanceEntry> {
        try {
            const response = await axios.post(`/api/patients/${patientId}/payments`, payment);
            return response.data;
        } catch (error) {
            console.error('Error adding payment:', error);
            throw error;
        }
    },

    async addInsuranceEstimate(patientId: string, estimate: BalanceEntryCreate): Promise<BalanceEntry> {
        try {
            const response = await axios.post(`/api/patients/${patientId}/insurance-estimates`, estimate);
            return response.data;
        } catch (error) {
            console.error('Error adding insurance estimate:', error);
            throw error;
        }
    },

    async updateEntryStatus(patientId: string, entryId: string, status: BalanceEntryUpdate): Promise<BalanceEntry> {
        try {
            const response = await axios.put(`/api/patients/${patientId}/entries/${entryId}`, status);
            return response.data;
        } catch (error) {
            console.error('Error updating entry status:', error);
            throw error;
        }
    },

    async getBalanceHistory(patientId: string): Promise<BalanceEntry[]> {
        try {
            const response = await axios.get(`/api/patients/${patientId}/balance-history`);
            return response.data;
        } catch (error) {
            console.error('Error fetching balance history:', error);
            throw error;
        }
    }
};

export default balanceService; 