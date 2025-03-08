import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ReminderType enum types
export const ReminderTimeframe = z.enum(['24h', '48h', '1week']);
export const ReminderPriority = z.enum(['low', 'medium', 'high']);
export const ReminderMethod = z.enum(['email', 'sms', 'both']);

// Schema for a single reminder type configuration
export const reminderTypeSchema = z.object({
  timeframe: ReminderTimeframe,
  priority: ReminderPriority,
  method: ReminderMethod,
  template: z.string().optional(),
});

// Schema for complete reminder settings
export const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  reminderTypes: z.array(reminderTypeSchema),
});

// Schema for reminder stats
export const reminderStatsSchema = z.object({
  lastRunTime: z.string(),
  remindersSentToday: z.number(),
  remindersSentThisWeek: z.number(),
  deliveryStats: z.object({
    email: z.object({
      sent: z.number(),
      opened: z.number(),
      failureRate: z.number(),
    }),
    sms: z.object({
      sent: z.number(),
      delivered: z.number(),
      failureRate: z.number(),
    }),
  }),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["doctor", "staff", "patient"] }).notNull().default("patient"),
  language: text("language").notNull().default("en"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  dateOfBirth: text("date_of_birth"),
  insuranceProvider: text("insurance_provider"),
  insuranceNumber: text("insurance_number"),
  specialization: text("specialization"),
  licenseNumber: text("license_number"),
});

export const medicalNotes = pgTable("medical_notes", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  private: boolean("private").default(true), // Only visible to doctors
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  bloodType: text("blood_type"),
  emergencyContact: text("emergency_contact"),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status", { enum: ["scheduled", "confirmed", "completed", "cancelled"] }).notNull().default("scheduled"),
  notes: text("notes"),
  isOnline: boolean("is_online").default(false),
  insuranceVerified: boolean("insurance_verified").default(false),
});

export const treatmentPlans = pgTable("treatment_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  diagnosis: text("diagnosis").notNull(),
  procedures: jsonb("procedures").notNull(),
  cost: integer("cost").notNull(),
  insuranceCoverage: integer("insurance_coverage"),
  patientResponsibility: integer("patient_responsibility"),
  status: text("status", { enum: ["proposed", "accepted", "in_progress", "completed", "cancelled"] }).notNull().default("proposed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const xrays = pgTable("xrays", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  imageUrl: text("image_url").notNull(),
  date: timestamp("date").defaultNow(),
  notes: text("notes"),
  type: text("type").notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  amount: integer("amount").notNull(),
  insuranceAmount: integer("insurance_amount"),
  patientAmount: integer("patient_amount"),
  date: timestamp("date").defaultNow(),
  status: text("status", { enum: ["pending", "processed", "failed"] }).notNull().default("pending"),
  treatmentPlanId: integer("treatment_plan_id"),
  transactionId: integer("transaction_id"),
  insuranceClaimId: integer("insurance_claim_id"),
  writeOffAmount: integer("write_off_amount"),
  adjustmentReason: text("adjustment_reason"),
  postedDate: timestamp("posted_date"),
  checkNumber: text("check_number"),
  paymentPlan: boolean("payment_plan").default(false),
  paymentPlanDetails: jsonb("payment_plan_details"),
});

export const insuranceClaims = pgTable("insurance_claims", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  treatmentPlanId: integer("treatment_plan_id").notNull(),
  submissionDate: timestamp("submission_date").notNull().defaultNow(),
  status: text("status", {
    enum: ["submitted", "in_review", "approved", "denied", "partially_approved"]
  }).notNull().default("submitted"),
  claimNumber: text("claim_number"),
  preAuthNumber: text("pre_auth_number"),
  approvedAmount: integer("approved_amount"),
  denialReason: text("denial_reason"),
  insuranceNotes: text("insurance_notes"),
  followUpDate: timestamp("follow_up_date"),
});

export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  type: text("type", {
    enum: ["payment", "refund", "adjustment", "insurance_payment"]
  }).notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  method: text("method", {
    enum: ["cash", "credit_card", "check", "insurance", "other"]
  }).notNull(),
  status: text("status", {
    enum: ["pending", "completed", "failed", "voided"]
  }).notNull().default("pending"),
  referenceNumber: text("reference_number"),
  description: text("description"),
  categoryCode: text("category_code"),
  fiscalYear: integer("fiscal_year").notNull(),
  fiscalQuarter: integer("fiscal_quarter").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).extend({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["doctor", "staff", "patient"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  insuranceProvider: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
});

export const insertPatientSchema = createInsertSchema(patients);
export const insertAppointmentSchema = createInsertSchema(appointments);
export const insertTreatmentPlanSchema = createInsertSchema(treatmentPlans);
export const insertMedicalNoteSchema = createInsertSchema(medicalNotes);
export const insertXraySchema = createInsertSchema(xrays);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaims);
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions);

// Add new AI-related schemas
export const symptomPredictionSchema = z.object({
  conditions: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    description: z.string(),
  })),
  urgencyLevel: z.enum(["low", "medium", "high"]),
  recommendedTests: z.array(z.string()),
  aiDomains: z.object({
    periodontics: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    endodontics: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    restorative: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    prosthodontics: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    oralSurgery: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    imaging: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    medicalHistory: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
  })
});

// Define PatientMedicalHistory type
export interface PatientMedicalHistory {
  systemicConditions?: string[];
  medications?: string[];
  allergies?: string[];
  surgicalHistory?: string[];
  familyHistory?: string[];
  smoking?: boolean;
  alcohol?: boolean;
  pregnancyStatus?: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
  };
}

export type SymptomPrediction = z.infer<typeof symptomPredictionSchema>;

// Reminder type definitions
export type ReminderTimeframeType = z.infer<typeof ReminderTimeframe>;
export type ReminderPriorityType = z.infer<typeof ReminderPriority>;
export type ReminderMethodType = z.infer<typeof ReminderMethod>;
export type ReminderType = z.infer<typeof reminderTypeSchema>;
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;
export type ReminderStats = z.infer<typeof reminderStatsSchema>;

// Combined type with settings and stats
export type CompleteReminderSettings = ReminderSettings & ReminderStats;

// Reminder log type
export interface ReminderLog {
  id: string;
  timestamp: string;
  patientId: number;
  patientName: string;
  timeframe: ReminderTimeframeType;
  sentTo: string;
  status: 'delivered' | 'sent' | 'opened' | 'failed';
  method: 'email' | 'sms';
  appointmentId: number;
}

export interface ReminderLogResponse {
  items: ReminderLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type TreatmentPlan = typeof treatmentPlans.$inferSelect;
export type InsertTreatmentPlan = z.infer<typeof insertTreatmentPlanSchema>;
export type MedicalNote = typeof medicalNotes.$inferSelect;
export type InsertMedicalNote = z.infer<typeof insertMedicalNoteSchema>;
export type Xray = typeof xrays.$inferSelect;
export type InsertXray = z.infer<typeof insertXraySchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type InsertInsuranceClaim = z.infer<typeof insertInsuranceClaimSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;