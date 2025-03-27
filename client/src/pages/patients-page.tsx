import { PatientManagement } from "@/components/patients/patient-management";
import { usePatient } from "@/hooks/use-patient";
import { useEffect } from "react";

/**
 * Main patients page component
 * Renders the PatientManagement component within a dashboard layout
 */
const PatientsPage = () => {
  const { patients, loading, error } = usePatient();
  
  useEffect(() => {
    // Log patient data for debugging
    if (patients && patients.length > 0) {
      console.log("PATIENTS ROUTE DATA:", patients);
    }
    
    if (error) {
      console.error("Error loading patients:", error);
    }
  }, [patients, error]);
  
  return (
    <div className="container mx-auto py-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-10">
          Error loading patients data. Please try again.
        </div>
      ) : (
        <PatientManagement />
      )}
    </div>
  );
};

export default PatientsPage;