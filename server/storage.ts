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
import crypto from 'crypto';

const MemoryStore = createMemoryStore(session);

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  passwordHash: string;
  mfaSecret: string;
  mfaEnabled: boolean;
  specialization?: string;
  licenseNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    // Map password to passwordHash for the storage format
    const { password, ...userDataWithoutPassword } = insertUser;
    const user: User = {
      id,
      ...userDataWithoutPassword,
      passwordHash: password,
      mfaSecret: '',
      mfaEnabled: false,
      language: insertUser.language || "en",
      phoneNumber: insertUser.phoneNumber || null,
      dateOfBirth: insertUser.dateOfBirth || null,
      insuranceProvider: insertUser.insuranceProvider || null,
      insuranceNumber: insertUser.insuranceNumber || null,
      specialization: insertUser.specialization || null,
      licenseNumber: insertUser.licenseNumber || null,
      createdAt: new Date(),
      updatedAt: new Date()
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
    
    try {
      const patientsWithUsers = await Promise.all(
        patients.map(async (patient) => {
          console.log(`Processing patient ${patient.id} with userId ${patient.userId}`);
          const user = await this.getUser(patient.userId);
          
          if (!user) {
            console.error(`User not found for patient ${patient.id} with userId ${patient.userId}`);
            throw new Error(`User not found for patient ${patient.id}`);
          }
          
          console.log(`Found user for patient ${patient.id}:`, user.username);
          return { ...patient, user };
        })
      );
      
      console.log("Successfully processed all patients with users");
      return patientsWithUsers;
    } catch (error) {
      console.error("Error in getAllPatients:", error);
      throw error;
    }
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

  async updateInsuranceClaim(claimId: number, updates: Partial<InsertInsuranceClaim>) {
    const existingClaim = this.insuranceClaims.get(claimId);
    if (!existingClaim) return null;
    const updatedClaim = {...existingClaim, ...updates};
    this.insuranceClaims.set(claimId, updatedClaim);
    return updatedClaim;
  }

  async getInsuranceClaimsByPatient(patientId: number) {
    return Array.from(this.insuranceClaims.values()).filter(claim => claim.patientId === patientId);
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

  async updateAppointment(appointmentId: number, updates: Partial<InsertAppointment>) {
    const existingAppointment = this.appointments.get(appointmentId);
    if (!existingAppointment) return null;
    const updatedAppointment = {...existingAppointment, ...updates};
    this.appointments.set(appointmentId, updatedAppointment);
    return updatedAppointment;
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
      const backupName = `dentamind_backup_${timestamp}`;

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

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
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
};

export const storage = new MemStorage();