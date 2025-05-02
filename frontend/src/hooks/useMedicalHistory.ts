import { useState, useEffect, useCallback } from 'react';
import { 
  getPatientMedicalProfile, 
  updateMedicalHistory,
  addPatientAllergies,
  addPatientMedications,
  getPatientAlerts,
  checkMedicationAllergies
} from '../api/patientIntakeApi';

interface UseMedicalHistoryProps {
  patientId?: string;
}

/**
 * Hook for managing patient medical history data and API calls
 */
export const useMedicalHistory = ({ patientId }: UseMedicalHistoryProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicalProfile, setMedicalProfile] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [medicationAlerts, setMedicationAlerts] = useState<any[]>([]);
  
  // Fetch patient medical profile
  const fetchMedicalProfile = useCallback(async () => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profile = await getPatientMedicalProfile(patientId);
      setMedicalProfile(profile);
      
      // Also fetch alerts
      const alertsData = await getPatientAlerts(patientId);
      setAlerts(alertsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load medical profile');
      console.error('Error fetching medical profile:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);
  
  // Update medical history
  const saveMedicalHistory = async (medicalData: any) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updated = await updateMedicalHistory(patientId, medicalData);
      
      // Update the local profile
      setMedicalProfile(prev => ({
        ...prev,
        medical_history: updated
      }));
      
      // Refresh alerts
      const alertsData = await getPatientAlerts(patientId);
      setAlerts(alertsData || []);
      
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update medical history');
      console.error('Error updating medical history:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Add allergies
  const saveAllergies = async (allergies: any[]) => {
    if (!patientId || !allergies.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updated = await addPatientAllergies(patientId, allergies);
      
      // Update the local profile
      setMedicalProfile(prev => ({
        ...prev,
        allergies: [...(prev?.allergies || []), ...updated]
      }));
      
      // Refresh alerts
      const alertsData = await getPatientAlerts(patientId);
      setAlerts(alertsData || []);
      
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to add allergies');
      console.error('Error adding allergies:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Add medications
  const saveMedications = async (medications: any[]) => {
    if (!patientId || !medications.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updated = await addPatientMedications(patientId, medications);
      
      // Update the local profile
      setMedicalProfile(prev => ({
        ...prev,
        medications: [...(prev?.medications || []), ...updated]
      }));
      
      // Refresh alerts
      const alertsData = await getPatientAlerts(patientId);
      setAlerts(alertsData || []);
      
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to add medications');
      console.error('Error adding medications:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Check medication for allergies
  const checkMedicationForAllergies = async (medicationName: string, index: number) => {
    if (!patientId || !medicationName || medicationName.length < 3) return;
    
    try {
      const allergy = await checkMedicationAllergies(patientId, medicationName);
      
      if (allergy) {
        // Found an allergy! Update alerts
        const newAlerts = [...medicationAlerts];
        
        // Add new alert if it doesn't already exist
        if (!newAlerts.find(a => a.index === index)) {
          newAlerts.push({
            index,
            medicationName,
            allergen: allergy.allergen,
            reaction: allergy.reaction,
            severity: allergy.severity,
            note: allergy.note
          });
          setMedicationAlerts(newAlerts);
        }
      } else {
        // Remove any existing alert for this medication
        const newAlerts = medicationAlerts.filter(a => a.index !== index);
        setMedicationAlerts(newAlerts);
      }
    } catch (err) {
      console.error('Error checking medication allergies:', err);
    }
  };
  
  // Clear medication alerts
  const clearMedicationAlert = (index: number) => {
    const newAlerts = medicationAlerts.filter(a => a.index !== index);
    setMedicationAlerts(newAlerts);
  };
  
  // Fetch initial data
  useEffect(() => {
    if (patientId) {
      fetchMedicalProfile();
    }
  }, [patientId, fetchMedicalProfile]);
  
  return {
    loading,
    error,
    medicalProfile,
    alerts,
    medicationAlerts,
    fetchMedicalProfile,
    saveMedicalHistory,
    saveAllergies,
    saveMedications,
    checkMedicationForAllergies,
    clearMedicationAlert
  };
}; 