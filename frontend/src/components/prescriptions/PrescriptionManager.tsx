import React, { useState, useEffect } from 'react';
import { PrescriptionList } from './PrescriptionList';
import { PrescriptionDetails } from './PrescriptionDetails';
import { CreatePrescriptionForm } from './CreatePrescriptionForm';
import { useToast } from '../ui/use-toast';
import { Loader2 } from 'lucide-react';

interface PrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  form: string;
  route: string;
  frequency: string;
  quantity: number;
  days_supply?: number;
  refills: number;
  dispense_as_written: boolean;
  notes?: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  provider_id: string;
  patient_name: string;
  provider_name: string;
  prescription_date: string;
  status: string;
  items: PrescriptionItem[];
  treatment_plan_id?: string;
  treatment_plan_name?: string;
  created_at: string;
  sent_date?: string;
  filled_date?: string;
  notes?: string;
  has_warnings?: boolean;
}

interface ValidationWarning {
  message: string;
  critical: boolean;
}

interface PrescriptionFormValues {
  patient_id: string;
  provider_id?: string;
  prescription_date: string;
  notes?: string;
  items: {
    medication_name: string;
    dosage: string;
    form: string;
    route: string;
    frequency: string;
    quantity: number;
    days_supply?: number;
    refills: number;
    dispense_as_written: boolean;
    notes?: string;
  }[];
  treatment_plan_id?: string;
}

interface PrescriptionManagerProps {
  patientId: string;
  patientName: string;
  providerId?: string;
  providerName?: string;
  treatmentPlanId?: string;
  treatmentPlanName?: string;
}

export const PrescriptionManager: React.FC<PrescriptionManagerProps> = ({
  patientId,
  patientName,
  providerId,
  providerName,
  treatmentPlanId,
  treatmentPlanName
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const { toast } = useToast();

  // Fetch prescriptions on component mount and when patientId changes
  useEffect(() => {
    if (patientId) {
      fetchPrescriptions();
    }
  }, [patientId]);

  // Fetch all prescriptions for a patient
  const fetchPrescriptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/prescriptions`);
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      
      const data = await response.json();
      setPrescriptions(data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a single prescription's details
  const fetchPrescriptionDetails = async (prescriptionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}`);
      if (!response.ok) throw new Error('Failed to fetch prescription details');
      
      const data = await response.json();
      setSelectedPrescription(data);
      setIsViewDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching prescription details:', error);
      toast({
        title: "Error",
        description: "Failed to load prescription details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate a prescription for safety issues
  const validatePrescription = async (prescriptionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/validate`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to validate prescription');
      
      const data = await response.json();
      setValidationWarnings(data.warnings || []);
      
      // If there are warnings, show them in the details view
      if (data.warnings && data.warnings.length > 0) {
        fetchPrescriptionDetails(prescriptionId);
      } else {
        toast({
          title: "Validation Successful",
          description: "No safety issues found with this prescription",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error validating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to validate prescription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Approve and send a prescription
  const approveAndSendPrescription = async (prescriptionId: string, overrideWarnings: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          override_warnings: overrideWarnings
        })
      });
      
      if (!response.ok) throw new Error('Failed to approve and send prescription');
      
      toast({
        title: "Success",
        description: "Prescription has been approved and sent to pharmacy",
        variant: "default"
      });
      
      // Refresh the prescription list
      fetchPrescriptions();
      setIsViewDetailsOpen(false);
    } catch (error) {
      console.error('Error approving prescription:', error);
      toast({
        title: "Error",
        description: "Failed to approve and send prescription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a prescription
  const deletePrescription = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete prescription');
      
      toast({
        title: "Success",
        description: "Prescription has been deleted",
        variant: "default"
      });
      
      // Update the local state to remove the deleted prescription
      setPrescriptions(prescriptions.filter(p => p.id !== prescriptionId));
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a prescription
  const cancelPrescription = async (prescriptionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/cancel`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to cancel prescription');
      
      toast({
        title: "Success",
        description: "Prescription has been cancelled",
        variant: "default"
      });
      
      // Refresh the prescription list
      fetchPrescriptions();
      setIsViewDetailsOpen(false);
    } catch (error) {
      console.error('Error cancelling prescription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel prescription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new prescription
  const createPrescription = async (data: PrescriptionFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to create prescription');
      
      toast({
        title: "Success",
        description: "Prescription has been created",
        variant: "default"
      });
      
      // Refresh the prescription list and close the form
      fetchPrescriptions();
      setIsCreateFormOpen(false);
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open create prescription form
  const handleOpenCreateForm = () => {
    setIsCreateFormOpen(true);
  };

  // Close the create form
  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  // Close the details view
  const handleCloseDetails = () => {
    setIsViewDetailsOpen(false);
    setSelectedPrescription(null);
    setValidationWarnings([]);
  };

  if (isLoading && prescriptions.length === 0 && !isCreateFormOpen && !isViewDetailsOpen) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading prescriptions...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isCreateFormOpen ? (
        <CreatePrescriptionForm
          patientId={patientId}
          patientName={patientName}
          providerId={providerId}
          providerName={providerName}
          treatmentPlanId={treatmentPlanId}
          treatmentPlanName={treatmentPlanName}
          onSubmit={createPrescription}
          onCancel={handleCloseCreateForm}
        />
      ) : isViewDetailsOpen && selectedPrescription ? (
        <PrescriptionDetails
          prescription={selectedPrescription}
          validationWarnings={validationWarnings}
          onApproveAndSend={approveAndSendPrescription}
          onCancel={cancelPrescription}
          onClose={handleCloseDetails}
        />
      ) : (
        <PrescriptionList
          prescriptions={prescriptions}
          onViewPrescription={fetchPrescriptionDetails}
          onCreatePrescription={handleOpenCreateForm}
          onValidatePrescription={validatePrescription}
          onApprovePrescription={(id) => approveAndSendPrescription(id, false)}
          onDeletePrescription={deletePrescription}
        />
      )}
    </div>
  );
};