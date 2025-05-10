import { apiClient } from './client';
import { format } from 'date-fns';

export interface Provider {
  id: number;
  name: string;
  role: string;
  specialties: string[];
}

export interface Appointment {
  id: number;
  provider_id: number;
  patient_id: number;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface AppointmentType {
  id: number;
  name: string;
  default_duration: number;
  color: string;
}

export const fetchProviders = async (): Promise<Provider[]> => {
  const response = await apiClient.get('/api/v1/providers');
  return response.data;
};

export const fetchAppointments = async (
  providerId: number | null,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> => {
  const response = await apiClient.get('/api/v1/appointments', {
    params: {
      provider_id: providerId,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd')
    }
  });
  return response.data;
};

export const fetchAvailability = async (
  providerId: number,
  startDate: Date,
  endDate: Date
): Promise<Record<string, TimeSlot[]>> => {
  const response = await apiClient.get('/api/v1/availability', {
    params: {
      provider_id: providerId,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd')
    }
  });
  return response.data;
};

export const createAppointment = async (
  appointment: Omit<Appointment, 'id' | 'status'>
): Promise<Appointment> => {
  const response = await apiClient.post('/api/v1/appointments', appointment);
  return response.data;
};

export const updateAppointment = async (
  appointment: Appointment
): Promise<Appointment> => {
  const response = await apiClient.put(
    `/api/v1/appointments/${appointment.id}`,
    appointment
  );
  return response.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/appointments/${id}`);
};

export const confirmAppointment = async (id: number): Promise<Appointment> => {
  const response = await apiClient.post(
    `/api/v1/appointments/${id}/confirm`
  );
  return response.data;
};

export const cancelAppointment = async (id: number): Promise<Appointment> => {
  const response = await apiClient.post(
    `/api/v1/appointments/${id}/cancel`
  );
  return response.data;
};

export const fetchAppointmentTypes = async (): Promise<AppointmentType[]> => {
  const response = await apiClient.get('/api/v1/appointment-types');
  return response.data;
}; 