import { PatientManagement } from "@/components/patients/patient-management";

/**
 * Main patients page component
 * Renders the PatientManagement component within a dashboard layout
 */
const PatientsPage = () => {
  return (
    <div className="container mx-auto py-6">
      <PatientManagement />
    </div>
  );
};

export default PatientsPage;