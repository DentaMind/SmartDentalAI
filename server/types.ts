import {
  User,
  InsertUser,
  Patient,
  InsertPatient,
  InsuranceVerification,
  InsertInsuranceVerification,
  Appointment,
  InsertAppointment
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patient management
  getPatient(id: number): Promise<(Patient & { user: User }) | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  getAllPatients(): Promise<(Patient & { user: User })[]>;
  getPatientByUserId(userId: number): Promise<Patient | undefined>;
  
  // Appointment management
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(appointmentId: number): Promise<Appointment | undefined>;
  updateAppointment(appointmentId: number, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  getDoctorAppointments(doctorId: number): Promise<Appointment[]>;
  getPatientAppointments(patientId: number): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;
  
  // Insurance verification management
  createInsuranceVerification(verification: InsertInsuranceVerification): Promise<InsuranceVerification>;
  getInsuranceVerification(id: number): Promise<InsuranceVerification | undefined>;
  updateInsuranceVerification(id: number, updates: Partial<InsuranceVerification>): Promise<InsuranceVerification | undefined>;
  getActiveInsuranceVerifications(): Promise<InsuranceVerification[]>;
  getPatientInsuranceVerificationHistory(patientId: number): Promise<InsuranceVerification[]>;
}