export interface Prescription {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  refillsRemaining: number;
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionFormData {
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  refillsRemaining: number;
  instructions: string;
}

export interface PrescriptionHistory {
  id: string;
  prescriptionId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: string;
  userId: string;
}

export interface PrescriptionStats {
  totalPrescriptions: number;
  activePrescriptions: number;
  completedPrescriptions: number;
  cancelledPrescriptions: number;
  averageDuration: number;
  mostCommonMedications: Array<{
    medicationName: string;
    count: number;
  }>;
} 