/**
 * Type definitions for the appointment system
 */

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: Date | string;
  duration: number;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  procedureType?: string;
  checkedIn?: boolean;
  checkedInTime?: Date | string | null;
  operatory?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Patient {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: Date | string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: any;
  photoUrl?: string;
}

export interface AppointmentWithPatient extends Appointment {
  patient?: Patient;
  patientName?: string;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  specialization?: string;
  licenseNumber?: string;
  email?: string;
  role: string;
}

export interface AppointmentFormData {
  patientId: number;
  doctorId: number;
  date: Date;
  duration: number;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  procedureType?: string;
  operatory?: string;
}

export type AppointmentType = 
  // Exams and hygiene
  | "comprehensive" | "periodic" | "prophylaxis" | "perioMaint"
  // Restorative procedures
  | "composite" | "crownPrep" | "crownDelivery" | "recementCrown" | "veneerPrep"
  // Surgical and endodontic 
  | "extraction" | "rootCanal" | "implant"
  // Quick procedures
  | "quickAdjust" | "emergencyExam" | "postOp"
  // Other
  | "consultation" | "meeting" | "vacation";