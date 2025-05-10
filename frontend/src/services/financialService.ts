import axios from 'axios';
import { io, Socket } from 'socket.io-client';

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
    down_payment: number;
    remaining_balance: number;
    monthly_payment: number;
    number_of_payments: number;
    start_date: string;
    end_date: string;
    status: PaymentStatus;
    payments: Payment[];
    created_at: string;
    created_by: string;
    notes?: string;
}

export interface PaymentPlanRequest {
    patient_id: string;
    treatment_plan_id: string;
    total_amount: number;
    down_payment: number;
    monthly_payment: number;
    number_of_payments: number;
    start_date: string;
    notes?: string;
}

export interface PaymentRequest {
    payment_plan_id: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
    notes?: string;
}

export interface FinancialMetrics {
    total_revenue: number;
    total_outstanding: number;
    collection_rate: number;
    average_payment_time: number;
    insurance_claims_pending: number;
    insurance_claims_paid: number;
}

export interface RevenueDataPoint {
    date: string;
    revenue: number;
}

export interface AgingReportEntry {
    period: string;
    amount: number;
}

export interface PaymentMethodDistribution {
    insurance: number;
    cash: number;
    credit_card: number;
    check: number;
}

interface FinancialReport {
    summary: Record<string, any>;
    revenue_trend: RevenueDataPoint[];
    aging_report: AgingReportEntry[];
    payment_distribution: Record<string, number>;
    transactions: Record<string, any>[];
}

interface ClinicPerformance {
    clinic_id: string;
    name: string;
    revenue: number;
    collection_rate: number;
    patient_count: number;
    average_ticket: number;
}

interface FinancialAlert {
    type: string;
    severity: string;
    message: string;
    details: Record<string, any>;
}

interface AnalyticsPrediction {
    date: string;
    predicted_revenue: number;
    confidence_interval: {
        lower: number;
        upper: number;
    };
}

interface AnomalyDetection {
    date: string;
    metric: string;
    value: number;
    expected_value: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
}

interface TrendAnalysis {
    period: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    rate_of_change: number;
    significance: number;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
let socket: Socket | null = null;

const financialService = {
    async createPaymentPlan(request: PaymentPlanRequest): Promise<PaymentPlan> {
        try {
            const response = await axios.post('/api/financial/payment-plans', request);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to create payment plan');
            }
            throw error;
        }
    },

    async getPaymentPlan(planId: string): Promise<PaymentPlan> {
        try {
            const response = await axios.get(`/api/financial/payment-plans/${planId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to fetch payment plan');
            }
            throw error;
        }
    },

    async getPatientPaymentPlans(patientId: string): Promise<PaymentPlan[]> {
        try {
            const response = await axios.get(`/api/financial/patients/${patientId}/payment-plans`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to fetch patient payment plans');
            }
            throw error;
        }
    },

    async addPayment(request: PaymentRequest): Promise<Payment> {
        try {
            const response = await axios.post('/api/financial/payments', request);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to add payment');
            }
            throw error;
        }
    },

    async getPaymentPlanPayments(planId: string): Promise<Payment[]> {
        try {
            const response = await axios.get(`/api/financial/payment-plans/${planId}/payments`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || 'Failed to fetch payments');
            }
            throw error;
        }
    },

    async getFinancialMetrics(startDate?: string, endDate?: string): Promise<FinancialMetrics> {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await axios.get(`/api/financial/metrics?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching financial metrics:', error);
            throw error;
        }
    },

    async getRevenueTrend(startDate: string, endDate: string): Promise<RevenueDataPoint[]> {
        try {
            const response = await axios.get(`/api/financial/revenue-trend`, {
                params: { start_date: startDate, end_date: endDate }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching revenue trend:', error);
            throw error;
        }
    },

    async getAgingReport(): Promise<AgingReportEntry[]> {
        try {
            const response = await axios.get('/api/financial/aging-report');
            return response.data;
        } catch (error) {
            console.error('Error fetching aging report:', error);
            throw error;
        }
    },

    async getPaymentMethodDistribution(): Promise<PaymentMethodDistribution> {
        try {
            const response = await axios.get('/api/financial/payment-method-distribution');
            return response.data;
        } catch (error) {
            console.error('Error fetching payment method distribution:', error);
            throw error;
        }
    },

    async generateFinancialReport(startDate: string, endDate: string, reportType: string = 'detailed'): Promise<FinancialReport> {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial/reports/generate`, {
                params: { start_date: startDate, end_date: endDate, report_type: reportType }
            });
            return response.data;
        } catch (error) {
            console.error('Error generating financial report:', error);
            throw error;
        }
    },

    async exportFinancialReport(startDate: string, endDate: string, filename: string = "financial_report.csv"): Promise<string> {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial/reports/export`, {
                params: { start_date: startDate, end_date: endDate, filename }
            });
            return response.data.filepath;
        } catch (error) {
            console.error('Error exporting financial report:', error);
            throw error;
        }
    },

    async getClinicPerformance(startDate: string, endDate: string): Promise<ClinicPerformance[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial/clinic-performance`, {
                params: { start_date: startDate, end_date: endDate }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching clinic performance:', error);
            throw error;
        }
    },

    async getFinancialAlerts(): Promise<FinancialAlert[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial/alerts`);
            return response.data;
        } catch (error) {
            console.error('Error fetching financial alerts:', error);
            throw error;
        }
    },

    connectWebSocket(clinicId: string, onAlert: (alert: FinancialAlert) => void): void {
        if (socket) {
            socket.disconnect();
        }

        socket = io(`${API_BASE_URL}/ws/alerts/${clinicId}`, {
            transports: ['websocket'],
            auth: {
                token: localStorage.getItem('token')
            }
        });

        socket.on('alert', (data: { type: string; data: FinancialAlert[] }) => {
            if (data.type === 'alert') {
                data.data.forEach(alert => onAlert(alert));
            }
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });
    },

    disconnectWebSocket(): void {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    async getRevenuePredictions(
        startDate: string,
        endDate: string,
        predictionPeriod: number = 30
    ): Promise<AnalyticsPrediction[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial/analytics/predictions`, {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    prediction_period: predictionPeriod
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching revenue predictions:', error);
            throw error;
        }
    },

    async detectAnomalies(
        startDate: string,
        endDate: string,
        metrics: string[] = ['revenue', 'collection_rate']
    ): Promise<AnomalyDetection[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial/analytics/anomalies`, {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    metrics: metrics.join(',')
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error detecting anomalies:', error);
            throw error;
        }
    },

    async analyzeTrends(
        startDate: string,
        endDate: string,
        metric: string
    ): Promise<TrendAnalysis> {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial/analytics/trends`, {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    metric
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error analyzing trends:', error);
            throw error;
        }
    },

    async exportReport(
        startDate: string,
        endDate: string,
        format: 'csv' | 'pdf' | 'excel' = 'csv',
        filename: string = "financial_report"
    ): Promise<string> {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial/reports/export`, {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    format,
                    filename
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return url;
        } catch (error) {
            console.error('Error exporting report:', error);
            throw error;
        }
    },

    async scheduleReport(
        startDate: string,
        endDate: string,
        format: 'csv' | 'pdf' | 'excel',
        frequency: 'daily' | 'weekly' | 'monthly',
        email: string
    ): Promise<void> {
        try {
            await axios.post(`${API_BASE_URL}/financial/reports/schedule`, {
                start_date: startDate,
                end_date: endDate,
                format,
                frequency,
                email
            });
        } catch (error) {
            console.error('Error scheduling report:', error);
            throw error;
        }
    }
};

export default financialService; 