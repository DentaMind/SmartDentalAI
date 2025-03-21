import { Appointment as SchemaAppointment } from "@shared/schema";

export type Appointment = SchemaAppointment;

export type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string;
  profileImage?: string;
};

export type Provider = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialization?: string;
  avatar?: string;
  color?: string;
};

export type AppointmentType = 
  | 'Comprehensive Exam'
  | 'Crown Prep'
  | 'Root Canal'
  | 'Composite'
  | 'Recement Crown'
  | 'Prophylaxis'
  | 'Perio Maintenance';

export type AppointmentWithPatient = Appointment & {
  patientName: string;
  patientId: number;
  patientImage?: string;
  doctorName: string;
  operatory: string;
};

export type Operatory = {
  id: string;
  name: string;
  locationId: number;
  type: 'treatment' | 'hygiene' | 'surgical';
  equipment: string[];
};

export type Location = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  operatories: Operatory[];
};