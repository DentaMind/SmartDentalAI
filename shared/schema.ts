import { pgTable, text, serial, integer, timestamp, boolean, jsonb, date, decimal, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Lab and Supply Ordering - Enum types
export const LabCaseStatusEnum = z.enum([
  'draft', 'submitted', 'in_progress', 'shipped', 'delivered', 'completed', 'on_hold', 'cancelled'
]);

export const SupplyOrderStatusEnum = z.enum([
  'draft', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
]);

export const SupplyCategoryEnum = z.enum([
  'restorative_materials', 'implant_components', 'orthodontic_supplies',
  'endodontic_materials', 'impression_materials', 'instruments', 'sterilization',
  'ppe', 'office_supplies', 'other'
]);

export const OrthodonticCaseStatusEnum = z.enum([
  'evaluation', 'planning', 'aligner_production', 'active_treatment',
  'refinement', 'retention', 'completed', 'discontinued'
]);

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
  noteType: text("note_type", { enum: ["soap", "procedure", "followup", "consultation", "general"] }).default("general"),
  category: text("category", { enum: ["restorative", "periodontal", "endodontic", "surgical", "prosthodontic", "orthodontic", "pediatric", "general"] }).default("general"),
  attachments: jsonb("attachments"), // Array of file references/URLs
  aiGenerated: boolean("ai_generated").default(false),
  aiSuggestions: jsonb("ai_suggestions"), // AI-suggested additions to the note
  createdAt: timestamp("created_at").defaultNow(),
  private: boolean("private").default(true), // Only visible to doctors
  signedBy: integer("signed_by"), // Doctor who signed off on the note
  signedAt: timestamp("signed_at"),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phoneNumber: text("phone_number"),
  dateOfBirth: text("date_of_birth"),
  homeAddress: text("home_address"),
  occupation: text("occupation"),
  socialSecurityNumber: text("social_security_number"),
  
  // Insurance Information
  insuranceProvider: text("insurance_provider"),
  insuranceNumber: text("insurance_number"),
  insuranceGroupNumber: text("insurance_group_number"),
  insurancePrimaryHolder: text("insurance_primary_holder"),
  insuranceHolderRelation: text("insurance_holder_relation"),
  
  // Emergency contact information
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelationship: text("emergency_contact_relationship"),
  
  // Medical history expanded fields
  medicalHistory: text("medical_history"),
  underPhysicianCare: boolean("under_physician_care"),
  physicianConditions: text("physician_conditions"),
  allergies: text("allergies"),
  pastSurgeries: text("past_surgeries"),
  currentMedications: text("current_medications"),
  adverseAnestheticReaction: boolean("adverse_anesthetic_reaction"),
  hospitalizedRecently: boolean("hospitalized_recently"),
  
  // Medical conditions
  hypertension: boolean("hypertension"),
  diabetes: boolean("diabetes"),
  heartDisease: boolean("heart_disease"),
  asthma: boolean("asthma"),
  arthritis: boolean("arthritis"),
  cancer: boolean("cancer"),
  stroke: boolean("stroke"),
  kidneyDisease: boolean("kidney_disease"),
  liverDisease: boolean("liver_disease"),
  thyroidDisease: boolean("thyroid_disease"),
  mentalIllness: boolean("mental_illness"),
  seizures: boolean("seizures"),
  bleedingDisorders: boolean("bleeding_disorders"),
  autoimmune: boolean("autoimmune"),
  hepatitis: boolean("hepatitis"),
  hivAids: boolean("hiv_aids"),
  lungDisease: boolean("lung_disease"),
  osteoporosis: boolean("osteoporosis"),
  
  // Lifestyle
  smokesTobacco: boolean("smokes_tobacco"),
  useAlcohol: boolean("use_alcohol"),
  isPregnantOrNursing: boolean("is_pregnant_or_nursing"),
  
  // Dental history
  lastDentalVisit: text("last_dental_visit"),
  whenIssueStarted: text("when_issue_started"),
  experiencedBefore: boolean("experienced_before"),
  chiefComplaint: text("chief_complaint"),
  currentSymptoms: text("current_symptoms"),
  previousDentalProcedures: text("previous_dental_procedures"),
  
  // Dental conditions
  hadGumDisease: boolean("had_gum_disease"),
  hadExtractions: boolean("had_extractions"),
  hadDentalImplants: boolean("had_dental_implants"),
  hadOrthodonticTreatment: boolean("had_orthodontic_treatment"),
  hadRootCanal: boolean("had_root_canal"),
  hadJawPain: boolean("had_jaw_pain"),
  sensitivityToHotCold: boolean("sensitivity_to_hot_cold"),
  grindTeeth: boolean("grind_teeth"),
  interestedInCosmetic: boolean("interested_in_cosmetic"),
  
  // Consent forms and agreements
  hipaaConsent: boolean("hipaa_consent"),
  treatmentConsent: boolean("treatment_consent"),
  financialResponsibilityAgreement: boolean("financial_responsibility"),
  assignmentOfBenefits: boolean("assignment_of_benefits"),
  officePolicy: boolean("office_policy"),
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
  procedures: jsonb("procedures").notNull(), // Enhanced to include sequencing information
  cost: integer("cost").notNull(),
  insuranceCoverage: integer("insurance_coverage"),
  patientResponsibility: integer("patient_responsibility"),
  status: text("status", { enum: ["proposed", "accepted", "in_progress", "completed", "cancelled"] }).notNull().default("proposed"),
  createdAt: timestamp("created_at").defaultNow(),
  planName: text("plan_name"), // For multiple treatment plan options (Gold, Standard, etc.)
  planType: text("plan_type", { enum: ["standard", "premium", "insurance_only", "custom"] }),
  signatureRequired: boolean("signature_required").default(true),
  signedByPatient: boolean("signed_by_patient").default(false),
  patientSignatureDate: timestamp("patient_signature_date"),
  patientSignatureImage: text("patient_signature_image"), // Base64 encoded signature
  alternativePlans: jsonb("alternative_plans"), // Store alternative treatment options
  appointmentSequence: jsonb("appointment_sequence"), // Ordered sequence of appointments
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  insuranceVerification: jsonb("insurance_verification"), // Store verification details
  remainingInsuranceBenefits: jsonb("remaining_insurance_benefits"), // Track remaining benefits
  usedInsuranceBenefits: jsonb("used_insurance_benefits"), // Track used benefits
  notes: text("notes"),
  aiRecommendations: jsonb("ai_recommendations"), // AI-generated recommendations
  lastUpdatedBy: integer("last_updated_by"),
});

export const xrays = pgTable("xrays", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  imageUrl: text("image_url").notNull(),
  date: timestamp("date").defaultNow(),
  notes: text("notes"),
  type: text("type").notNull(), // bitewing, periapical, panoramic, cbct
  aiAnalysis: jsonb("ai_analysis"), // AI findings and recommendations
  analysisDate: timestamp("analysis_date"),
  pathologyDetected: boolean("pathology_detected").default(false),
  comparisonResult: jsonb("comparison_result"), // Progression or stability compared to previous
});

// Periodontal chart data
export const periodontalCharts = pgTable("periodontal_charts", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  date: timestamp("date").defaultNow(),
  pocketDepths: jsonb("pocket_depths").notNull(), // Map of tooth number to six measurements per tooth
  bleedingPoints: jsonb("bleeding_points"), // Map of tooth number to six boolean values
  recession: jsonb("recession"), // Map of tooth number to gingival recession measurements
  mobility: jsonb("mobility"), // Map of tooth number to mobility grade (0-3)
  furcation: jsonb("furcation"), // Map of tooth number to furcation involvement
  plaqueIndices: jsonb("plaque_indices"), // Map of tooth number to plaque index
  calculus: jsonb("calculus"), // Map of tooth number to calculus presence
  attachmentLoss: jsonb("attachment_loss"), // Map of tooth number to attachment loss measurements
  diseaseStatus: text("disease_status"), // healthy, gingivitis, periodontitis
  diseaseSeverity: text("disease_severity", { enum: ["none", "mild", "moderate", "severe"] }).default("none"),
  notes: text("notes"),
  aiRecommendations: jsonb("ai_recommendations"),
  comparisonWithPrevious: jsonb("comparison_with_previous"), // Compare with previous chart to track progress
  riskAssessment: text("risk_assessment", { enum: ["low", "moderate", "high"] }), // Periodontal risk assessment
  treatmentRecommendations: jsonb("treatment_recommendations"), // AI-generated treatment recommendations
  lastUpdatedBy: integer("last_updated_by"), // User who last updated the chart
});

// Restorative chart data
export const restorativeCharts = pgTable("restorative_charts", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  date: timestamp("date").defaultNow(),
  teethData: jsonb("teeth_data").notNull(), // Map of tooth number to restoration data
  missingTeeth: jsonb("missing_teeth"), // Array of tooth numbers that are missing
  modifications: jsonb("modifications"), // Track changes to the chart over time
  notes: text("notes"),
  aiRecommendations: jsonb("ai_recommendations"),
  lastUpdatedBy: integer("last_updated_by"),
  status: text("status", { enum: ["proposed", "in_progress", "completed"] }).default("proposed"),
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
  method: text("method", { enum: ["cash", "credit_card", "check", "insurance", "other"] }),
  description: text("description"),
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
  expectedAmount: integer("expected_amount"),
  insuranceProvider: text("insurance_provider"),
  procedures: jsonb("procedures"),
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
  auditTrail: jsonb("audit_trail"), // Track changes for financial compliance
  complianceVerified: boolean("compliance_verified").default(false),
  complianceNotes: text("compliance_notes"),
});

// Legal documents table
export const legalDocuments = pgTable("legal_documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  title: text("title").notNull(),
  documentType: text("document_type", {
    enum: ["consent", "hipaa", "treatment_agreement", "financial_agreement", "release", "other"]
  }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  status: text("status", {
    enum: ["draft", "active", "expired", "revoked"]
  }).notNull().default("draft"),
  signedByPatient: boolean("signed_by_patient").default(false),
  patientSignatureDate: timestamp("patient_signature_date"),
  signedByDoctor: boolean("signed_by_doctor").default(false), 
  doctorId: integer("doctor_id"),
  doctorSignatureDate: timestamp("doctor_signature_date"),
  version: text("version").notNull().default("1.0"),
  metadata: jsonb("metadata"),
});

// Prescription table for medication orders
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  date: timestamp("date").defaultNow(),
  drugName: text("drug_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration").notNull(),
  quantity: text("quantity").notNull(),
  refills: integer("refills").default(0),
  dispensedAs: text("dispensed_as").notNull(),
  notes: text("notes"),
  instructions: text("instructions"),
  status: text("status", {
    enum: ["active", "completed", "cancelled", "on_hold"]
  }).notNull().default("active"),
  reasonForPrescription: text("reason_for_prescription"),
  allergiesChecked: boolean("allergies_checked").default(false),
  interactionsChecked: boolean("interactions_checked").default(false),
  signedBy: integer("signed_by"),
  signedAt: timestamp("signed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
  relatedMedicalNoteId: integer("related_medical_note_id"),
  aiGenerationPrompt: text("ai_generation_prompt"), // Store prompt used for AI generation
  aiGeneratedText: text("ai_generated_text"),       // Store AI generated prescription text
});

// Compliance tracking table
export const complianceRecords = pgTable("compliance_records", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type", {
    enum: ["patient", "practice", "user", "financial", "treatment", "document"]
  }).notNull(),
  entityId: integer("entity_id").notNull(),
  regulationType: text("regulation_type", {
    enum: ["hipaa", "osha", "ada", "state_board", "insurance", "tax", "other"]
  }).notNull(),
  complianceDate: timestamp("compliance_date").defaultNow(),
  expirationDate: timestamp("expiration_date"),
  status: text("status", {
    enum: ["compliant", "non_compliant", "pending_review", "exempted"]
  }).notNull().default("pending_review"),
  verifiedBy: integer("verified_by"),
  verificationDate: timestamp("verification_date"),
  notes: text("notes"),
  attachments: jsonb("attachments"),
  aiRiskAssessment: jsonb("ai_risk_assessment"),
});

// Time clock system
export const timeClock = pgTable("time_clock", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clockInTime: timestamp("clock_in_time").notNull(),
  clockOutTime: timestamp("clock_out_time"),
  workDate: date("work_date").notNull(),
  hoursWorked: integer("hours_worked"),
  notes: text("notes"),
  status: text("status", { 
    enum: ["active", "completed", "approved", "rejected", "modified"] 
  }).notNull().default("active"),
  supervisorId: integer("supervisor_id"),
  locationId: integer("location_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Timeclock report aggregation
export const timeClockReports = pgTable("time_clock_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalHours: integer("total_hours").notNull(),
  status: text("status", { 
    enum: ["pending", "approved", "paid"] 
  }).notNull().default("pending"),
  payrollProcessedDate: timestamp("payroll_processed_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Practice locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  interval: text("interval", { 
    enum: ["monthly", "quarterly", "annual"] 
  }).notNull(),
  features: jsonb("features").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Practice subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  practiceId: integer("practice_id").notNull(),
  planId: integer("plan_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status", { 
    enum: ["active", "canceled", "expired", "pending"] 
  }).notNull().default("active"),
  autoRenew: boolean("auto_renew").notNull().default(true),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const insertPeriodontalChartSchema = createInsertSchema(periodontalCharts);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaims);
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions);
export const insertRestorativeChartSchema = createInsertSchema(restorativeCharts);
export const insertLegalDocumentSchema = createInsertSchema(legalDocuments);
export const insertComplianceRecordSchema = createInsertSchema(complianceRecords);
export const insertPrescriptionSchema = createInsertSchema(prescriptions);

// Insert schemas for new tables
export const insertTimeClockSchema = createInsertSchema(timeClock).extend({
  workDate: z.string().transform(str => new Date(str)),
});
export const insertTimeClockReportSchema = createInsertSchema(timeClockReports);
export const insertLocationSchema = createInsertSchema(locations);
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);

// Appointment request schema
export const appointmentRequestSchema = z.object({
  patientId: z.number(),
  preferredDates: z.array(z.string()),
  preferredTime: z.enum(["morning", "afternoon", "evening"]).optional(),
  appointmentType: z.enum(["examination", "cleaning", "emergency", "followup", "consultation"]),
  symptoms: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  notes: z.string().optional(),
});

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
export type PeriodontalChart = typeof periodontalCharts.$inferSelect;
export type InsertPeriodontalChart = z.infer<typeof insertPeriodontalChartSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type InsertInsuranceClaim = z.infer<typeof insertInsuranceClaimSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type RestorativeChart = typeof restorativeCharts.$inferSelect;
export type InsertRestorativeChart = z.infer<typeof insertRestorativeChartSchema>;
export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;
export type ComplianceRecord = typeof complianceRecords.$inferSelect;
export type InsertComplianceRecord = z.infer<typeof insertComplianceRecordSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

// New types for the additional tables
export type TimeClock = typeof timeClock.$inferSelect;
export type InsertTimeClock = z.infer<typeof insertTimeClockSchema>;
export type TimeClockReport = typeof timeClockReports.$inferSelect;
export type InsertTimeClockReport = z.infer<typeof insertTimeClockReportSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type AppointmentRequest = z.infer<typeof appointmentRequestSchema>;

// New types for Lab & Supply Management
export type LabCase = typeof labCases.$inferSelect;
export type InsertLabCase = z.infer<typeof insertLabCaseSchema>;
export type SupplyItem = typeof supplyItems.$inferSelect;
export type InsertSupplyItem = z.infer<typeof insertSupplyItemSchema>;
export type SupplyOrder = typeof supplyOrders.$inferSelect;
export type InsertSupplyOrder = z.infer<typeof insertSupplyOrderSchema>;
export type SupplyReceipt = typeof supplyReceipts.$inferSelect;
export type InsertSupplyReceipt = z.infer<typeof insertSupplyReceiptSchema>;
export type VendorProfile = typeof vendorProfiles.$inferSelect;
export type InsertVendorProfile = z.infer<typeof insertVendorProfileSchema>;
export type OrthodonticCase = typeof orthodonticCases.$inferSelect;
export type InsertOrthodonticCase = z.infer<typeof insertOrthodonticCaseSchema>;
export type OrthodonticTelehealthSession = typeof orthodonticTelehealthSessions.$inferSelect;
export type InsertOrthodonticTelehealthSession = z.infer<typeof insertOrthodonticTelehealthSessionSchema>;