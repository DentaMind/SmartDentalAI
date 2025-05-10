// Shared types for patient-related components

export type User = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  role?: string;
  language?: string;
};

export type Patient = {
  id: number;
  userId: number;
  user: User;
  medicalHistory?: string;
  allergies?: string | string[];
  currentMedications?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
};