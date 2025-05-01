import { Provider, AppointmentSlot, SlotBooking } from '../types/calendar';

const API_BASE_URL = '/api/calendar';

export const calendarService = {
  // Provider endpoints
  getProviders: async (): Promise<Provider[]> => {
    const response = await fetch(`${API_BASE_URL}/providers`);
    if (!response.ok) {
      throw new Error('Failed to fetch providers');
    }
    return response.json();
  },

  getProvider: async (id: number): Promise<Provider> => {
    const response = await fetch(`${API_BASE_URL}/providers/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch provider');
    }
    return response.json();
  },

  createProvider: async (provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>): Promise<Provider> => {
    const response = await fetch(`${API_BASE_URL}/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(provider),
    });
    if (!response.ok) {
      throw new Error('Failed to create provider');
    }
    return response.json();
  },

  updateProvider: async (id: number, provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>): Promise<Provider> => {
    const response = await fetch(`${API_BASE_URL}/providers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(provider),
    });
    if (!response.ok) {
      throw new Error('Failed to update provider');
    }
    return response.json();
  },

  deleteProvider: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/providers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete provider');
    }
  },

  // Appointment slot endpoints
  getAppointmentSlots: async (): Promise<AppointmentSlot[]> => {
    const response = await fetch(`${API_BASE_URL}/slots`);
    if (!response.ok) {
      throw new Error('Failed to fetch appointment slots');
    }
    return response.json();
  },

  getAppointmentSlot: async (id: number): Promise<AppointmentSlot> => {
    const response = await fetch(`${API_BASE_URL}/slots/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch appointment slot');
    }
    return response.json();
  },

  getProviderSlots: async (
    providerId: number,
    startTime: Date,
    endTime: Date
  ): Promise<AppointmentSlot[]> => {
    const response = await fetch(
      `${API_BASE_URL}/providers/${providerId}/slots?start_time=${startTime.toISOString()}&end_time=${endTime.toISOString()}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch provider slots');
    }
    return response.json();
  },

  createAppointmentSlot: async (
    slot: Omit<AppointmentSlot, 'id' | 'is_available' | 'patient_id' | 'notes' | 'created_at' | 'updated_at'>
  ): Promise<AppointmentSlot> => {
    const response = await fetch(`${API_BASE_URL}/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slot),
    });
    if (!response.ok) {
      throw new Error('Failed to create appointment slot');
    }
    return response.json();
  },

  updateAppointmentSlot: async (
    id: number,
    slot: Omit<AppointmentSlot, 'id' | 'is_available' | 'patient_id' | 'notes' | 'created_at' | 'updated_at'>
  ): Promise<AppointmentSlot> => {
    const response = await fetch(`${API_BASE_URL}/slots/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slot),
    });
    if (!response.ok) {
      throw new Error('Failed to update appointment slot');
    }
    return response.json();
  },

  deleteAppointmentSlot: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/slots/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete appointment slot');
    }
  },

  bookAppointmentSlot: async (id: number, booking: SlotBooking): Promise<AppointmentSlot> => {
    const response = await fetch(`${API_BASE_URL}/slots/${id}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });
    if (!response.ok) {
      throw new Error('Failed to book appointment slot');
    }
    return response.json();
  },

  cancelAppointmentSlot: async (id: number): Promise<AppointmentSlot> => {
    const response = await fetch(`${API_BASE_URL}/slots/${id}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to cancel appointment slot');
    }
    return response.json();
  },
}; 