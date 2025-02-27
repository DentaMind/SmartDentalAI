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
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private treatmentPlans: Map<number, TreatmentPlan>;
  private payments: Map<number, Payment>;
  private medicalNotes: Map<number, MedicalNote>;
  private xrays: Map<number, Xray>;
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
}

export const storage = new MemStorage();