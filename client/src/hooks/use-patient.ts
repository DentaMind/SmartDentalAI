import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface Patient {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medicalHistory?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Hook to fetch all patients
 */
export function usePatient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  
  const { data, isLoading, error } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    onSuccess: (data) => {
      setPatients(data || []);
    }
  });

  return {
    patients: data || patients,
    loading: isLoading,
    error
  };
}

/**
 * Hook to fetch a specific patient by ID
 */
export function usePatientById(patientId?: number) {
  const [patient, setPatient] = useState<Patient | null>(null);
  
  const { data, isLoading, error } = useQuery<Patient>({
    queryKey: ['/api/patients', patientId],
    enabled: !!patientId,
    onSuccess: (data) => {
      setPatient(data || null);
    }
  });

  return {
    patient: data || patient,
    loading: isLoading,
    error
  };
}

/**
 * Hook to fetch patient medical history
 */
export function usePatientMedicalHistory(patientId?: number) {
  const [medicalHistory, setMedicalHistory] = useState<Record<string, any> | null>(null);
  
  const { data, isLoading, error } = useQuery<Record<string, any>>({
    queryKey: ['/api/patients/medical-history', patientId],
    enabled: !!patientId,
    onSuccess: (data) => {
      setMedicalHistory(data || null);
    }
  });

  return {
    medicalHistory: data || medicalHistory,
    loading: isLoading,
    error
  };
}

/**
 * Hook to fetch patient treatments
 */
export function usePatientTreatments(patientId?: number) {
  const [treatments, setTreatments] = useState<any[]>([]);
  
  const { data, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/treatment-plans/patient', patientId],
    enabled: !!patientId,
    onSuccess: (data) => {
      setTreatments(data || []);
    }
  });

  return {
    treatments: data || treatments,
    loading: isLoading,
    error
  };
}

/**
 * Hook to fetch patient appointments
 */
export function usePatientAppointments(patientId?: number) {
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const { data, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/appointments/patient', patientId],
    enabled: !!patientId,
    onSuccess: (data) => {
      setAppointments(data || []);
    }
  });

  return {
    appointments: data || appointments,
    loading: isLoading,
    error
  };
}