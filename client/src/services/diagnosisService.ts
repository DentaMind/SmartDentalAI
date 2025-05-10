import { DiagnosisResponse, DiagnosisFeedback } from '../types/ai-diagnosis';

const API_BASE_URL = '/api/diagnosis';

export const diagnosisService = {
  async getSuggestions(patientId: number): Promise<DiagnosisResponse> {
    const response = await fetch(`${API_BASE_URL}/${patientId}/suggestions`);
    if (!response.ok) {
      throw new Error('Failed to fetch diagnosis suggestions');
    }
    return response.json();
  },

  async submitFeedback(patientId: number, feedback: DiagnosisFeedback): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${patientId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });
    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }
  },

  async submitDiagnosis(patientId: number, diagnosis: string, notes?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${patientId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ diagnosis, notes }),
    });
    if (!response.ok) {
      throw new Error('Failed to submit diagnosis');
    }
  },

  async getAuditLogs(patientId: number): Promise<DiagnosisResponse> {
    const response = await fetch(`${API_BASE_URL}/${patientId}/audit-logs`);
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    return response.json();
  }
}; 