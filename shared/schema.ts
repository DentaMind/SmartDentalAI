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

export const InsuranceVerificationStatusEnum = z.enum([
  'verified', 'pending', 'failed', 'expired', 'not_covered'
]);

export const OrthodonticCaseStatusEnum = z.enum([
  'evaluation', 'planning', 'aligner_production', 'active_treatment',
  'refinement', 'retention', 'completed', 'discontinued'
]);

// X-ray Types Enum
export const XRayTypeEnum = z.enum([
  'bitewing', 'periapical', 'panoramic', 'cbct', 'endodontic', 'fmx'
]);

// ReminderType enum types
export const ReminderTimeframe = z.enum(['24h', '48h', '1week']);
export const ReminderPriority = z.enum(['low', 'medium', 'high']);
export const ReminderMethod = z.enum(['email', 'sms', 'both']);

// Training and Certification Enums
export const CertificationType = z.enum(['hipaa', 'osha', 'ada', 'cpr', 'infection_control', 'emergency_protocols', 'custom']);
export const CertificationStatus = z.enum(['not_started', 'in_progress', 'completed', 'expired']);

// Schema for a single reminder type configuration
export const reminderTypeSchema = z.object({
  timeframe: ReminderTimeframe,
  priority: ReminderPriority,
  method: ReminderMethod,
  template: z.string().optional(),
});
export type LabCaseStatusType = z.infer<typeof LabCaseStatusEnum>;
export type SupplyOrderStatusType = z.infer<typeof SupplyOrderStatusEnum>;
export type SupplyCategoryType = z.infer<typeof SupplyCategoryEnum>;
export type InsuranceVerificationStatusType = z.infer<typeof InsuranceVerificationStatusEnum>;
export type OrthodonticCaseStatusType = z.infer<typeof OrthodonticCaseStatusEnum>;
export type XRayType = z.infer<typeof XRayTypeEnum>;


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
  specialization: text("specialization"),   // Doctor's specialty
  licenseNumber: text("license_number"),
  officeName: text("office_name"),     // Added for practice letterhead
  officeEmail: text("office_email"),   // Added for practice letterhead
  metadata: jsonb("metadata"), // For storing subscription data and other flexible attributes
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
  gender: text("gender"),
  height: text("height"),
  weight: text("weight"),
  bloodType: text("blood_type"),
  
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
  physicianName: text("physician_name"),
  physicianPhone: text("physician_phone"),
  allergies: text("allergies"),
  pastSurgeries: text("past_surgeries"),
  currentMedications: text("current_medications"),
  adverseAnestheticReaction: boolean("adverse_anesthetic_reaction"),
  hospitalizedRecently: boolean("hospitalized_recently"),
  reasonForHospitalization: text("reason_for_hospitalization"),
  
  // Medical conditions
  hypertension: boolean("hypertension"),
  diabetes: boolean("diabetes"),
  heartDisease: boolean("heart_disease"),
  heartAttack: boolean("heart_attack"),
  heartMurmur: boolean("heart_murmur"),
  pacemaker: boolean("pacemaker"),
  artificialHeart: boolean("artificial_heart"),
  rheumaticFever: boolean("rheumatic_fever"),
  asthma: boolean("asthma"),
  arthritis: boolean("arthritis"),
  cancer: boolean("cancer"),
  stroke: boolean("stroke"),
  kidneyDisease: boolean("kidney_disease"),
  liverDisease: boolean("liver_disease"),
  thyroidDisease: boolean("thyroid_disease"),
  mentalIllness: boolean("mental_illness"),
  seizures: boolean("seizures"),
  epilepsy: boolean("epilepsy"),
  bleedingDisorders: boolean("bleeding_disorders"),
  autoimmune: boolean("autoimmune"),
  hepatitis: boolean("hepatitis"),
  hivAids: boolean("hiv_aids"),
  lungDisease: boolean("lung_disease"),
  osteoporosis: boolean("osteoporosis"),
  dizziness: boolean("dizziness"),
  fainting: boolean("fainting"),
  headaches: boolean("headaches"),
  radiation: boolean("radiation_therapy"),
  chemotherapy: boolean("chemotherapy"),
  chronicPain: boolean("chronic_pain"),
  
  // Lifestyle
  smokesTobacco: boolean("smokes_tobacco"),
  useAlcohol: boolean("use_alcohol"),
  isPregnantOrNursing: boolean("is_pregnant_or_nursing"),
  recreationalDrugs: boolean("recreational_drugs"),
  
  // Dental history
  lastDentalVisit: text("last_dental_visit"),
  reasonForVisitToday: text("reason_for_visit_today"),
  lastDentalExam: text("last_dental_exam"),
  lastDentalXrays: text("last_dental_xrays"),
  whenIssueStarted: text("when_issue_started"),
  experiencedBefore: boolean("experienced_before"),
  chiefComplaint: text("chief_complaint"),
  currentSymptoms: text("current_symptoms"),
  previousDentalProcedures: text("previous_dental_procedures"),
  scaleOfPain: integer("scale_of_pain"), // 1-10 scale
  
  // Dental conditions
  hadGumDisease: boolean("had_gum_disease"),
  hadExtractions: boolean("had_extractions"),
  hadDentalImplants: boolean("had_dental_implants"),
  hadOrthodonticTreatment: boolean("had_orthodontic_treatment"),
  hadRootCanal: boolean("had_root_canal"),
  hadJawPain: boolean("had_jaw_pain"),
  sensitivityToHotCold: boolean("sensitivity_to_hot_cold"),
  troubleWithPreviousDental: boolean("trouble_with_previous_dental"),
  grindTeeth: boolean("grind_teeth"),
  wearDentalAppliance: boolean("wear_dental_appliance"),
  bleedingGums: boolean("bleeding_gums"),
  looseTeeth: boolean("loose_teeth"),
  unpleasantTaste: boolean("unpleasant_taste"),
  badBreath: boolean("bad_breath"),
  dryMouth: boolean("dry_mouth"),
  foodTrap: boolean("food_trap"),
  interestedInCosmetic: boolean("interested_in_cosmetic"),
  
  // Dental anxiety & preferences
  anxietyLevel: text("anxiety_level"), // none, mild, moderate, severe
  painControl: text("pain_control_preference"),
  communicationPreference: text("communication_preference"),
  
  // Advanced questionnaire for AI analysis
  whyDidYouComeInToday: text("why_did_you_come_in_today"),
  howWouldYouRateYourHealth: text("how_would_you_rate_your_health"),
  haveYouHadChangeInHealth: boolean("have_you_had_change_in_health"),
  hospitalizedOrMajorIllness: boolean("hospitalized_or_major_illness"),
  beingTreatedByPhysician: boolean("being_treated_by_physician"),
  dateOfLastMedicalExam: text("date_of_last_medical_exam"),
  dateOfLastDentalExam: text("date_of_last_dental_exam"),
  problemsWithPreviousDental: boolean("problems_with_previous_dental"),
  areYouInPainNow: boolean("are_you_in_pain_now"),
  medicationsBeingTaken: text("medications_being_taken"), // Extended list for AI processing
  
  // Supplementary health information
  maritalStatus: text("marital_status"),
  
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
  checkedIn: boolean("checked_in").default(false),
  checkedInTime: timestamp("checked_in_time"),
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
  metadata: jsonb("metadata"), // DICOM metadata and other technical information
});

// Insurance verification records
export const insuranceVerifications = pgTable("insurance_verifications", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  verificationDate: timestamp("verification_date").defaultNow(),
  status: text("status", { 
    enum: ["verified", "pending", "failed", "expired", "not_covered"] 
  }).notNull().default("pending"),
  insuranceProvider: text("insurance_provider").notNull(),
  memberId: text("member_id").notNull(),
  groupNumber: text("group_number"),
  subscriberName: text("subscriber_name"),
  subscriberRelationship: text("subscriber_relationship"),
  planType: text("plan_type"),
  coverage: jsonb("coverage"), // Store coverage details as JSON
  effectiveDate: timestamp("effective_date"),
  terminationDate: timestamp("termination_date"),
  remainingBenefits: jsonb("remaining_benefits"),
  deductible: jsonb("deductible"),
  verificationDetails: jsonb("verification_details"),
  transactionId: text("transaction_id"),
  verifiedBy: integer("verified_by"),
  nextVerificationDate: timestamp("next_verification_date"),
  alertSent: boolean("alert_sent").default(false),
  alertDate: timestamp("alert_date"),
  notes: text("notes"),
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
    enum: ["active", "completed", "cancelled", "on_hold", "sent_to_pharmacy", "filled"]
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
  // E-Prescription fields
  pharmacyId: integer("pharmacy_id"),
  ePrescriptionSent: boolean("e_prescription_sent").default(false),
  ePrescriptionSentAt: timestamp("e_prescription_sent_at"),
  ePrescriptionResponse: text("e_prescription_response"),
  ePrescriptionConfirmationCode: text("e_prescription_confirmation_code"),
  controlled: boolean("controlled").default(false),
  controlledSubstanceSchedule: text("controlled_substance_schedule"),
  // Digital signature fields for EPCS (Electronic Prescribing of Controlled Substances)
  digitalSignature: text("digital_signature"),
  digitalSignatureTimestamp: timestamp("digital_signature_timestamp"),
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
  metadata: z.any().optional(), // For storing subscription and other flexible data
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
export const insertInsuranceVerificationSchema = createInsertSchema(insuranceVerifications);
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

// Insert schemas for lab & supply ordering tables

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
  possibleConditions: z.array(z.object({
    condition: z.string(),
    confidence: z.number(),
    description: z.string(),
    urgencyLevel: z.enum(["low", "medium", "high", "emergency"]).default("low"),
    recommendations: z.array(z.string()),
    specialistReferral: z.object({
      type: z.string(),
      reason: z.string(),
    }).optional(),
  })).or(z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    description: z.string(),
  }))), // For backward compatibility
  conditions: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    description: z.string(),
  })).optional(), // For backward compatibility
  generalAdvice: z.string().optional(),
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
  }),
  // New fields for vague complaint handling
  isVague: z.boolean().optional(),
  confidenceLevel: z.enum(["low", "medium", "high"]).optional(),
  followUpQuestions: z.array(
    z.object({
      question: z.string(),
      purpose: z.string().optional(),
      targetCondition: z.string().optional(),
      confidenceImpact: z.number().optional(),
    })
  ).optional(),
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

// Training and certification types
export type CertificationTypeEnum = z.infer<typeof CertificationType>;
export type CertificationStatusEnum = z.infer<typeof CertificationStatus>;

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
export type InsuranceVerification = typeof insuranceVerifications.$inferSelect;
export type InsertInsuranceVerification = z.infer<typeof insertInsuranceVerificationSchema>;
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

// Pharmacy and e-prescription types
export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;
export type FavoritePharmacy = typeof favoritePharmacies.$inferSelect;
export type InsertFavoritePharmacy = z.infer<typeof insertFavoritePharmacySchema>;
export type PrescriptionLog = typeof prescriptionLogs.$inferSelect;
export type InsertPrescriptionLog = z.infer<typeof insertPrescriptionLogSchema>;

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

// PHARMACY AND E-PRESCRIPTION TABLES
export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  phone: text("phone").notNull(),
  fax: text("fax"),
  email: text("email"),
  npi: text("npi"), // National Provider Identifier
  ncpdpId: text("ncpdp_id"), // National Council for Prescription Drug Programs ID
  isActive: boolean("is_active").notNull().default(true),
  supportsEPrescription: boolean("supports_e_prescription").default(false),
  supportedEPrescriptionSystem: text("supported_e_prescription_system"),
  apiEndpoint: text("api_endpoint"),
  apiCredentials: jsonb("api_credentials"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const favoritePharmacies = pgTable("favorite_pharmacies", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  pharmacyId: integer("pharmacy_id").notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const prescriptionLogs = pgTable("prescription_logs", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull(),
  action: text("action", {
    enum: ["created", "updated", "sent", "filled", "cancelled", "refilled"]
  }).notNull(),
  performedBy: integer("performed_by").notNull(),
  performedAt: timestamp("performed_at").defaultNow(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Define insert schemas for pharmacy-related tables
export const insertPharmacySchema = createInsertSchema(pharmacies);
export const insertFavoritePharmacySchema = createInsertSchema(favoritePharmacies);
export const insertPrescriptionLogSchema = createInsertSchema(prescriptionLogs);

// PRODUCTION BONUS SYSTEM TABLES

export const bonusGoals = pgTable("bonus_goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  targetAmount: integer("target_amount").notNull(), // In cents
  bonusAmount: integer("bonus_amount").notNull(), // In cents
  goalType: text("goal_type", {
    enum: ["practice", "role", "individual"]
  }).notNull().default("practice"),
  roleType: text("role_type", {
    enum: ["doctor", "staff", "hygienist", "assistant", "frontdesk", "all"]
  }).default("all"),
  userId: integer("user_id"), // For individual goals
  timeframe: text("timeframe", {
    enum: ["daily", "weekly", "monthly", "quarterly", "annual"]
  }).notNull().default("monthly"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  notificationEnabled: boolean("notification_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
});

export const bonusGoalTiers = pgTable("bonus_goal_tiers", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  tierLevel: integer("tier_level").notNull(), // 1, 2, 3, etc.
  targetAmount: integer("target_amount").notNull(), // In cents
  bonusAmount: integer("bonus_amount").notNull(), // In cents
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bonusAchievements = pgTable("bonus_achievements", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  userId: integer("user_id").notNull(),
  tierId: integer("tier_id"),
  achievedAmount: integer("achieved_amount").notNull(), // In cents
  achievedDate: timestamp("achieved_date").notNull().defaultNow(),
  bonusAmount: integer("bonus_amount").notNull(), // In cents
  isPaid: boolean("is_paid").notNull().default(false),
  paidDate: timestamp("paid_date"),
  approvedBy: integer("approved_by"),
  approvedDate: timestamp("approved_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bonusNotifications = pgTable("bonus_notifications", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id"),
  notificationType: text("notification_type", {
    enum: ["approaching", "achieved", "tier_achieved", "goal_completed", "payment_processed"]
  }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// LAB AND SUPPLY ORDERING TABLES

// Table for dental lab cases
export const labCases = pgTable("lab_cases", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  caseNumber: text("case_number").notNull(),
  labId: integer("lab_id").notNull(), // Reference to the vendor_profiles table
  status: text("status").notNull(), // Using LabCaseStatusEnum values
  submissionDate: timestamp("submission_date").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  receivedDate: timestamp("received_date"),
  completedDate: timestamp("completed_date"),
  rushOrder: boolean("rush_order").default(false),
  caseType: text("case_type", { 
    enum: ["crown", "bridge", "denture", "partial", "nightguard", "implant", "veneer", "other"] 
  }).notNull(),
  shade: text("shade"),
  material: text("material"),
  impressionType: text("impression_type", { 
    enum: ["physical", "digital", "cad_cam"] 
  }),
  teethInvolved: jsonb("teeth_involved"), // Array of tooth numbers
  specialInstructions: text("special_instructions"),
  attachments: jsonb("attachments"), // Files like scans or photos
  cost: integer("cost"),
  trackingNumber: text("tracking_number"),
  shippingProvider: text("shipping_provider"),
  qualityRating: integer("quality_rating"), // 1-5 rating after receipt
  remakeRequired: boolean("remake_required").default(false),
  remakeReason: text("remake_reason"),
  notes: text("notes"),
  aiEstimatedCompletionTime: text("ai_estimated_completion_time"),
  treatmentPlanId: integer("treatment_plan_id"),
});

// Table for supply inventory items
export const supplyItems = pgTable("supply_items", {
  id: serial("id").primaryKey(),
  itemName: text("item_name").notNull(),
  sku: text("sku"),
  description: text("description"),
  category: text("category").notNull(), // Using SupplyCategoryEnum values
  currentStock: integer("current_stock").notNull().default(0),
  minimumStockLevel: integer("minimum_stock_level").notNull().default(1),
  reorderPoint: integer("reorder_point").notNull().default(5),
  unitOfMeasure: text("unit_of_measure").notNull(),
  unitPrice: integer("unit_price"),
  preferredVendorId: integer("preferred_vendor_id"), // Reference to vendor_profiles
  alternativeVendorIds: jsonb("alternative_vendor_ids"), // Array of vendor IDs
  locationInOffice: text("location_in_office"),
  expirationDate: date("expiration_date"),
  batchNumber: text("batch_number"),
  lotNumber: text("lot_number"),
  lastOrderDate: timestamp("last_order_date"),
  tags: jsonb("tags"), // Array of tags for searching/filtering
  imageUrl: text("image_url"),
  itemWeight: integer("item_weight"),
  itemDimensions: text("item_dimensions"),
  autoReorder: boolean("auto_reorder").default(false),
  isActive: boolean("is_active").default(true), // Flag for discontinued items
  notes: text("notes"),
  usageFrequency: text("usage_frequency", { 
    enum: ["daily", "weekly", "monthly", "rarely"] 
  }),
  usageHistory: jsonb("usage_history"), // Track usage over time
  aiReorderRecommendation: boolean("ai_reorder_recommendation").default(false),
});

// Table for supply orders
export const supplyOrders = pgTable("supply_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  vendorId: integer("vendor_id").notNull(), // Reference to vendor_profiles
  orderedBy: integer("ordered_by").notNull(), // User ID
  orderDate: timestamp("order_date").defaultNow(),
  status: text("status").notNull(), // Using SupplyOrderStatusEnum values
  items: jsonb("items").notNull(), // Array of { supplyItemId, quantity, unitPrice, notes }
  totalAmount: integer("total_amount").notNull(),
  discountAmount: integer("discount_amount").default(0),
  taxAmount: integer("tax_amount").default(0),
  shippingAmount: integer("shipping_amount").default(0),
  finalAmount: integer("final_amount").notNull(),
  paymentMethod: text("payment_method"),
  paymentTerms: text("payment_terms"),
  paymentStatus: text("payment_status", { 
    enum: ["unpaid", "partially_paid", "paid", "refunded"] 
  }).default("unpaid"),
  shippingMethod: text("shipping_method"),
  trackingNumber: text("tracking_number"),
  estimatedDeliveryDate: date("estimated_delivery_date"),
  actualDeliveryDate: date("actual_delivery_date"),
  shippingAddress: text("shipping_address").notNull(),
  billingAddress: text("billing_address").notNull(),
  notes: text("notes"),
  attachments: jsonb("attachments"), // Invoices, packing slips, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isBulkOrder: boolean("is_bulk_order").default(false),
  isRecurringOrder: boolean("is_recurring_order").default(false),
  recurringSchedule: text("recurring_schedule"), // Monthly, quarterly, etc.
  isAiGenerated: boolean("is_ai_generated").default(false),
});

// Table for supply receipts (uploaded by users)
export const supplyReceipts = pgTable("supply_receipts", {
  id: serial("id").primaryKey(),
  uploadedBy: integer("uploaded_by").notNull(), // User ID
  uploadDate: timestamp("upload_date").defaultNow(),
  receiptImage: text("receipt_image").notNull(), // URL or base64 image
  ocrProcessed: boolean("ocr_processed").default(false),
  extractedText: text("extracted_text"),
  extractedData: jsonb("extracted_data"), // Structured data from OCR
  totalAmount: integer("total_amount"),
  receiptDate: date("receipt_date"),
  vendorName: text("vendor_name"),
  vendorId: integer("vendor_id"), // May be linked to a vendor profile
  categories: jsonb("categories"), // Extracted categories of items
  items: jsonb("items"), // Extracted individual items
  verified: boolean("verified").default(false), // User verified OCR accuracy
  linkedToOrder: boolean("linked_to_order").default(false),
  supplyOrderId: integer("supply_order_id"), // If linked to an order
  notes: text("notes"),
  tags: jsonb("tags"),
});

// Table for vendor profiles
export const vendorProfiles = pgTable("vendor_profiles", {
  id: serial("id").primaryKey(),
  vendorName: text("vendor_name").notNull(),
  vendorType: text("vendor_type", { 
    enum: ["supplies", "lab", "equipment", "service", "other"] 
  }).notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  accountNumber: text("account_number"),
  taxId: text("tax_id"),
  paymentTerms: text("payment_terms"),
  discountTerms: text("discount_terms"),
  shippingTerms: text("shipping_terms"),
  returnPolicy: text("return_policy"),
  preferredVendor: boolean("preferred_vendor").default(false),
  rating: integer("rating"), // 1-5 rating
  categories: jsonb("categories"), // Categories of items they supply
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  logos: text("logos"),
  active: boolean("active").default(true),
  apiIntegrationEnabled: boolean("api_integration_enabled").default(false),
  apiCredentials: jsonb("api_credentials"),
  apiEndpoints: jsonb("api_endpoints"),
});

// TRAINING AND CERTIFICATION TABLES
export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  moduleType: text("module_type", { 
    enum: ["hipaa", "osha", "ada", "cpr", "infection_control", "emergency_protocols", "custom"]
  }).notNull(),
  content: jsonb("content").notNull(), // Structured content with steps, videos, etc.
  steps: jsonb("steps"), // Ordered steps for training
  quizQuestions: jsonb("quiz_questions"), // Quiz at the end of module
  imageUrl: text("image_url"), // Cover image for the module
  requiredRoles: jsonb("required_roles"), // Which roles need this training
  isActive: boolean("is_active").default(true),
  passingScore: integer("passing_score").default(80), // Percentage needed to pass
  estimatedDuration: integer("estimated_duration"), // Minutes
  expirationPeriod: integer("expiration_period"), // Days until certification expires
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userCertifications = pgTable("user_certifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  moduleId: integer("module_id").notNull(),
  status: text("status", { 
    enum: ["not_started", "in_progress", "completed", "expired"] 
  }).notNull().default("not_started"),
  progress: integer("progress").default(0), // Percentage through the module
  currentStep: integer("current_step").default(0),
  score: integer("score"), // Final score
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  attempts: integer("attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  lastAnswers: jsonb("last_answers"), // Store quiz responses
  certificateUrl: text("certificate_url"), // Generated certificate PDF
  quizResults: jsonb("quiz_results"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// ORTHODONTIC TELEHEALTH TABLES

// Table for orthodontic cases
export const orthodonticCases = pgTable("orthodontic_cases", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  caseNumber: text("case_number").notNull(),
  status: text("status").notNull(), // Using OrthodonticCaseStatusEnum values
  startDate: timestamp("start_date").defaultNow(),
  estimatedCompletionDate: date("estimated_completion_date"),
  actualCompletionDate: date("actual_completion_date"),
  treatmentType: text("treatment_type", { 
    enum: ["invisalign", "braces", "clear_aligners", "retainers", "other"] 
  }).notNull(),
  treatmentPlan: jsonb("treatment_plan"), // Detailed treatment steps
  currentAligner: integer("current_aligner"),
  totalAligners: integer("total_aligners"),
  alignerChangeFrequency: integer("aligner_change_frequency"), // Days
  lastAlignmentChange: timestamp("last_alignment_change"),
  nextAlignmentChange: timestamp("next_alignment_change"),
  initialScans: jsonb("initial_scans"), // URLs to initial scans/images
  progressionScans: jsonb("progression_scans"), // Array of { date, urls, notes }
  reminderSettings: jsonb("reminder_settings"), // Patient alignment reminders
  patientCompliance: text("patient_compliance", {
    enum: ["excellent", "good", "fair", "poor"]
  }),
  complianceData: jsonb("compliance_data"), // Tracked aligner wear data
  notes: text("notes"),
  attachments: jsonb("attachments"),
  aiProgressAnalysis: jsonb("ai_progress_analysis"), // AI analysis of progress
  nextCheckupRequired: boolean("next_checkup_required").default(false),
  isInPerson: boolean("is_in_person").default(true),
  isTelehealth: boolean("is_telehealth").default(false),
  treatmentPlanId: integer("treatment_plan_id"),
  labCaseId: integer("lab_case_id"),
});

// Table for orthodontic telehealth sessions
export const orthodonticTelehealthSessions = pgTable("orthodontic_telehealth_sessions", {
  id: serial("id").primaryKey(),
  orthodonticCaseId: integer("orthodontic_case_id").notNull(),
  patientId: integer("patient_id").notNull(), 
  doctorId: integer("doctor_id").notNull(),
  sessionDate: timestamp("session_date").notNull(),
  status: text("status", {
    enum: ["scheduled", "completed", "cancelled", "no_show", "rescheduled"]
  }).notNull().default("scheduled"),
  sessionType: text("session_type", {
    enum: ["regular_checkup", "emergency", "adjustment", "final_review"]
  }).notNull(),
  patientSubmittedImages: jsonb("patient_submitted_images"), // URLs to images
  patientReportedIssues: text("patient_reported_issues"),
  doctorNotes: text("doctor_notes"),
  aiAnalysisResults: jsonb("ai_analysis_results"), // AI analysis of photos
  alignerFit: text("aligner_fit", {
    enum: ["excellent", "good", "fair", "poor", "not_assessed"]
  }),
  treatmentProgress: text("treatment_progress", {
    enum: ["ahead", "on_track", "slightly_behind", "significantly_behind"]
  }),
  adjustmentsRequired: boolean("adjustments_required").default(false),
  adjustmentDetails: text("adjustment_details"),
  inPersonVisitRequired: boolean("in_person_visit_required").default(false),
  nextSessionDate: timestamp("next_session_date"),
  videoChatUrl: text("video_chat_url"),
  videoChatRecording: text("video_chat_recording"),
  sessionDuration: integer("session_duration"), // Minutes
  followUpActions: jsonb("follow_up_actions"),
  reminderSent: boolean("reminder_sent").default(false),
  feedback: jsonb("feedback"), // Patient feedback after session
});

// Create insertion schemas for training and certification
export const insertTrainingModuleSchema = createInsertSchema(trainingModules);
export const insertUserCertificationSchema = createInsertSchema(userCertifications);

// Define types for training and certification
export type TrainingModule = typeof trainingModules.$inferSelect;
export type UserCertification = typeof userCertifications.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type InsertUserCertification = z.infer<typeof insertUserCertificationSchema>;

// Insert schemas for labs, supplies and orthodontics
export const insertLabCaseSchema = createInsertSchema(labCases);
export const insertSupplyItemSchema = createInsertSchema(supplyItems);
export const insertSupplyOrderSchema = createInsertSchema(supplyOrders);
export const insertSupplyReceiptSchema = createInsertSchema(supplyReceipts);
export const insertVendorProfileSchema = createInsertSchema(vendorProfiles);
export const insertOrthodonticCaseSchema = createInsertSchema(orthodonticCases);
export const insertOrthodonticTelehealthSessionSchema = createInsertSchema(orthodonticTelehealthSessions);

// Bonus System insert schemas
export const insertBonusGoalSchema = createInsertSchema(bonusGoals);
export const insertBonusGoalTierSchema = createInsertSchema(bonusGoalTiers);
export const insertBonusAchievementSchema = createInsertSchema(bonusAchievements);
export const insertBonusNotificationSchema = createInsertSchema(bonusNotifications);