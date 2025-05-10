import axios from 'axios';

export enum PaymentStatus {
    PENDING = 'PENDING',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
    CASH = 'CASH',
    CREDIT_CARD = 'CREDIT_CARD',
    CHECK = 'CHECK',
    INSURANCE = 'INSURANCE',
    FINANCING = 'FINANCING'
}

export interface Payment {
    id: string;
    payment_plan_id: string;
    amount: number;
    date: string;
    method: PaymentMethod;
    reference: string;
    status: PaymentStatus;
    notes?: string;
}

export interface PaymentPlan {
    id: string;
    patient_id: string;
    treatment_plan_id: string;
    total_amount: number;
    remaining_balance: number;
    monthly_payment: number;
    start_date: string;
    end_date: string;
    status: PaymentStatus;
    payments: Payment[];
    notes?: string;
}

export interface PaymentPlanCreate {
    patient_id: string;
    treatment_plan_id: string;
    total_amount: number;
    monthly_payment: number;
    start_date: string;
    notes?: string;
}

export interface PaymentCreate {
    payment_plan_id: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
    notes?: string;
}

const paymentService = {
    async createPaymentPlan(plan: PaymentPlanCreate): Promise<PaymentPlan> {
        try {
            const response = await axios.post('/api/payment-plans', plan);
            return response.data;
        } catch (error) {
            console.error('Error creating payment plan:', error);
            throw error;
        }
    },

    async addPayment(payment: PaymentCreate): Promise<Payment> {
        try {
            const response = await axios.post('/api/payments', payment);
            return response.data;
        } catch (error) {
            console.error('Error adding payment:', error);
            throw error;
        }
    },

    async getPaymentPlan(planId: string): Promise<PaymentPlan> {
        try {
            const response = await axios.get(`/api/payment-plans/${planId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching payment plan:', error);
            throw error;
        }
    },

    async getPatientPaymentPlans(patientId: string): Promise<PaymentPlan[]> {
        try {
            const response = await axios.get(`/api/patients/${patientId}/payment-plans`);
            return response.data;
        } catch (error) {
            console.error('Error fetching patient payment plans:', error);
            throw error;
        }
    },

    async getTreatmentPlanPaymentPlans(treatmentPlanId: string): Promise<PaymentPlan[]> {
        try {
            const response = await axios.get(`/api/treatment-plans/${treatmentPlanId}/payment-plans`);
            return response.data;
        } catch (error) {
            console.error('Error fetching treatment plan payment plans:', error);
            throw error;
        }
    },

    async updatePaymentPlanStatus(planId: string, status: PaymentStatus): Promise<PaymentPlan> {
        try {
            const response = await axios.put(`/api/payment-plans/${planId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating payment plan status:', error);
            throw error;
        }
    },

    async getAllPaymentPlans(): Promise<PaymentPlan[]> {
        try {
            const response = await axios.get('/api/payment-plans');
            return response.data;
        } catch (error) {
            console.error('Error fetching all payment plans:', error);
            throw error;
        }
    },

    async getPaymentPlansByStatus(status: PaymentStatus): Promise<PaymentPlan[]> {
        try {
            const response = await axios.get(`/api/payment-plans/status/${status}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching payment plans by status:', error);
            throw error;
        }
    }
};

export default paymentService; 