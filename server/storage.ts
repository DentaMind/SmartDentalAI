import { IStorage } from "./types";
import {
  User,
  InsertUser,
  Patient,
  InsertPatient,
  Appointment,
  InsertAppointment,
  TreatmentPlan,
  InsertTreatmentPlan,
  Payment,
  InsertPayment,
  MedicalNote,
  InsertMedicalNote,
  Xray,
  InsertXray,
  FinancialTransaction,
  InsertFinancialTransaction,
  InsuranceClaim,
  InsertInsuranceClaim,
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { z } from "zod";
import { db } from "./db";

// Define schemas for storage operations
const patientSchema = z.object({
  id: z.number().optional(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  medicalHistory: z.string().optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string()
  }).optional(),
  user: z.object({
    insuranceProvider: z.string().optional(),
    insuranceCoverageDetails: z.any().optional()
  }).optional()
});

const medicalNoteSchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  providerId: z.number(),
  content: z.string(),
  date: z.string(),
  private: z.boolean().default(false)
});

const xraySchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  url: z.string(),
  date: z.string(),
  type: z.string().optional(),
  region: z.string().optional(),
  notes: z.string().optional()
});

const paymentSchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  amount: z.number(),
  date: z.string(),
  method: z.string(),
  description: z.string().optional(),
  status: z.string(),
  createdAt: z.string()
});

const appointmentSchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  providerId: z.number(),
  date: z.string(),
  duration: z.number(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "no-show"])
});

const treatmentPlanSchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  providerId: z.number(),
  treatments: z.array(z.object({
    procedure: z.string(),
    tooth: z.string().optional(),
    notes: z.string().optional(),
    estimatedCost: z.number().optional(),
    priority: z.enum(["high", "medium", "low"]).optional()
  })),
  createdAt: z.string(),
  status: z.enum(["active", "completed", "cancelled"])
});

const messageSchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  providerId: z.number().optional(),
  content: z.string(),
  timestamp: z.string(),
  read: z.boolean(),
  attachments: z.array(z.string()).optional()
});

const insuranceClaimSchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  procedureCodes: z.array(z.string()),
  diagnosisCodes: z.array(z.string()),
  providerId: z.string(),
  serviceDate: z.string(),
  totalAmount: z.number(),
  attachments: z.array(z.string()).optional(),
  status: z.string(),
  submissionDate: z.string(),
  claimNumber: z.string()
});

const patientDocumentSchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  documentType: z.string(),
  documentUrl: z.string(),
  description: z.string().optional(),
  shareWithProvider: z.boolean(),
  accessToken: z.string(),
  uploadedAt: z.string()
});

const appointmentRequestSchema = z.object({
  id: z.number().optional(),
  patientId: z.number(),
  requestedDates: z.array(z.string()),
  reason: z.string(),
  preferredProvider: z.number().optional(),
  notes: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  status: z.string(),
  createdAt: z.string()
});

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private treatmentPlans: Map<number, TreatmentPlan>;
  private payments: Map<number, Payment>;
  private medicalNotes: Map<number, MedicalNote>;
  private xrays: Map<number, Xray>;
  private financialTransactions: Map<number, FinancialTransaction>;
  private insuranceClaims: Map<number, InsuranceClaim>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.treatmentPlans = new Map();
    this.payments = new Map();
    this.medicalNotes = new Map();
    this.xrays = new Map();
    this.financialTransactions = new Map();
    this.insuranceClaims = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      id,
      ...insertUser,
      language: insertUser.language || "en",
      phoneNumber: insertUser.phoneNumber || null,
      dateOfBirth: insertUser.dateOfBirth || null,
      insuranceProvider: insertUser.insuranceProvider || null,
      insuranceNumber: insertUser.insuranceNumber || null,
      specialization: insertUser.specialization || null,
      licenseNumber: insertUser.licenseNumber || null,
    };
    this.users.set(id, user);
    return user;
  }

  async getPatient(id: number): Promise<(Patient & { user: User }) | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;

    const user = await this.getUser(patient.userId);
    if (!user) return undefined;

    return { ...patient, user };
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentId++;
    const patient: Patient = {
      id,
      userId: insertPatient.userId,
      medicalHistory: insertPatient.medicalHistory || null,
      allergies: insertPatient.allergies || null,
      bloodType: insertPatient.bloodType || null,
      emergencyContact: insertPatient.emergencyContact || null,
    };
    this.patients.set(id, patient);
    return patient;
  }

  async getAllPatients(): Promise<(Patient & { user: User })[]> {
    const patients = Array.from(this.patients.values());
    const patientsWithUsers = await Promise.all(
      patients.map(async (patient) => {
        const user = await this.getUser(patient.userId);
        if (!user) throw new Error(`User not found for patient ${patient.id}`);
        return { ...patient, user };
      })
    );
    return patientsWithUsers;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentId++;
    const appointment = { id, ...insertAppointment };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getDoctorAppointments(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (apt) => apt.doctorId === doctorId,
    );
  }

  async createTreatmentPlan(insertPlan: InsertTreatmentPlan): Promise<TreatmentPlan> {
    const id = this.currentId++;
    const plan = { id, ...insertPlan };
    this.treatmentPlans.set(id, plan);
    return plan;
  }

  async getPatientTreatmentPlans(patientId: number): Promise<TreatmentPlan[]> {
    return Array.from(this.treatmentPlans.values()).filter(
      (plan) => plan.patientId === patientId,
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentId++;
    const payment = { id, ...insertPayment };
    this.payments.set(id, payment);
    return payment;
  }

  async getPatientPayments(patientId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.patientId === patientId,
    );
  }

  async createMedicalNote(insertNote: InsertMedicalNote): Promise<MedicalNote> {
    const id = this.currentId++;
    const note = { id, ...insertNote };
    this.medicalNotes.set(id, note);
    return note;
  }

  async getPatientMedicalNotes(patientId: number, userRole: string): Promise<MedicalNote[]> {
    return Array.from(this.medicalNotes.values()).filter(
      (note) => note.patientId === patientId && (userRole === "doctor" || !note.private)
    );
  }

  async createXray(insertXray: InsertXray): Promise<Xray> {
    const id = this.currentId++;
    const xray = { id, ...insertXray };
    this.xrays.set(id, xray);
    return xray;
  }

  async getPatientXrays(patientId: number): Promise<Xray[]> {
    return Array.from(this.xrays.values()).filter(
      (xray) => xray.patientId === patientId
    );
  }

  async createFinancialTransaction(insertTransaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const id = this.currentId++;
    const transaction = { id, ...insertTransaction };
    this.financialTransactions.set(id, transaction);
    return transaction;
  }

  async createInsuranceClaim(insertClaim: InsertInsuranceClaim): Promise<InsuranceClaim> {
    const id = this.currentId++;
    const claim = { id, ...insertClaim };
    this.insuranceClaims.set(id, claim);
    return claim;
  }

  async getFinancialTransactionsByDateRange(startDate: Date, endDate: Date): Promise<FinancialTransaction[]> {
    return Array.from(this.financialTransactions.values()).filter(
      (t) => t.date >= startDate && t.date <= endDate
    );
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (p) => p.date >= startDate && p.date <= endDate
    );
  }

  async getInsuranceClaimsByDateRange(startDate: Date, endDate: Date): Promise<InsuranceClaim[]> {
    return Array.from(this.insuranceClaims.values()).filter(
      (c) => c.submissionDate >= startDate && c.submissionDate <= endDate
    );
  }

  async getFinancialTransactionsByYear(year: number): Promise<FinancialTransaction[]> {
    return Array.from(this.financialTransactions.values()).filter(
      (t) => new Date(t.date).getFullYear() === year
    );
  }

  async getPatientMedicalHistory(patientId: number) {
    // Placeholder - in a real implementation, this would fetch from database
    // For now returning mock data
    return {
      systemicConditions: ["Type 2 Diabetes", "Hypertension"],
      medications: ["Metformin 500mg", "Lisinopril 10mg", "Aspirin 81mg"],
      allergies: ["Penicillin", "Latex"],
      surgicalHistory: ["Appendectomy (2015)"],
      vitalSigns: {
        bloodPressure: "130/85",
        heartRate: 78
      }
    };
  }

  async updatePatientMedicalHistory(patientId: number, updatedHistory: any) {
    // Placeholder - in a real implementation, this would update the database
    console.log(`Updating medical history for patient ${patientId}`, updatedHistory);
    return true;
  }
}

export const storage = {
  // Patient operations
  async createPatient(data: unknown) {
    const validated = patientSchema.parse(data);
    // Implementation here - in a real app, this would interact with the database
    // This is a placeholder that returns the validated data with a mock ID
    return { ...validated, id: Date.now() };
  },

  async getPatient(id: number) {
    // Implementation here - in a real app, this would fetch from the database
    return { 
      id, 
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1980-01-01",
      medicalHistory: "No significant medical history",
      user: {
        insuranceProvider: "HealthPlus",
        insuranceCoverageDetails: { plan: "Premium", groupId: "12345" }
      }
    };
  },

  async getAllPatients() {
    // Implementation here - in a real app, this would fetch all patients from the database
    return [
      { id: 1, firstName: "John", lastName: "Doe" },
      { id: 2, firstName: "Jane", lastName: "Smith" }
    ];
  },

  async updatePatient(id: number, data: unknown) {
    const validated = patientSchema.partial().parse(data);
    // Implementation here
    return { id, ...validated };
  },

  async deletePatient(id: number) {
    // Implementation here
    return true;
  },

  // Medical history operations
  async getPatientMedicalHistory(patientId: number) {
    // Implementation here
    return {
      conditions: ["Hypertension", "Type 2 Diabetes"],
      allergies: ["Penicillin"],
      medications: ["Lisinopril", "Metformin"],
      surgeries: ["Appendectomy (2010)"],
      familyHistory: "Father had coronary artery disease",
      lastUpdated: new Date().toISOString()
    };
  },

  async updatePatientMedicalHistory(patientId: number, data: any) {
    // Implementation here
    return { patientId, ...data };
  },

  // Medical notes operations
  async createMedicalNote(data: unknown) {
    const validated = medicalNoteSchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getPatientMedicalNotes(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        providerId: 101,
        content: "Patient reports mild tooth sensitivity.",
        date: "2023-05-15T10:30:00Z",
        private: false
      }
    ];
  },

  // X-ray operations
  async createXray(data: unknown) {
    const validated = xraySchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getPatientXrays(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        url: "https://example.com/xrays/12345.jpg",
        date: "2023-05-10T09:15:00Z",
        type: "Panoramic",
        region: "Full mouth",
        notes: "Regular checkup"
      }
    ];
  },

  // Payment operations
  async createPayment(data: unknown) {
    const validated = paymentSchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getPatientPayments(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        amount: 150.00,
        date: "2023-05-20T14:45:00Z",
        method: "credit",
        description: "Routine checkup and cleaning",
        status: "completed",
        createdAt: "2023-05-20T14:45:00Z"
      }
    ];
  },

  async getPaymentsByDateRange(startDate: Date, endDate: Date) {
    // Implementation here
    return [
      {
        id: 1,
        patientId: 1,
        amount: 150.00,
        date: "2023-05-20T14:45:00Z",
        method: "credit",
        description: "Routine checkup and cleaning",
        status: "completed",
        createdAt: "2023-05-20T14:45:00Z"
      }
    ];
  },

  // Appointment operations
  async createAppointment(data: unknown) {
    const validated = appointmentSchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getPatientAppointments(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        providerId: 101,
        date: "2023-06-01T10:00:00Z",
        duration: 30,
        notes: "Regular checkup",
        status: "scheduled"
      }
    ];
  },

  // Treatment plan operations
  async createTreatmentPlan(data: unknown) {
    const validated = treatmentPlanSchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getPatientTreatmentPlans(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        providerId: 101,
        treatments: [
          {
            procedure: "Filling",
            tooth: "16",
            notes: "Composite filling",
            estimatedCost: 200.00,
            priority: "medium"
          }
        ],
        createdAt: "2023-05-15T11:30:00Z",
        status: "active"
      }
    ];
  },

  // Provider operations
  async getProvider(id: number) {
    // Implementation here
    return {
      id,
      firstName: "Sarah",
      lastName: "Johnson",
      specialization: "General Dentist",
      licenseNumber: "DDS12345"
    };
  },

  // Message operations
  async createMessage(data: unknown) {
    const validated = messageSchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getPatientMessages(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        providerId: 101,
        content: "Your next appointment is scheduled for June 1st at 10:00 AM.",
        timestamp: "2023-05-25T09:30:00Z",
        read: true
      }
    ];
  },

  // Insurance claim operations
  async createInsuranceClaim(data: unknown) {
    const validated = insuranceClaimSchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getInsuranceClaimsByDateRange(startDate: Date, endDate: Date) {
    // Implementation here
    return [
      {
        id: 1,
        patientId: 1,
        procedureCodes: ["D1110", "D0150"],
        diagnosisCodes: ["K02.9"],
        providerId: "101",
        serviceDate: "2023-05-15T10:30:00Z",
        totalAmount: 250.00,
        status: "submitted",
        submissionDate: "2023-05-15T15:45:00Z",
        claimNumber: "CLAIM-123456"
      }
    ];
  },

  // Patient document operations
  async createPatientDocument(data: unknown) {
    const validated = patientDocumentSchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getPatientDocuments(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        documentType: "xray",
        documentUrl: "https://example.com/documents/xray123.jpg",
        description: "Panoramic X-ray",
        shareWithProvider: true,
        accessToken: "abcdef123456",
        uploadedAt: "2023-05-10T09:15:00Z"
      }
    ];
  },

  // Appointment request operations
  async createAppointmentRequest(data: unknown) {
    const validated = appointmentRequestSchema.parse(data);
    // Implementation here
    return { ...validated, id: Date.now() };
  },

  async getPatientAppointmentRequests(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        requestedDates: ["2023-06-05T09:00:00Z", "2023-06-06T14:00:00Z"],
        reason: "Toothache",
        preferredProvider: 101,
        urgency: "medium",
        status: "pending",
        createdAt: "2023-05-30T08:45:00Z"
      }
    ];
  },

  // Patient records and treatments
  async getPatientRecords(patientId: number) {
    // Implementation here
    return {
      patientId,
      diagnoses: [
        { id: 1, condition: "Dental caries", date: "2023-04-15T10:30:00Z" }
      ],
      treatments: [
        { id: 1, procedure: "Filling", tooth: "16", date: "2023-04-20T11:00:00Z" }
      ]
    };
  },

  async getPatientTreatments(patientId: number) {
    // Implementation here
    return [
      {
        id: 1,
        patientId,
        procedure: "Filling",
        tooth: "16",
        providerId: 101,
        date: "2023-04-20T11:00:00Z",
        notes: "Composite filling"
      }
    ];
  },

  // Educational resources
  async getEducationalResources(conditions: string[]) {
    // Implementation here
    return [
      {
        id: 1,
        title: "Understanding Dental Caries",
        type: "video",
        url: "https://example.com/videos/dental-caries.mp4",
        description: "An informative guide about dental caries and prevention",
        relatedConditions: ["Dental caries"],
        duration: "5:30"
      }
    ];
  }
};