export interface Provider {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentSlot {
  id: number;
  provider_id: number;
  start_time: string;
  end_time: string;
  appointment_type: string;
  is_available: boolean;
  patient_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SlotBooking {
  patient_id: number;
  notes?: string;
} 