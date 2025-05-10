import { useState, useEffect, useCallback } from 'react';
import { patientApi, Patient, PatientCreate, PatientUpdate, TreatmentStatusUpdate } from '../api/patients';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all patients
  const fetchPatients = useCallback(async (params?: { status?: string; search?: string }) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    
    try {
      const data = await patientApi.getPatients(params);
      setPatients(data);
      return data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch patients');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load patients on initial render
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    isLoading,
    isError,
    errorMessage,
    fetchPatients,
    
    // Create a new patient
    createPatient: async (patientData: PatientCreate) => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const newPatient = await patientApi.createPatient(patientData);
        setPatients(prevPatients => [...prevPatients, newPatient]);
        return newPatient;
      } catch (error) {
        console.error('Error creating patient:', error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to create patient');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    
    // Update a patient
    updatePatient: async (patientId: string, patientData: PatientUpdate) => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const updatedPatient = await patientApi.updatePatient(patientId, patientData);
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient.id === patientId ? updatedPatient : patient
          )
        );
        return updatedPatient;
      } catch (error) {
        console.error('Error updating patient:', error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to update patient');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    
    // Update a patient's treatment status
    updateTreatmentStatus: async (patientId: string, statusData: TreatmentStatusUpdate) => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const updatedPatient = await patientApi.updateTreatmentStatus(patientId, statusData);
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient.id === patientId ? updatedPatient : patient
          )
        );
        return updatedPatient;
      } catch (error) {
        console.error('Error updating treatment status:', error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to update treatment status');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    
    // Delete a patient (mark as inactive)
    deletePatient: async (patientId: string) => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const result = await patientApi.deletePatient(patientId);
        // Refresh the patient list
        await fetchPatients();
        return result;
      } catch (error) {
        console.error('Error deleting patient:', error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to delete patient');
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  };
}

export function usePatient(patientId?: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch a single patient
  const fetchPatient = useCallback(async () => {
    if (!patientId) return;
    
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    
    try {
      const data = await patientApi.getPatient(patientId);
      setPatient(data);
      return data;
    } catch (error) {
      console.error('Error fetching patient:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch patient');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  // Load patient on initial render if patientId is provided
  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId, fetchPatient]);

  return {
    patient,
    isLoading,
    isError,
    errorMessage,
    fetchPatient,
    
    // Update the patient
    updatePatient: async (patientData: PatientUpdate) => {
      if (!patientId) return null;
      
      setIsLoading(true);
      setIsError(false);
      
      try {
        const updatedPatient = await patientApi.updatePatient(patientId, patientData);
        setPatient(updatedPatient);
        return updatedPatient;
      } catch (error) {
        console.error('Error updating patient:', error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to update patient');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    
    // Update the patient's treatment status
    updateTreatmentStatus: async (statusData: TreatmentStatusUpdate) => {
      if (!patientId) return null;
      
      setIsLoading(true);
      setIsError(false);
      
      try {
        const updatedPatient = await patientApi.updateTreatmentStatus(patientId, statusData);
        setPatient(updatedPatient);
        return updatedPatient;
      } catch (error) {
        console.error('Error updating treatment status:', error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to update treatment status');
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  };
} 