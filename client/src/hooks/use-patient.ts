import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  userId: number;
}

export function usePatient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/patients'],
    retry: false,
  });

  return {
    patients: data as Patient[] || [],
    loading: isLoading,
    error
  };
}

export function usePatientById(patientId?: number) {
  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
    retry: false,
  });

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId || !patients) return;
    
    const foundPatient = (patients as Patient[]).find(p => p.id === patientId);
    setPatient(foundPatient || null);
  }, [patientId, patients]);

  const fetchPatientDetails = async (id: number) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/patients/${id}`);
      setPatient(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patient details');
    } finally {
      setLoading(false);
    }
  };

  return {
    patient,
    loading,
    error,
    fetchPatientDetails
  };
}