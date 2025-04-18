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
  InsuranceVerification,
  InsertInsuranceVerification,
  InsuranceVerificationStatusEnum,
  Diagnosis,
  InsertDiagnosis,
  PeriodontalChart,
  InsertPeriodontalChart,
  RestorativeChartEntry,
  InsertRestorativeChartEntry,
  PerioChartEntry,
  InsertPerioChartEntry,
  XrayAiFinding,
  InsertXrayAiFinding,
  ChartingNote,
  InsertChartingNote,
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import crypto from 'crypto';

const MemoryStore = createMemoryStore(session);

// Using the imported User type from schema.ts, not defining our own interface
// interface User {
//  id: number;
//  username: string;
//  email: string;
//  firstName: string;
//  lastName: string;
//  role: string;
//  password: string;
//  mfaSecret: string;
//  mfaEnabled: boolean;
//  specialization?: string;
//  licenseNumber?: string;
//  createdAt: Date;
//  updatedAt: Date;
// }

interface Notification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  source: string;
  sourceId?: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: Array<{
    label: string;
    url?: string;
    action?: string;
  }>;
}

// Mock data - in production this would use real database
const users: User[] = [];
const notifications: Notification[] = [];

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
  private insuranceVerifications: Map<number, InsuranceVerification>;
  private diagnoses: Map<number, Diagnosis>;
  private periodontalCharts: Map<number, PeriodontalChart>;
  private restorativeChartEntries: Map<number, RestorativeChartEntry>;
  private perioChartEntries: Map<number, PerioChartEntry>;
  private xrayAiFindings: Map<number, XrayAiFinding>;
  private chartingNotes: Map<number, ChartingNote>;
  sessionStore: session.Store;
  currentId: number;
  isInitialized: boolean;

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
    this.insuranceVerifications = new Map();
    this.diagnoses = new Map();
    this.periodontalCharts = new Map();
    this.restorativeChartEntries = new Map();
    this.perioChartEntries = new Map();
    this.xrayAiFindings = new Map();
    this.chartingNotes = new Map();
    this.currentId = 1;
    this.isInitialized = false;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }
  
  // Initialize user from database
  async initializeUserFromDb(user: User): Promise<void> {
    console.log(`Initializing user from DB: ${user.username} (ID: ${user.id})`);
    // Update the currentId if this id is larger
    if (user.id >= this.currentId) {
      this.currentId = user.id + 1;
    }
    this.users.set(user.id, user);
  }
  
  // Initialize patient from database
  async initializePatientFromDb(patient: Patient): Promise<void> {
    console.log(`Initializing patient from DB: ID ${patient.id}`);
    // Update the currentId if this id is larger
    if (patient.id >= this.currentId) {
      this.currentId = patient.id + 1;
    }
    this.patients.set(patient.id, patient);
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
    // Create a user object with the correct structure
    const user = {
      id,
      username: insertUser.username,
      password: insertUser.password, // Use password directly for storage
      email: insertUser.email || '',
      firstName: insertUser.firstName || '',
      lastName: insertUser.lastName || '',
      role: insertUser.role,
      language: insertUser.language || 'en',
      phoneNumber: insertUser.phoneNumber || null,
      dateOfBirth: insertUser.dateOfBirth || null,
      insuranceProvider: insertUser.insuranceProvider || null,
      insuranceNumber: insertUser.insuranceNumber || null,
      specialization: insertUser.specialization || null,
      licenseNumber: insertUser.licenseNumber || null,
      mfaSecret: '',
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
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
    
    // Ensure userId is properly set from insertPatient
    if (!insertPatient.userId) {
      console.error("Error: Missing userId in createPatient. InsertPatient data:", insertPatient);
      throw new Error("Patient must be associated with a user account");
    }
    
    const patient: Patient = {
      id,
      userId: insertPatient.userId,
      firstName: insertPatient.firstName || null,
      lastName: insertPatient.lastName || null,
      email: insertPatient.email || null,
      phoneNumber: insertPatient.phoneNumber || null,
      dateOfBirth: insertPatient.dateOfBirth || null,
      
      // Personal Information
      homeAddress: insertPatient.homeAddress || null,
      socialSecurityNumber: insertPatient.socialSecurityNumber || null,
      
      // Emergency contact information
      emergencyContactName: insertPatient.emergencyContactName || null,
      emergencyContactPhone: insertPatient.emergencyContactPhone || null,
      emergencyContactRelationship: insertPatient.emergencyContactRelationship || null,
      
      // Insurance Information
      insuranceProvider: insertPatient.insuranceProvider || null,
      insuranceNumber: insertPatient.insuranceNumber || null, 
      insuranceGroupNumber: insertPatient.insuranceGroupNumber || null,
      insurancePrimaryHolder: insertPatient.insurancePrimaryHolder || null,
      insuranceHolderRelation: insertPatient.insuranceHolderRelation || null,
      
      // Medical history expanded fields
      medicalHistory: insertPatient.medicalHistory || null,
      underPhysicianCare: insertPatient.underPhysicianCare || null,
      physicianConditions: insertPatient.physicianConditions || null,
      allergies: insertPatient.allergies || null,
      pastSurgeries: insertPatient.pastSurgeries || null,
      currentMedications: insertPatient.currentMedications || null,
      adverseAnestheticReaction: insertPatient.adverseAnestheticReaction || null,
      hospitalizedRecently: insertPatient.hospitalizedRecently || null,
      
      // Medical conditions
      hypertension: insertPatient.hypertension || null,
      diabetes: insertPatient.diabetes || null,
      heartDisease: insertPatient.heartDisease || null,
      asthma: insertPatient.asthma || null,
      arthritis: insertPatient.arthritis || null,
      cancer: insertPatient.cancer || null,
      stroke: insertPatient.stroke || null,
      kidneyDisease: insertPatient.kidneyDisease || null,
      liverDisease: insertPatient.liverDisease || null,
      thyroidDisease: insertPatient.thyroidDisease || null,
      mentalIllness: insertPatient.mentalIllness || null,
      seizures: insertPatient.seizures || null,
      bleedingDisorders: insertPatient.bleedingDisorders || null,
      autoimmune: insertPatient.autoimmune || null,
      hepatitis: insertPatient.hepatitis || null,
      hivAids: insertPatient.hivAids || null,
      lungDisease: insertPatient.lungDisease || null,
      osteoporosis: insertPatient.osteoporosis || null,
      
      // Lifestyle
      smokesTobacco: insertPatient.smokesTobacco || null,
      useAlcohol: insertPatient.useAlcohol || null,
      isPregnantOrNursing: insertPatient.isPregnantOrNursing || null,
      
      // Legacy fields
      medications: insertPatient.medications || null,
      bloodType: insertPatient.bloodType || null,
      
      // Dental history
      lastDentalVisit: insertPatient.lastDentalVisit || null,
      whenIssueStarted: insertPatient.whenIssueStarted || null,
      experiencedBefore: insertPatient.experiencedBefore || null,
      chiefComplaint: insertPatient.chiefComplaint || null,
      currentSymptoms: insertPatient.currentSymptoms || null,
      previousDentalProcedures: insertPatient.previousDentalProcedures || null,
      dentalHistory: insertPatient.dentalHistory || null,
      
      // Dental conditions
      hadGumDisease: insertPatient.hadGumDisease || null,
      hadExtractions: insertPatient.hadExtractions || null,
      hadDentalImplants: insertPatient.hadDentalImplants || null,
      hadOrthodonticTreatment: insertPatient.hadOrthodonticTreatment || null,
      hadRootCanal: insertPatient.hadRootCanal || null,
      hadJawPain: insertPatient.hadJawPain || null,
      sensitivityToHotCold: insertPatient.sensitivityToHotCold || null,
      grindTeeth: insertPatient.grindTeeth || null,
      interestedInCosmetic: insertPatient.interestedInCosmetic || null,
      
      // Consent forms
      hipaaConsent: insertPatient.hipaaConsent || null,
      treatmentConsent: insertPatient.treatmentConsent || null,
      financialResponsibilityAgreement: insertPatient.financialResponsibilityAgreement || null,
      assignmentOfBenefits: insertPatient.assignmentOfBenefits || null,
      officePolicy: insertPatient.officePolicy || null,
    };
    this.patients.set(id, patient);
    console.log("Patient saved to storage:", patient);
    console.log("Total patients in storage:", this.patients.size);
    
    // Print out all patients for debugging
    console.log("All patients in storage:");
    this.patients.forEach((p) => {
      console.log(`- Patient ${p.id}, userId: ${p.userId}`);
    });
    
    return patient;
  }

  async getAllPatients(): Promise<(Patient & { user: User })[]> {
    console.log("Getting all patients from storage");
    console.log("Patients map size:", this.patients.size);
    
    const patients = Array.from(this.patients.values());
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
  
  async getMedicalNote(noteId: number): Promise<MedicalNote | undefined> {
    return this.medicalNotes.get(noteId);
  }
  
  async updateMedicalNote(noteId: number, updates: Partial<MedicalNote>): Promise<MedicalNote | undefined> {
    const note = this.medicalNotes.get(noteId);
    if (!note) return undefined;
    
    const updatedNote = { ...note, ...updates };
    this.medicalNotes.set(noteId, updatedNote);
    return updatedNote;
  }
  
  async getPatientMedicalNotesByCategory(patientId: number, category: string, userRole: string): Promise<MedicalNote[]> {
    return Array.from(this.medicalNotes.values()).filter(
      (note) => note.patientId === patientId && 
                note.category === category && 
                (userRole === "doctor" || !note.private)
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

  async getXray(id: number): Promise<Xray | undefined> {
    return this.xrays.get(id);
  }

  async updateXray(id: number, updates: Partial<Xray>): Promise<Xray | undefined> {
    const xray = this.xrays.get(id);
    if (!xray) return undefined;

    const updatedXray = { ...xray, ...updates };
    this.xrays.set(id, updatedXray);
    return updatedXray;
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

  async getFinancialTransactionsInDateRange(startDate: Date, endDate: Date): Promise<FinancialTransaction[]> {
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
    const patient = await this.getPatient(patientId);
    return patient?.medicalHistory || "";
  }

  // Financial transactions
  async createFinancialTransactionDb(transaction: InsertFinancialTransaction) {
    //Simulate database interaction.  Replace with actual DB call in production.
    const id = this.currentId++;
    const newTransaction = {id, ...transaction};
    this.financialTransactions.set(id, newTransaction);
    return newTransaction;
  }

  async getFinancialTransactionsInDateRange(startDate: Date, endDate: Date) {
    return Array.from(this.financialTransactions.values()).filter(transaction => 
        transaction.date >= startDate && transaction.date <= endDate
    );
  }

  async getFinancialTransactionsByPatient(patientId: number) {
    return Array.from(this.financialTransactions.values()).filter(transaction => transaction.patientId === patientId);
  }

  // Insurance claims
  async createInsuranceClaimDb(claim: InsertInsuranceClaim) {
    //Simulate database interaction.  Replace with actual DB call in production.
    const id = this.currentId++;
    const newClaim = {id, ...claim};
    this.insuranceClaims.set(id, newClaim);
    return newClaim;
  }

  async getInsuranceClaim(claimId: number) {
    return this.insuranceClaims.get(claimId);
  }

  async updateInsuranceClaim(claimId: number, updates: Partial<InsertInsuranceClaim>): Promise<InsuranceClaim | undefined> {
    const existingClaim = this.insuranceClaims.get(claimId);
    if (!existingClaim) return undefined;
    const updatedClaim = {...existingClaim, ...updates};
    this.insuranceClaims.set(claimId, updatedClaim);
    return updatedClaim;
  }

  async getInsuranceClaimsByPatient(patientId: number) {
    return Array.from(this.insuranceClaims.values()).filter(claim => claim.patientId === patientId);
  }
  
  async getInsuranceClaimsByStatus(status: string) {
    return Array.from(this.insuranceClaims.values()).filter(claim => claim.status === status);
  }

  // Appointments
  async getDoctorAppointmentsByDate(doctorId: number, date: string) {
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    return Array.from(this.appointments.values()).filter(appointment =>
        appointment.doctorId === doctorId && appointment.date >= startOfDay && appointment.date <= endOfDay
    );
  }
  
  async getAppointmentsByDateRange(startDate: Date, endDate: Date) {
    return Array.from(this.appointments.values()).filter(appointment =>
        appointment.date >= startDate && appointment.date <= endDate
    );
  }

  async getAppointment(appointmentId: number) {
    return this.appointments.get(appointmentId);
  }

  async updateAppointment(appointmentId: number, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(appointmentId);
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
    
    this.appointments.set(appointmentId, updatedAppointment);
    return updatedAppointment;
  }

  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    const patients = Array.from(this.patients.values());
    return patients.find(patient => patient.userId === userId);
  }
  
  async getPatientAppointments(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      appointment => appointment.patientId === patientId
    );
  }
  
  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async createAvailabilitySlot(slot: any) {
    //Simulate creating an availability slot. Replace with actual DB call in production.
    const id = this.currentId++;
    return {id, ...slot};
  }

  async getTreatmentPlan(planId: number) {
    return this.treatmentPlans.get(planId);
  }

  // Backup and data management
  async createCompleteBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `smartdental_backup_${timestamp}`;

      // Simulate backup creation - replace with actual backup mechanism
      const backup = {
        users: Array.from(this.users.values()),
        patients: Array.from(this.patients.values()),
        appointments: Array.from(this.appointments.values()),
        treatmentPlans: Array.from(this.treatmentPlans.values()),
        medicalNotes: Array.from(this.medicalNotes.values()),
        xrays: Array.from(this.xrays.values()),
        payments: Array.from(this.payments.values()),
        insuranceClaims: Array.from(this.insuranceClaims.values()),
        financialTransactions: Array.from(this.financialTransactions.values()),
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

  async getPracticeAnalytics(timeframe: string) {
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
      const appointments = Array.from(this.appointments.values()).filter(a => a.date >= startDate);
      const treatments = Array.from(this.treatmentPlans.values()).filter(t => new Date(t.createdAt) >= startDate);
      const payments = Array.from(this.payments.values()).filter(p => p.date >= startDate);


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
      this.patients.set(patientId, patient);
      return true;
    }
    return false;
  }

  // User methods
  async findUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUserDb(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: this.currentId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = {
      ...existingUser,
      ...updates,
      officeName: updates.officeName ?? existingUser.officeName,
      officeEmail: updates.officeEmail ?? existingUser.officeEmail,
      metadata: updates.metadata ?? existingUser.metadata
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Notification methods
  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notificationData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };

    notifications.push(newNotification); // This should be replaced with a proper storage mechanism
    return newNotification;
  }

  async getNotifications(userId: number, options: { 
    includeRead?: boolean, 
    limit?: number,
    before?: Date
  } = {}): Promise<Notification[]> {
    const { includeRead = false, limit = 20, before } = options;

    let result = notifications
      .filter(n => n.userId === userId)
      .filter(n => includeRead || !n.read);

    if (before) {
      result = result.filter(n => n.createdAt < before);
    }

    // Sort by createdAt descending (newest first)
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply limit
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    return notifications.find(n => n.id === id);
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification | undefined> {
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) return undefined;

    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...updates
    };

    return notifications[notificationIndex];
  }

  async deleteNotification(id: string): Promise<boolean> {
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) return false;

    notifications.splice(notificationIndex, 1);
    return true;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return notifications.filter(n => n.userId === userId && !n.read).length;
  }

  async markAllNotificationsAsRead(userId: number): Promise<number> {
    let count = 0;

    for (let i = 0; i < notifications.length; i++) {
      if (notifications[i].userId === userId && !notifications[i].read) {
        notifications[i].read = true;
        count++;
      }
    }

    return count;
  }

  // Backup and restore operations
  async createBackup(): Promise<string> {
    const backupId = `backup-${new Date().toISOString()}`;
    const backupData = {
      users: Array.from(this.users.values()),
      notifications,
      timestamp: new Date()
    };

    // In a real system, this would save to a secure storage
    console.log(`Created backup ${backupId}`);

    return backupId;
  }

  async restoreFromBackup(backupId: string): Promise<{ success: boolean, message: string }> {
    // In a real system, this would restore from the backup
    console.log(`Restoring from backup ${backupId}`);

    return { 
      success: true, 
      message: `Restored from backup ${backupId}` 
    };
  }

  // Analytics
  async getPracticeAnalytics(timeframe: string): Promise<any> {
    // This would be implemented with real analytics in production
    return {
      timeframe,
      patientCount: 250,
      appointmentsScheduled: 150,
      appointmentsCompleted: 130,
      revenue: 25000,
      mostCommonProcedures: [
        { name: 'Cleaning', count: 75 },
        { name: 'Filling', count: 42 },
        { name: 'Crown', count: 18 }
      ],
      patientDemographics: {
        ageGroups: [
          { group: '0-18', count: 45 },
          { group: '19-35', count: 68 },
          { group: '36-50', count: 72 },
          { group: '51-65', count: 40 },
          { group: '65+', count: 25 }
        ],
        genderDistribution: {
          male: 115,
          female: 130,
          other: 5
        }
      }
    };
  }

  // Insurance verification methods
  async createInsuranceVerification(verification: InsertInsuranceVerification): Promise<InsuranceVerification> {
    const id = this.currentId++;
    const newVerification = { id, ...verification };
    this.insuranceVerifications.set(id, newVerification);
    return newVerification;
  }

  async getInsuranceVerification(id: number): Promise<InsuranceVerification | undefined> {
    return this.insuranceVerifications.get(id);
  }

  async updateInsuranceVerification(id: number, updates: Partial<InsuranceVerification>): Promise<InsuranceVerification | undefined> {
    const verification = this.insuranceVerifications.get(id);
    if (!verification) return undefined;
    
    const updatedVerification = { ...verification, ...updates };
    this.insuranceVerifications.set(id, updatedVerification);
    return updatedVerification;
  }

  async getActiveInsuranceVerifications(): Promise<InsuranceVerification[]> {
    // Get verifications that are not expired or failed
    return Array.from(this.insuranceVerifications.values()).filter(
      (verification) => verification.status !== InsuranceVerificationStatusEnum.enum.expired &&
                       verification.status !== InsuranceVerificationStatusEnum.enum.failed
    );
  }

  async getPatientInsuranceVerificationHistory(patientId: number): Promise<InsuranceVerification[]> {
    return Array.from(this.insuranceVerifications.values()).filter(
      (verification) => verification.patientId === patientId
    );
  }

  // Diagnosis management methods
  async createDiagnosis(diagnosis: InsertDiagnosis): Promise<Diagnosis> {
    const id = this.currentId++;
    const newDiagnosis: Diagnosis = { 
      id,
      ...diagnosis,
      // Ensure all required fields have appropriate defaults if not provided
      status: diagnosis.status ?? 'pending',
      createdAt: diagnosis.createdAt ?? new Date(),
      updatedAt: diagnosis.updatedAt ?? new Date(),
      aiSource: diagnosis.aiSource ?? null,
      approvedAt: diagnosis.approvedAt ?? null,
      approvedBy: diagnosis.approvedBy ?? null,
      providerNote: diagnosis.providerNote ?? null,
      accuracyRating: diagnosis.accuracyRating ?? null,
      modifiedDiagnosis: diagnosis.modifiedDiagnosis ?? null,
      modifiedExplanation: diagnosis.modifiedExplanation ?? null
    };
    this.diagnoses.set(id, newDiagnosis);
    return newDiagnosis;
  }

  async getDiagnosisById(id: number): Promise<Diagnosis | undefined> {
    return this.diagnoses.get(id);
  }

  async getDiagnosesForPatient(patientId: number): Promise<Diagnosis[]> {
    return Array.from(this.diagnoses.values()).filter(
      (diagnosis) => diagnosis.patientId === patientId
    );
  }

  async updateDiagnosis(id: number, updates: Partial<Diagnosis>): Promise<Diagnosis | undefined> {
    const existingDiagnosis = this.diagnoses.get(id);
    if (!existingDiagnosis) return undefined;
    const updatedDiagnosis = {...existingDiagnosis, ...updates};
    this.diagnoses.set(id, updatedDiagnosis);
    return updatedDiagnosis;
  }

  // Periodontal Chart methods
  async createPeriodontalChart(chart: InsertPeriodontalChart): Promise<PeriodontalChart> {
    const id = this.currentId++;
    const newChart: PeriodontalChart = {
      id,
      patientId: chart.patientId,
      doctorId: chart.doctorId,
      date: chart.date || new Date(),
      pocketDepths: chart.pocketDepths || {},
      bleedingPoints: chart.bleedingPoints || {},
      recession: chart.recession || {},
      mobility: chart.mobility || {},
      furcation: chart.furcation || {},
      plaqueIndices: chart.plaqueIndices || {},
      calculus: chart.calculus || {},
      attachmentLoss: chart.attachmentLoss || {},
      diseaseStatus: chart.diseaseStatus || null,
      diseaseSeverity: chart.diseaseSeverity || null,
      notes: chart.notes || null,
      aiRecommendations: chart.aiRecommendations || null,
      comparisonWithPrevious: chart.comparisonWithPrevious || null,
      riskAssessment: chart.riskAssessment || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.periodontalCharts.set(id, newChart);
    return newChart;
  }

  async getPeriodontalChart(id: number): Promise<PeriodontalChart | undefined> {
    return this.periodontalCharts.get(id);
  }

  async getPatientPeriodontalCharts(patientId: number): Promise<PeriodontalChart[]> {
    return Array.from(this.periodontalCharts.values())
      .filter(chart => chart.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
  }

  async updatePeriodontalChart(id: number, updates: Partial<PeriodontalChart>): Promise<PeriodontalChart | undefined> {
    const existingChart = this.periodontalCharts.get(id);
    if (!existingChart) return undefined;
    const updatedChart = {...existingChart, ...updates};
    this.periodontalCharts.set(id, updatedChart);
    return updatedChart;
  }

  async getLatestPeriodontalChart(patientId: number): Promise<PeriodontalChart | undefined> {
    const charts = await this.getPatientPeriodontalCharts(patientId);
    if (charts.length === 0) return undefined;
    return charts[0]; // Already sorted by date descending in getPatientPeriodontalCharts
  }

  // Restorative Chart Entry management
  async createRestorativeChartEntry(entry: InsertRestorativeChartEntry): Promise<RestorativeChartEntry> {
    const id = this.currentId++;
    const newEntry = {
      id,
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.restorativeChartEntries.set(id, newEntry);
    return newEntry;
  }

  async getRestorativeChartEntry(id: number): Promise<RestorativeChartEntry | undefined> {
    return this.restorativeChartEntries.get(id);
  }

  async getPatientRestorativeChartEntries(patientId: number): Promise<RestorativeChartEntry[]> {
    return Array.from(this.restorativeChartEntries.values())
      .filter(entry => entry.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }

  async getPatientRestorativeChartEntriesByTooth(patientId: number, toothNumber: string): Promise<RestorativeChartEntry[]> {
    return Array.from(this.restorativeChartEntries.values())
      .filter(entry => entry.patientId === patientId && entry.toothNumber === toothNumber)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }

  async updateRestorativeChartEntry(id: number, updates: Partial<RestorativeChartEntry>): Promise<RestorativeChartEntry | undefined> {
    const existingEntry = this.restorativeChartEntries.get(id);
    if (!existingEntry) return undefined;
    const updatedEntry = {...existingEntry, ...updates};
    this.restorativeChartEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  // Perio Chart Entry management
  async createPerioChartEntry(entry: InsertPerioChartEntry): Promise<PerioChartEntry> {
    const id = this.currentId++;
    const newEntry = {
      id,
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.perioChartEntries.set(id, newEntry);
    return newEntry;
  }

  async getPerioChartEntry(id: number): Promise<PerioChartEntry | undefined> {
    return this.perioChartEntries.get(id);
  }

  async getPatientPerioChartEntries(patientId: number): Promise<PerioChartEntry[]> {
    return Array.from(this.perioChartEntries.values())
      .filter(entry => entry.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }

  async getPatientPerioChartEntriesByTooth(patientId: number, toothNumber: string): Promise<PerioChartEntry[]> {
    return Array.from(this.perioChartEntries.values())
      .filter(entry => entry.patientId === patientId && entry.toothNumber === toothNumber)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }

  async updatePerioChartEntry(id: number, updates: Partial<PerioChartEntry>): Promise<PerioChartEntry | undefined> {
    const existingEntry = this.perioChartEntries.get(id);
    if (!existingEntry) return undefined;
    const updatedEntry = {...existingEntry, ...updates};
    this.perioChartEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  // X-ray AI Findings management
  async createXrayAiFinding(finding: InsertXrayAiFinding): Promise<XrayAiFinding> {
    const id = this.currentId++;
    const newFinding = {
      id,
      ...finding,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.xrayAiFindings.set(id, newFinding);
    return newFinding;
  }

  async getXrayAiFinding(id: number): Promise<XrayAiFinding | undefined> {
    return this.xrayAiFindings.get(id);
  }

  async getXrayAiFindings(xrayId: number): Promise<XrayAiFinding[]> {
    return Array.from(this.xrayAiFindings.values())
      .filter(finding => finding.xrayId === xrayId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }

  async updateXrayAiFinding(id: number, updates: Partial<XrayAiFinding>): Promise<XrayAiFinding | undefined> {
    const existingFinding = this.xrayAiFindings.get(id);
    if (!existingFinding) return undefined;
    const updatedFinding = {...existingFinding, ...updates};
    this.xrayAiFindings.set(id, updatedFinding);
    return updatedFinding;
  }

  // Charting Notes management
  async createChartingNote(note: InsertChartingNote): Promise<ChartingNote> {
    const id = this.currentId++;
    const newNote = {
      id,
      ...note,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chartingNotes.set(id, newNote);
    return newNote;
  }

  async getChartingNote(id: number): Promise<ChartingNote | undefined> {
    return this.chartingNotes.get(id);
  }

  async getPatientChartingNotes(patientId: number): Promise<ChartingNote[]> {
    return Array.from(this.chartingNotes.values())
      .filter(note => note.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }

  async updateChartingNote(id: number, updates: Partial<ChartingNote>): Promise<ChartingNote | undefined> {
    const existingNote = this.chartingNotes.get(id);
    if (!existingNote) return undefined;
    const updatedNote = {...existingNote, ...updates};
    this.chartingNotes.set(id, updatedNote);
    return updatedNote;
  }

  async approveChartingNote(id: number, approvedBy: number): Promise<ChartingNote | undefined> {
    const note = this.chartingNotes.get(id);
    if (!note) return undefined;

    const updatedNote = {
      ...note,
      approved: true,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    };
    this.chartingNotes.set(id, updatedNote);
    return updatedNote;
  }

  async updateTreatmentPlan(id: number, updates: Partial<InsertTreatmentPlan>): Promise<TreatmentPlan | undefined> {
    const existingPlan = this.treatmentPlans.get(id);
    if (!existingPlan) return undefined;
    
    const updatedPlan = {
      ...existingPlan,
      ...updates,
      status: updates.status ?? existingPlan.status,
      createdAt: existingPlan.createdAt,
      updatedAt: new Date(),
      notes: updates.notes ?? existingPlan.notes,
      approvedPlan: updates.approvedPlan ?? existingPlan.approvedPlan
    };
    
    this.treatmentPlans.set(id, updatedPlan);
    return updatedPlan;
  }
}

export const storage = new MemStorage();