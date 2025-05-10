import { 
  User, InsertUser, Patient, InsertPatient, Appointment, InsertAppointment,
  MedicalNote, InsertMedicalNote, Diagnosis, InsertDiagnosis, TreatmentPlan,
  InsertTreatmentPlan, Xray, InsertXray, InsuranceVerification, InsertInsuranceVerification,
  PeriodontalChart, InsertPeriodontalChart, Payment, InsertPayment, InsuranceClaim,
  InsertInsuranceClaim, FinancialTransaction, InsertFinancialTransaction, RestorativeChart,
  InsertRestorativeChart, LegalDocument, InsertLegalDocument, ComplianceRecord,
  InsertComplianceRecord, Prescription, InsertPrescription, Pharmacy, InsertPharmacy,
  FavoritePharmacy, InsertFavoritePharmacy, PrescriptionLog, InsertPrescriptionLog,
  TimeClock, InsertTimeClock, TimeClockReport, InsertTimeClockReport, Location,
  InsertLocation, SubscriptionPlan, InsertSubscriptionPlan, Subscription,
  InsertSubscription, LabCase, InsertLabCase, SupplyItem, InsertSupplyItem,
  SupplyOrder, InsertSupplyOrder, SupplyReceipt, InsertSupplyReceipt, VendorProfile,
  InsertVendorProfile, OrthodonticCase, InsertOrthodonticCase, OrthodonticTelehealthSession,
  InsertOrthodonticTelehealthSession, RestorativeChartEntry, InsertRestorativeChartEntry,
  PerioChartEntry, InsertPerioChartEntry, XrayAiFinding, InsertXrayAiFinding,
  ChartingNote, InsertChartingNote, TrainingModule, InsertTrainingModule,
  UserCertification, InsertUserCertification, UserTrainingNote, InsertUserTrainingNote,
  BonusGoal, InsertBonusGoal, BonusGoalTier, InsertBonusGoalTier, BonusAchievement,
  InsertBonusAchievement, BonusNotification, InsertBonusNotification, AiModelVersion,
  InsertAiModelVersion, AiModelAuditLog, InsertAiModelAuditLog, AiFeedbackQueue,
  InsertAiFeedbackQueue, AiTriageResult, InsertAiTriageResult, TokenBlacklist,
  InsertTokenBlacklist, Notification as SchemaNotification, InsertNotification,
  NotificationPreferences, NotificationSettings, OverrideReview, ReviewAuditEntry,
  DiagnosisFeedback, InsertDiagnosisFeedback
} from '../shared/schema.js';
import { InsuranceVerificationStatusEnum } from '../shared/schema.js';
import { VersionComparisonAuditLog, AuditLogQuery } from './types/audit.js';

interface Notification extends SchemaNotification {
  id: number;
  userId: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

interface AuditLog {
  id: string;
  entityType: string;
  entityId: number;
  action: 'create' | 'update' | 'delete';
  userId: number;
  timestamp: Date;
  changes: Record<string, unknown>;
}

// Define base entity types
type BaseEntityType = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};

// Define entity type literals
const ENTITY_TYPES = [
  'user',
  'patient',
  'appointment',
  'medicalNote',
  'diagnosis',
  'treatmentPlan',
  'xray',
  'insuranceVerification',
  'periodontalChart',
  'payment',
  'insuranceClaim',
  'financialTransaction',
  'restorativeChart',
  'legalDocument',
  'complianceRecord',
  'prescription',
  'pharmacy',
  'favoritePharmacy',
  'prescriptionLog',
  'timeClock',
  'timeClockReport',
  'location',
  'subscriptionPlan',
  'subscription',
  'labCase',
  'supplyItem',
  'supplyOrder',
  'supplyReceipt',
  'vendorProfile',
  'orthodonticCase',
  'orthodonticTelehealthSession',
  'restorativeChartEntry',
  'perioChartEntry',
  'xrayAiFinding',
  'chartingNote',
  'trainingModule',
  'userCertification',
  'userTrainingNote',
  'bonusGoal',
  'bonusGoalTier',
  'bonusAchievement',
  'bonusNotification',
  'aiModelVersion',
  'aiModelAuditLog',
  'aiFeedbackQueue',
  'aiTriageResult',
  'tokenBlacklist',
  'notification',
  'diagnosis_audit_log',
  'diagnosis_feedback',
  'notification_preferences',
  'override_review',
  'review_audit'
] as const;

type EntityType = typeof ENTITY_TYPES[number];

// Update EntityTypeMap to use BaseEntityType
type EntityTypeMap = {
  'user': User;
  'patient': Patient;
  'appointment': Appointment;
  'medicalNote': MedicalNote;
  'diagnosis': Diagnosis;
  'treatmentPlan': TreatmentPlan;
  'xray': Xray;
  'insuranceVerification': InsuranceVerification;
  'periodontalChart': PeriodontalChart;
  'payment': Payment;
  'insuranceClaim': InsuranceClaim;
  'financialTransaction': FinancialTransaction;
  'restorativeChart': RestorativeChart;
  'legalDocument': LegalDocument;
  'complianceRecord': ComplianceRecord;
  'prescription': Prescription;
  'pharmacy': Pharmacy;
  'favoritePharmacy': FavoritePharmacy;
  'prescriptionLog': PrescriptionLog;
  'timeClock': TimeClock;
  'timeClockReport': TimeClockReport;
  'location': Location;
  'subscriptionPlan': SubscriptionPlan;
  'subscription': Subscription;
  'labCase': LabCase;
  'supplyItem': SupplyItem;
  'supplyOrder': SupplyOrder;
  'supplyReceipt': SupplyReceipt;
  'vendorProfile': VendorProfile;
  'orthodonticCase': OrthodonticCase;
  'orthodonticTelehealthSession': OrthodonticTelehealthSession;
  'restorativeChartEntry': RestorativeChartEntry;
  'perioChartEntry': PerioChartEntry;
  'xrayAiFinding': XrayAiFinding;
  'chartingNote': ChartingNote;
  'trainingModule': TrainingModule;
  'userCertification': UserCertification;
  'userTrainingNote': UserTrainingNote;
  'bonusGoal': BonusGoal;
  'bonusGoalTier': BonusGoalTier;
  'bonusAchievement': BonusAchievement;
  'bonusNotification': BonusNotification;
  'aiModelVersion': AiModelVersion;
  'aiModelAuditLog': AiModelAuditLog;
  'aiFeedbackQueue': AiFeedbackQueue;
  'aiTriageResult': AiTriageResult;
  'tokenBlacklist': TokenBlacklist;
  'notification': SchemaNotification;
  'notification_preferences': NotificationPreferences;
  'override_review': OverrideReview;
  'review_audit': ReviewAuditEntry;
  'diagnosis_audit_log': AuditLog;
  'diagnosis_feedback': {
    id: number;
    diagnosisId: number;
    providerId: number;
    feedback: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

// Define EntityMap to map entity types to their storage maps
type EntityMap = {
  [K in EntityType]: Map<number, EntityTypeMap[K]>;
};

// Update InsertEntityTypeMap to include all entity types
type InsertEntityTypeMap = {
  'user': InsertUser;
  'patient': InsertPatient;
  'appointment': InsertAppointment;
  'medicalNote': InsertMedicalNote;
  'diagnosis': InsertDiagnosis;
  'treatmentPlan': InsertTreatmentPlan;
  'xray': InsertXray;
  'insuranceVerification': InsertInsuranceVerification;
  'periodontalChart': InsertPeriodontalChart;
  'payment': InsertPayment;
  'insuranceClaim': InsertInsuranceClaim;
  'financialTransaction': InsertFinancialTransaction;
  'restorativeChart': InsertRestorativeChart;
  'legalDocument': InsertLegalDocument;
  'complianceRecord': InsertComplianceRecord;
  'prescription': InsertPrescription;
  'pharmacy': InsertPharmacy;
  'favoritePharmacy': InsertFavoritePharmacy;
  'prescriptionLog': InsertPrescriptionLog;
  'timeClock': InsertTimeClock;
  'timeClockReport': InsertTimeClockReport;
  'location': InsertLocation;
  'subscriptionPlan': InsertSubscriptionPlan;
  'subscription': InsertSubscription;
  'labCase': InsertLabCase;
  'supplyItem': InsertSupplyItem;
  'supplyOrder': InsertSupplyOrder;
  'supplyReceipt': InsertSupplyReceipt;
  'vendorProfile': InsertVendorProfile;
  'orthodonticCase': InsertOrthodonticCase;
  'orthodonticTelehealthSession': InsertOrthodonticTelehealthSession;
  'restorativeChartEntry': InsertRestorativeChartEntry;
  'perioChartEntry': InsertPerioChartEntry;
  'xrayAiFinding': InsertXrayAiFinding;
  'chartingNote': InsertChartingNote;
  'trainingModule': InsertTrainingModule;
  'userCertification': InsertUserCertification;
  'userTrainingNote': InsertUserTrainingNote;
  'bonusGoal': InsertBonusGoal;
  'bonusGoalTier': InsertBonusGoalTier;
  'bonusAchievement': InsertBonusAchievement;
  'bonusNotification': InsertBonusNotification;
  'aiModelVersion': InsertAiModelVersion;
  'aiModelAuditLog': InsertAiModelAuditLog;
  'aiFeedbackQueue': InsertAiFeedbackQueue;
  'aiTriageResult': InsertAiTriageResult;
  'tokenBlacklist': InsertTokenBlacklist;
  'notification': InsertNotification;
  'notification_preferences': Omit<NotificationPreferences, keyof BaseEntityType>;
  'override_review': Omit<OverrideReview, keyof BaseEntityType>;
  'review_audit': Omit<ReviewAuditEntry, keyof BaseEntityType>;
  'diagnosis_audit_log': Omit<AuditLog, keyof BaseEntityType>;
  'diagnosis_feedback': Omit<DiagnosisFeedback, keyof BaseEntityType>;
};

// Entity factory helper
const createEntityFactory = <T extends BaseEntityType>() => {
  return (
    nextId: () => number,
    deepClone: <U>(obj: U) => U,
    map: Map<number, T>,
    data: Omit<T, keyof BaseEntityType>,
    extras: Partial<T> = {}
  ): T => {
    const id = nextId();
    const now = new Date();
    const entity = {
      ...data,
      ...extras,
      id,
      createdAt: now,
      updatedAt: now
    } as T;
    map.set(id, entity);
    return entity;
  };
};

export class MemStorage {
  private entityMaps: EntityMap = Object.fromEntries(
    ENTITY_TYPES.map(type => [type, new Map()])
  ) as EntityMap;
  private auditLogs: Map<string, AuditLog> = new Map();
  private nextIds: Partial<Record<EntityType, number>> = {};
  private notificationPreferencesMap = new Map<number, NotificationPreferences>();
  private notifications: Map<number, Notification> = new Map();
  private overrideReviews: Map<number, OverrideReview> = new Map();
  private reviewAuditHistory: Map<number, ReviewAuditEntry[]> = new Map();
  private notificationSettings: Map<number, NotificationSettings> = new Map();

  constructor() {
    // Initialize entity maps
    ENTITY_TYPES.forEach(type => {
      this.entityMaps[type] = new Map();
      this.nextIds[type] = 1;
    });

    this.initializeTestData();
  }

  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as T;
    }

    const clone = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = this.deepClone(obj[key]);
      }
    }

    return clone;
  }

  private async initializeTestData() {
    // Create test doctor
    const doctor = await this.create('user', {
      username: 'doctor1',
      password: 'password123',
      role: 'doctor',
      language: 'en',
      firstName: 'John',
      lastName: 'Doe',
      email: 'doctor@example.com',
      phoneNumber: '1234567890',
      dateOfBirth: '1980-01-01',
      specialization: 'General Dentistry',
      licenseNumber: 'D12345',
      officeName: 'Dental Clinic',
      officeEmail: 'clinic@example.com',
      insuranceProvider: null,
      insuranceNumber: null,
      metadata: {}
    });

    // Create test patient
    const patient = await this.create('patient', {
      userId: 1,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'patient@example.com',
      phone: '0987654321',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      address: '123 Main St',
      medicalHistory: 'No significant medical history',
      insuranceProvider: 'Blue Cross',
      insuranceId: 'BC123456',
      lastVisit: null,
      nextAppointment: null,
      preferredCommunication: 'email',
      allergies: [],
      medications: [],
      conditions: [],
      notes: '',
      emergencyContact: {
        name: 'John Smith',
        relationship: 'Spouse',
        phone: '1112223333'
      }
    });

    // Create test appointment
    const appointment = await this.create('appointment', {
      patientId: 1,
      doctorId: 1,
      date: new Date(),
      status: 'scheduled',
      notes: 'Initial consultation',
      checkedIn: false,
      checkedInTime: null,
      isOnline: false,
      insuranceVerified: false
    });

    // Create test notification
    await this.notify(
      appointment.doctorId,
      'appointment_reminder',
      'You have an appointment tomorrow',
      {
        appointmentId: appointment.id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    );
  }

  private getNextId(entityType: EntityType): number {
    const map = this.entityMaps[entityType];
    return map.size + 1;
  }

  private getDiff<T extends Record<string, any>>(original: T, updated: Partial<T>): Partial<T> {
    const diff: Partial<T> = {};
    for (const key in updated) {
      if (updated[key] !== original[key]) {
        diff[key] = updated[key];
      }
    }
    return diff;
  }

  private async createEntity<K extends EntityType>(
    type: K,
    data: Omit<EntityTypeMap[K], keyof BaseEntityType>
  ): Promise<EntityTypeMap[K]> {
    const nextId = () => this.getNextId(type);
    const map = this.entityMaps[type];
    const factory = createEntityFactory<EntityTypeMap[K]>();
    const entity = factory(nextId, this.deepClone, map, data);
    return entity;
  }

  async create<K extends EntityType>(
    type: K,
    data: Omit<EntityTypeMap[K], keyof BaseEntityType>
  ): Promise<EntityTypeMap[K]> {
    return this.createEntity(type, data);
  }

  async getEntity<K extends EntityType>(
    type: K,
    id: number
  ): Promise<EntityTypeMap[K] | undefined> {
    return this.entityMaps[type].get(id);
  }

  async updateEntity<K extends EntityType>(
    type: K,
    id: number,
    updates: Partial<Omit<EntityTypeMap[K], keyof BaseEntityType>>
  ): Promise<EntityTypeMap[K] | undefined> {
    const map = this.entityMaps[type];
    const existing = map.get(id);
    if (!existing) return undefined;

    const now = new Date();
    const updated = {
      ...existing,
      ...updates,
      updatedAt: now
    } as EntityTypeMap[K];

    map.set(id, updated);
    return updated;
  }

  async deleteEntity<K extends EntityType>(
    type: K,
    id: number
  ): Promise<boolean> {
    const entity = this.entityMaps[type].get(id);
    if (!entity) return false;

    this.entityMaps[type].delete(id);

    this.auditLogs.set(id.toString(), {
      id: id.toString(),
      entityType: type,
      entityId: id,
      action: 'delete',
      userId: 1, // TODO: Get actual user ID
      timestamp: new Date().toISOString()
    });

    return true;
  }

  async queryEntities<K extends EntityType>(
    type: K,
    query: Partial<EntityTypeMap[K]>
  ): Promise<EntityTypeMap[K][]> {
    const entities = Array.from(this.entityMaps[type].values());
    return entities.filter(entity => {
      for (const key in query) {
        if (entity[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  // Public methods for entity operations
  async get<K extends EntityType>(
    type: K,
    id: number
  ): Promise<EntityTypeMap[K] | undefined> {
    return this.getEntity(type, id);
  }

  async filter<K extends EntityType>(
    type: K,
    filter: (item: EntityTypeMap[K]) => boolean
  ): Promise<EntityTypeMap[K][]> {
    return Array.from(this.entityMaps[type].values()).filter(filter);
  }

  // Convenience methods for common operations
  async getUser(id: number): Promise<User | undefined> {
    return this.get(EntityType.User, id);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.get(EntityType.Patient, id);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.get(EntityType.Appointment, id);
  }

  async getDiagnosis(id: number): Promise<Diagnosis | undefined> {
    return this.get(EntityType.Diagnosis, id);
  }

  async getTreatmentPlan(id: number): Promise<TreatmentPlan | undefined> {
    return this.get(EntityType.TreatmentPlan, id);
  }

  async getMedicalNote(id: number): Promise<MedicalNote | undefined> {
    return this.get(EntityType.MedicalNote, id);
  }

  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    return this.update(EntityType.User, id, updates);
  }

  async updatePatient(id: number, updates: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<Patient | undefined> {
    return this.update(EntityType.Patient, id, updates);
  }

  async updateAppointment(id: number, updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<Appointment | undefined> {
    return this.update(EntityType.Appointment, id, updates);
  }

  async updateDiagnosis(id: number, updates: Partial<Omit<Diagnosis, 'id' | 'createdAt'>>): Promise<Diagnosis | undefined> {
    return this.update(EntityType.Diagnosis, id, updates);
  }

  async updateTreatmentPlan(id: number, updates: Partial<Omit<TreatmentPlan, 'id' | 'createdAt'>>): Promise<TreatmentPlan | undefined> {
    return this.update(EntityType.TreatmentPlan, id, updates);
  }

  async updateMedicalNote(id: number, updates: Partial<Omit<MedicalNote, 'id' | 'createdAt'>>): Promise<MedicalNote | undefined> {
    return this.update(EntityType.MedicalNote, id, updates);
  }

  // Specific entity creation methods
  createUser(data: InsertUser): User {
    return this.createEntity('user', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createPatient(data: InsertPatient): Patient {
    return this.createEntity('patient', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createAppointment(data: InsertAppointment): Appointment {
    return this.createEntity('appointment', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createDiagnosis(data: InsertDiagnosis): Diagnosis {
    return this.createEntity('diagnosis', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createTreatmentPlan(treatmentPlan: InsertTreatmentPlan): TreatmentPlan {
    return this.createEntity('treatmentPlan', treatmentPlan);
  }

  createMedicalNote(data: InsertMedicalNote): MedicalNote {
    return this.createEntity('medicalNote', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createPayment(payment: InsertPayment): Payment {
    return this.createEntity('payment', payment);
  }

  createXray(xray: InsertXray): Xray {
    return this.createEntity('xray', xray);
  }

  createInsuranceClaim(data: InsertInsuranceClaim): InsuranceClaim {
    return this.createEntity('insuranceClaim', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createFinancialTransaction(data: InsertFinancialTransaction): FinancialTransaction {
    return this.createEntity('financialTransaction', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createInsuranceVerification(verification: InsertInsuranceVerification): InsuranceVerification {
    return this.createEntity('insuranceVerification', verification);
  }

  createPeriodontalChart(data: InsertPeriodontalChart): PeriodontalChart {
    return this.createEntity('periodontalChart', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createRestorativeChart(data: InsertRestorativeChart): RestorativeChart {
    return this.createEntity('restorativeChart', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createOrthodonticCase(orthodonticCase: InsertOrthodonticCase): OrthodonticCase {
    return this.createEntity('orthodonticCase', orthodonticCase);
  }

  createNotification(notification: Notification): Notification {
    this.notifications.set(notification.id, notification);
    return notification;
  }

  createLegalDocument(data: InsertLegalDocument): LegalDocument {
    return this.createEntity('legalDocument', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  createComplianceRecord(data: InsertComplianceRecord): ComplianceRecord {
    return this.createEntity('complianceRecord', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Initialize user from database
  async initializeUserFromDb(user: User): Promise<void> {
    console.log(`Initializing user from DB: ${user.username} (ID: ${user.id})`);
    if (user.id >= this.getNextId(EntityType.User)) {
      this.nextIds[EntityType.User] = user.id + 1;
    }
    this.entityMaps[EntityType.User].set(user.id, user);
  }
  
  // Initialize patient from database
  async initializePatientFromDb(patient: Patient): Promise<void> {
    console.log(`Initializing patient from DB: ID ${patient.id}`);
    if (patient.id >= this.getNextId(EntityType.Patient)) {
      this.nextIds[EntityType.Patient] = patient.id + 1;
    }
    this.entityMaps[EntityType.Patient].set(patient.id, patient);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.entityMaps[EntityType.User].values()).find(
      (user) => user.username === username,
    );
  }

  async getAllPatients(): Promise<(Patient & { user: User })[]> {
    console.log("Getting all patients from storage");
    console.log("Patients map size:", this.entityMaps[EntityType.Patient].size);
    
    const patients = Array.from(this.entityMaps[EntityType.Patient].values());
    console.log("Patients array length:", patients.length);
    
    // Process each patient separately and collect the results
    // This prevents one bad record from breaking the entire request
    const patientsWithUsers: (Patient & { user: User })[] = [];
    
    for (const patient of patients) {
      try {
        console.log(`Processing patient ${patient.id} with userId ${patient.userId}`);
        const user = await this.getUser(patient.userId);
        
        if (!user) {
          // Instead of throwing an error, create a minimal user record
          console.warn(`User not found for patient ${patient.id} with userId ${patient.userId}, using placeholder`);
          const placeholderUser: User = {
            id: patient.userId,
            username: `patient-${patient.id}`,
            password: "",
            email: "",
            firstName: "Unknown",
            lastName: "Patient",
            role: "patient",
            language: "en",
            createdAt: new Date(),
            updatedAt: new Date(),
            specialization: null,
            mfaEnabled: false,
            licenseNumber: null,
            phoneNumber: null,
            dateOfBirth: null,
            insuranceProvider: null,
            insuranceNumber: null,
            officeName: null,
            officeEmail: null
          };
          patientsWithUsers.push({ ...patient, user: placeholderUser });
        } else {
          console.log(`Found user for patient ${patient.id}:`, user.username);
          patientsWithUsers.push({ ...patient, user });
        }
      } catch (error) {
        // Log the error but continue processing other patients
        console.error(`Error processing patient ${patient.id}:`, error);
        // Skip this patient rather than breaking the entire function
      }
    }
    
    console.log(`Successfully processed ${patientsWithUsers.length} out of ${patients.length} patients`);
    return patientsWithUsers;
  }

  async getPatientPayments(patientId: number): Promise<Payment[]> {
    return Array.from(this.entityMaps[EntityType.Payment].values()).filter(
      (payment) => payment.patientId === patientId,
    );
  }

  async getMedicalNotes(): Promise<MedicalNote[]> {
    return Array.from(this.entityMaps[EntityType.MedicalNote].values()).map(this.deepClone);
  }

  async getPatientMedicalNotes(patientId: number, userRole: string): Promise<MedicalNote[]> {
    return Array.from(this.entityMaps[EntityType.MedicalNote].values()).filter(
      (note) => note.patientId === patientId && (userRole === "doctor" || !note.private)
    );
  }
  
  async getMedicalNote(noteId: number): Promise<MedicalNote | undefined> {
    return this.entityMaps[EntityType.MedicalNote].get(noteId);
  }
  
  async getPatientMedicalNotesByCategory(patientId: number, category: string, userRole: string): Promise<MedicalNote[]> {
    return Array.from(this.entityMaps[EntityType.MedicalNote].values()).filter(
      (note) => note.patientId === patientId && 
                note.category === category && 
                (userRole === "doctor" || !note.private)
    );
  }

  async getPatientXrays(patientId: number): Promise<Xray[]> {
    return Array.from(this.entityMaps[EntityType.Xray].values()).filter(
      (xray) => xray.patientId === patientId
    );
  }

  async getXray(id: number): Promise<Xray | undefined> {
    const xray = this.entityMaps[EntityType.Xray].get(id);
    return xray ? this.deepClone(xray) : undefined;
  }

  async updateXray(id: number, updates: Partial<Xray>): Promise<Xray | undefined> {
    const xray = this.entityMaps[EntityType.Xray].get(id);
    if (!xray) return undefined;

    const updatedXray = { ...xray, ...updates };
    this.entityMaps[EntityType.Xray].set(id, updatedXray);
    return updatedXray;
  }

  async getFinancialTransactionsInDateRange(startDate: Date, endDate: Date): Promise<FinancialTransaction[]> {
    return Array.from(this.entityMaps[EntityType.FinancialTransaction].values()).filter(
      (t) => t.date && t.date >= startDate && t.date <= endDate
    );
  }

  async getFinancialTransactionsByPatient(patientId: number): Promise<FinancialTransaction[]> {
    return Array.from(this.entityMaps[EntityType.FinancialTransaction].values()).filter(
      (t) => t.patientId === patientId
    );
  }

  async getInsuranceClaimsByPatient(patientId: number): Promise<InsuranceClaim[]> {
    return Array.from(this.entityMaps[EntityType.InsuranceClaim].values()).filter(
      (claim) => claim.patientId === patientId
    );
  }

  async getInsuranceClaimsByStatus(status: string): Promise<InsuranceClaim[]> {
    return Array.from(this.entityMaps[EntityType.InsuranceClaim].values()).filter(
      (claim) => claim.status === status
    );
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return Array.from(this.entityMaps[EntityType.Payment].values()).filter(
      (p) => p.date && p.date >= startDate && p.date <= endDate
    );
  }

  async getInsuranceClaimsByDateRange(startDate: Date, endDate: Date): Promise<InsuranceClaim[]> {
    return Array.from(this.entityMaps[EntityType.InsuranceClaim].values()).filter(
      (c) => c.submissionDate >= startDate && c.submissionDate <= endDate
    );
  }

  async getFinancialTransactionsByYear(year: number): Promise<FinancialTransaction[]> {
    return Array.from(this.entityMaps[EntityType.FinancialTransaction].values()).filter(
      (t) => new Date(t.date).getFullYear() === year
    );
  }

  async getPatientMedicalHistory(patientId: number) {
    const patient = await this.getPatient(patientId);
    return patient?.medicalHistory || "";
  }

  // Financial transactions
  async createFinancialTransactionDb(transaction: FinancialTransaction): Promise<FinancialTransaction> {
    const id = this.getNextId();
    const now = new Date();
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id,
      date: transaction.date || now,
      status: transaction.status || 'pending',
      description: transaction.description || null,
      complianceNotes: transaction.complianceNotes || null,
      referenceNumber: transaction.referenceNumber || null,
      categoryCode: transaction.categoryCode || null,
      fiscalYear: transaction.fiscalYear,
      fiscalQuarter: transaction.fiscalQuarter,
      auditTrail: transaction.auditTrail || null,
      complianceVerified: transaction.complianceVerified || false
    };
    this.entityMaps[EntityType.FinancialTransaction].set(id, newTransaction);
    return newTransaction;
  }

  // Appointments
  async getDoctorAppointments(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.entityMaps[EntityType.Appointment].values()).filter(
      (apt) => apt.doctorId === doctorId,
    );
  }

  async getDoctorAppointmentsByDate(doctorId: number, date: string) {
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    return Array.from(this.entityMaps[EntityType.Appointment].values()).filter(appointment =>
        appointment.doctorId === doctorId && appointment.date >= startOfDay && appointment.date <= endOfDay
    );
  }
  
  async getAppointmentsByDateRange(startDate: Date, endDate: Date) {
    return Array.from(this.entityMaps[EntityType.Appointment].values()).filter(appointment =>
        appointment.date >= startDate && appointment.date <= endDate
    );
  }

  async getAppointment(appointmentId: number): Promise<Appointment | undefined> {
    const appointment = this.entityMaps[EntityType.Appointment].get(appointmentId);
    return appointment ? this.deepClone(appointment) : undefined;
  }

  async updateAppointment(appointmentId: number, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.entityMaps[EntityType.Appointment].get(appointmentId);
    if (!existingAppointment) return undefined;
    
    const updatedAppointment = {
      ...existingAppointment,
      ...updates,
      status: updates.status ?? existingAppointment.status,
      notes: updates.notes ?? existingAppointment.notes,
      checkedIn: updates.checkedIn ?? existingAppointment.checkedIn,
      checkedInTime: updates.checkedInTime ?? existingAppointment.checkedInTime,
      isOnline: updates.isOnline ?? existingAppointment.isOnline,
      insuranceVerified: updates.insuranceVerified ?? existingAppointment.insuranceVerified
    };
    
    this.entityMaps[EntityType.Appointment].set(appointmentId, updatedAppointment);
    return updatedAppointment;
  }

  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    const patients = Array.from(this.entityMaps[EntityType.Patient].values());
    return patients.find(patient => patient.userId === userId);
  }
  
  async getPatientAppointments(patientId: number): Promise<Appointment[]> {
    return Array.from(this.entityMaps[EntityType.Appointment].values()).filter(
      appointment => appointment.patientId === patientId
    );
  }
  
  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.entityMaps[EntityType.Appointment].values());
  }

  async createAvailabilitySlot(slot: any) {
    //Simulate creating an availability slot. Replace with actual DB call in production.
    const id = this.getNextId();
    return {id, ...slot};
  }

  // Backup and data management
  async createCompleteBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `smartdental_backup_${timestamp}`;

      // Simulate backup creation - replace with actual backup mechanism
      const backup = {
        users: Array.from(this.entityMaps[EntityType.User].values()),
        patients: Array.from(this.entityMaps[EntityType.Patient].values()),
        appointments: Array.from(this.entityMaps[EntityType.Appointment].values()),
        treatmentPlans: Array.from(this.entityMaps[EntityType.TreatmentPlan].values()),
        medicalNotes: Array.from(this.entityMaps[EntityType.MedicalNote].values()),
        xrays: Array.from(this.entityMaps[EntityType.Xray].values()),
        payments: Array.from(this.entityMaps[EntityType.Payment].values()),
        insuranceClaims: Array.from(this.entityMaps[EntityType.InsuranceClaim].values()),
        financialTransactions: Array.from(this.entityMaps[EntityType.FinancialTransaction].values()),
        timestamp: new Date().toISOString(),
        version: "1.0"
      };

      console.log(`Created backup: ${backupName}`);

      return {
        name: backupName,
        timestamp: new Date().toISOString(),
        size: JSON.stringify(backup).length,
        tables: Object.keys(backup).filter(k => k !== 'timestamp' && k !== 'version')
      };
    } catch (error) {
      console.error("Backup creation error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to create backup");
    }
  }

  async restoreFromCompleteBackup(backupId: string) {
    // Simulate restore - replace with actual restore mechanism
    console.log(`Restoring from backup: ${backupId}`);
    return { success: true, message: "Restore simulated successfully" };
  }

  async getPracticeAnalytics(timeframe: string): Promise<any> {
    try {
      // Calculate date range based on timeframe
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_90days':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
          break;
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30); // Default to last 30 days
      }

      // Get data
      const appointments = Array.from(this.entityMaps[EntityType.Appointment].values()).filter(a => a.date >= startDate);
      const treatments = Array.from(this.entityMaps[EntityType.TreatmentPlan].values()).filter(t => t.createdAt && new Date(t.createdAt) >= startDate);
      const payments = Array.from(this.entityMaps[EntityType.Payment].values()).filter(p => p.date && p.date >= startDate);

      // Calculate metrics
      const patientVisits = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const cancellationRate = patientVisits ?
        appointments.filter(a => a.status === 'cancelled').length / patientVisits : 0;

      const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const averageTreatmentValue = treatments.length ?
        treatments.reduce((sum, t) => sum + (t.cost || 0), 0) / treatments.length : 0;

      return {
        timeframe,
        patientVisits,
        completedAppointments,
        cancellationRate,
        revenue,
        averageTreatmentValue,
        treatmentsSold: treatments.length,
        dataTimeRange: {
          from: startDate.toISOString(),
          to: now.toISOString()
        }
      };
    } catch (error) {
      console.error("Analytics error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate analytics");
    }
  }

  async updatePatientMedicalHistory(patientId: number, updatedHistory: any) {
    const patient = await this.getPatient(patientId);
    if (patient) {
      patient.medicalHistory = updatedHistory;
      this.entityMaps[EntityType.Patient].set(patientId, patient);
      return true;
    }
    return false;
  }

  // User methods
  async findUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.entityMaps[EntityType.User].values()).find(user => user.username === username);
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.entityMaps[EntityType.User].values()).find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.entityMaps[EntityType.User].get(id);
  }

  async createUserDb(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: this.getNextId(),
      metadata: userData.metadata || {}
    };
    this.entityMaps[EntityType.User].set(newUser.id, newUser);
    return newUser;
  }

  // Notification methods
  async getNotifications(userId: number, includeRead: boolean = false): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && (includeRead || !n.read));
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    return this.getEntity('notification', id);
  }

  async updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined> {
    return this.updateEntity('notification', id, updates);
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.deleteEntity('notification', id);
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.entityMaps[EntityType.Notification].values()).filter(n => n.userId === userId && !n.read).length;
  }

  async markAllNotificationsAsRead(userId: number): Promise<number> {
    let count = 0;

    for (const notification of this.entityMaps[EntityType.Notification].values()) {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        count++;
      }
    }

    return count;
  }

  // Notification helper methods
  async notify(
    userId: number,
    type: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<Notification> {
    return this.createEntity('notification', {
      userId,
      type,
      message,
      read: false,
      metadata
    });
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.entityMaps[EntityType.Notification].values())
      .filter(notification => 
        notification.userId === userId && 
        !notification.read
      );
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    return this.updateEntity('notification', id, {
      read: true
    });
  }

  // Notification triggers
  async notifyAppointmentCreated(appointment: Appointment): Promise<void> {
    const patient = await this.getPatient(appointment.patientId);

    await this.notify(
      appointment.doctorId,
      'appointment_created',
      `New appointment scheduled for ${patient ? `${patient.firstName} ${patient.lastName}` : 'a patient'} on ${appointment.date.toLocaleDateString()}`,
      {
        appointmentId: appointment.id,
        patientId: patient?.id,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined
      }
    );
  }

  async notifyDiagnosisAdded(diagnosis: Diagnosis): Promise<void> {
    const patient = await this.getPatient(diagnosis.patientId);
    if (patient) {
      await this.notify(
        diagnosis.doctorId,
        'diagnosis_added',
        `New diagnosis added for ${patient.firstName} ${patient.lastName}`,
        {
          diagnosisId: diagnosis.id,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`
        }
      );
    }
  }

  async notifyLabCaseOverdue(labCase: LabCase): Promise<void> {
    const patient = await this.getPatient(labCase.patientId);

    const adminUsers = Array.from(this.entityMaps[EntityType.User].values())
      .filter(user => user.role === 'admin');

    for (const admin of adminUsers) {
      await this.notify(
        admin.id,
        'lab_case_overdue',
        `Lab case ${labCase.caseNumber} is overdue${patient ? ` for ${patient.firstName} ${patient.lastName}` : ''}`,
        {
          labCaseId: labCase.id,
          patientId: patient?.id,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined
        }
      );
    }
  }

  async notifyInsuranceClaimRejected(claim: InsuranceClaim): Promise<void> {
    const billingUsers = Array.from(this.entityMaps[EntityType.User].values())
      .filter(user => user.role === 'staff' && user.specialization === 'billing');

    const patient = await this.getPatient(claim.patientId);

    for (const billingUser of billingUsers) {
      await this.notify(
        billingUser.id,
        'insurance_claim_rejected',
        `Insurance claim ${claim.claimNumber} was rejected${patient ? ` for ${patient.firstName} ${patient.lastName}` : ''}`,
        {
          claimId: claim.id,
          patientId: patient?.id,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined
        }
      );
    }
  }

  // Backup and restore operations
  async createBackup(): Promise<string> {
    const backupId = `backup_${Date.now()}`;
    return backupId;
  }

  async getNotificationPreferences(userId: number): Promise<NotificationPreferences> {
    let preferences = this.notificationPreferencesMap.get(userId);
    if (!preferences) {
      preferences = {
        id: this.getNextId('notification_preferences'),
        userId,
        emailEnabled: true,
        pushEnabled: true,
        appointmentReminders: true,
        labResults: true,
        insuranceUpdates: true,
        diagnosisUpdates: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.notificationPreferencesMap.set(userId, preferences);
    }
    return preferences;
  }

  async updateNotificationPreferences(
    userId: number,
    updates: Partial<Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt'>>
  ): Promise<NotificationPreferences> {
    const preferences = await this.getNotificationPreferences(userId);
    const updatedPreferences = {
      ...preferences,
      ...updates,
      updatedAt: new Date()
    };
    this.notificationPreferencesMap.set(userId, updatedPreferences);
    return updatedPreferences;
  }

  async createOverrideReview(review: Omit<OverrideReview, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>): Promise<OverrideReview> {
    const id = this.getNextId('override_review');
    const now = new Date();
    
    const newReview: OverrideReview = {
      ...review,
      id,
      auditHistory: [],
      createdAt: now,
      updatedAt: now
    };

    // Create initial audit entry
    const auditEntry: ReviewAuditEntry = {
      id: this.getNextId('review_audit'),
      reviewId: id,
      action: 'created',
      userId: review.reviewerId,
      notes: review.notes,
      timestamp: now
    };

    this.overrideReviews.set(id, newReview);
    this.reviewAuditHistory.set(id, [auditEntry]);

    // Create audit log
    this.auditLogs.set(id, {
      id,
      entityType: 'override_review',
      entityId: id,
      action: 'create',
      userId: review.reviewerId,
      timestamp: now,
      changes: {
        modelVersion: review.modelVersion,
        confidence: review.confidence,
        reviewStatus: review.status,
        reviewId: id
      }
    });

    return newReview;
  }

  async updateOverrideReview(
    id: number,
    updates: Partial<Omit<OverrideReview, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>>
  ): Promise<OverrideReview | undefined> {
    const review = this.overrideReviews.get(id);
    if (!review) return undefined;

    const now = new Date();
    const previousStatus = review.status;
    const newStatus = updates.status || review.status;

    // Create audit entry for the update
    const auditEntry: ReviewAuditEntry = {
      id: this.getNextId('review_audit'),
      reviewId: id,
      action: newStatus !== previousStatus ? 'status_changed' : 'updated',
      userId: updates.reviewerId || review.reviewerId,
      previousStatus: previousStatus,
      newStatus: newStatus,
      notes: updates.notes || review.notes,
      timestamp: now
    };

    const updatedReview: OverrideReview = {
      ...review,
      ...updates,
      updatedAt: now,
      auditHistory: [...review.auditHistory, auditEntry]
    };

    this.overrideReviews.set(id, updatedReview);
    this.reviewAuditHistory.set(id, updatedReview.auditHistory);

    // Create audit log
    this.auditLogs.set(id, {
      id,
      entityType: 'override_review',
      entityId: id,
      action: 'update',
      userId: updates.reviewerId || review.reviewerId,
      timestamp: now,
      changes: {
        modelVersion: review.modelVersion,
        confidence: review.confidence,
        reviewStatus: newStatus,
        reviewId: id
      }
    });

    return updatedReview;
  }

  async getOverrideReview(id: number): Promise<OverrideReview | undefined> {
    return this.overrideReviews.get(id);
  }

  async getPendingReviews(): Promise<OverrideReview[]> {
    return Array.from(this.overrideReviews.values())
      .filter(review => review.status === 'pending');
  }

  async getReviewsByReviewer(reviewerId: number): Promise<OverrideReview[]> {
    return Array.from(this.overrideReviews.values())
      .filter(review => review.reviewerId === reviewerId);
  }

  async getOverdueReviews(): Promise<OverrideReview[]> {
    const now = new Date();
    const REVIEW_DEADLINE_HOURS = 24;
    
    return Array.from(this.overrideReviews.values())
      .filter(review => {
        if (review.status !== 'pending') return false;
        
        const hoursSinceCreation = 
          (now.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation >= REVIEW_DEADLINE_HOURS;
      });
  }

  async getCurrentModelVersion(): Promise<string> {
    // In a real implementation, this would fetch from a configuration or deployment service
    return '1.0.0';
  }

  async getAuditLogs(query: AuditLogQuery): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    const logs = Array.from(this.auditLogs.values());
    let filteredLogs = logs;

    if (query.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= new Date(query.startDate));
    }

    if (query.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= new Date(query.endDate));
    }

    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }

    if (query.entityType) {
      filteredLogs = filteredLogs.filter(log => log.entityType === query.entityType);
    }

    if (query.entityId) {
      filteredLogs = filteredLogs.filter(log => log.entityId === query.entityId);
    }

    if (query.action) {
      filteredLogs = filteredLogs.filter(log => log.action === query.action);
    }

    const total = filteredLogs.length;
    const offset = query.offset || 0;
    const limit = query.limit || 50;

    filteredLogs = filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);

    return {
      logs: filteredLogs,
      total
    };
  }

  async createAuditLog(log: AuditLog): Promise<void> {
    this.auditLogs.set(log.id, log);
  }

  deleteAuditLog(id: string): void {
    this.auditLogs.delete(id);
  }

  /**
   * Find the most recent restorative chart for a patient before the given chart ID
   */
  async findPreviousRestorativeChart(patientId: number, currentChartId: number): Promise<RestorativeChart | undefined> {
    const charts = Array.from(this.entityMaps[EntityType.RestorativeChart].values())
      .filter(chart => 
        chart.patientId === patientId && 
        chart.id < currentChartId
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return charts[0];
  }

  /**
   * Find the most recent periodontal chart for a patient before the given chart ID
   */
  async findPreviousPeriodontalChart(patientId: number, currentChartId: number): Promise<PeriodontalChart | undefined> {
    const charts = Array.from(this.entityMaps[EntityType.PeriodontalChart].values())
      .filter(chart => 
        chart.patientId === patientId && 
        chart.id < currentChartId
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return charts[0];
  }
}

export const storage = new MemStorage();