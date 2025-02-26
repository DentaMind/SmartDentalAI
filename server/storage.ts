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
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private treatmentPlans: Map<number, TreatmentPlan>;
  private payments: Map<number, Payment>; // Added payments map
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.treatmentPlans = new Map();
    this.payments = new Map(); // Initialize payments map
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
    const user = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || "doctor",
      language: insertUser.language || "en",
    };
    this.users.set(id, user);
    return user;
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentId++;
    const patient = { ...insertPatient, id };
    this.patients.set(id, patient);
    return patient;
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentId++;
    const appointment = { ...insertAppointment, id };
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
    const plan = { ...insertPlan, id };
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
    const payment = { ...insertPayment, id };
    this.payments.set(id, payment);
    return payment;
  }

  async getPatientPayments(patientId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.patientId === patientId,
    );
  }
}

export const storage = new MemStorage();