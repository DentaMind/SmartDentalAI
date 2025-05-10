import {
  CommunicationMessage,
  CommunicationLog,
  CommunicationPreference,
  CommunicationAnalytics,
  CommunicationChannel,
  CommunicationIntent,
  MessageCategory,
} from '../types/communication';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

class CommunicationService {
  async sendMessage(
    message: CommunicationMessage,
    preferredChannel?: CommunicationChannel,
    forceChannel: boolean = false
  ): Promise<CommunicationLog> {
    const response = await fetch(`${API_BASE_URL}/communications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        preferred_channel: preferredChannel,
        force_channel: forceChannel,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  async getCommunicationLogs(
    patientId?: number,
    startDate?: Date,
    endDate?: Date,
    channel?: CommunicationChannel,
    category?: MessageCategory,
    intent?: CommunicationIntent
  ): Promise<CommunicationLog[]> {
    const params = new URLSearchParams();
    if (patientId) params.append('patient_id', patientId.toString());
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    if (channel) params.append('channel', channel);
    if (category) params.append('category', category);
    if (intent) params.append('intent', intent);

    const response = await fetch(`${API_BASE_URL}/communications/logs?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch communication logs');
    }

    return response.json();
  }

  async getCommunicationPreferences(patientId: number): Promise<CommunicationPreference> {
    const response = await fetch(`${API_BASE_URL}/communications/preferences/${patientId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch communication preferences');
    }

    return response.json();
  }

  async updateCommunicationPreferences(
    patientId: number,
    preferences: Partial<CommunicationPreference>
  ): Promise<CommunicationPreference> {
    const response = await fetch(`${API_BASE_URL}/communications/preferences/${patientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error('Failed to update communication preferences');
    }

    return response.json();
  }

  async getCommunicationAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<CommunicationAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());

    const response = await fetch(`${API_BASE_URL}/communications/analytics?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch communication analytics');
    }

    return response.json();
  }

  async getMessageStatus(messageId: string): Promise<CommunicationLog> {
    const response = await fetch(`${API_BASE_URL}/communications/status/${messageId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch message status');
    }

    return response.json();
  }

  async resendMessage(messageId: string): Promise<CommunicationLog> {
    const response = await fetch(`${API_BASE_URL}/communications/resend/${messageId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to resend message');
    }

    return response.json();
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/communications/validate-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate phone number');
    }

    const data = await response.json();
    return data.is_valid;
  }

  async getMessageTemplates(
    category?: MessageCategory,
    intent?: CommunicationIntent
  ): Promise<{ id: string; subject: string; body: string }[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (intent) params.append('intent', intent);

    const response = await fetch(`${API_BASE_URL}/communications/templates?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch message templates');
    }

    return response.json();
  }
}

export const communicationService = new CommunicationService(); 