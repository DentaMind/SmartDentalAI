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
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private treatmentPlans: Map<number, TreatmentPlan>;
  sessionStore: session.Store;
  private currentIds: {
    users: number;
    patients: number;
    appointments: number;
    treatmentPlans: number;
  };

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.treatmentPlans = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.currentIds = {
      users: 1,
      patients: 1,
      appointments: 1,
      treatmentPlans: 1,
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const id = this.currentIds.patients++;
    const newPatient = { ...patient, id };
    this.patients.set(id, newPatient);
    return newPatient;
  }

  async listPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  // Appointment methods
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentIds.appointments++;
    const newAppointment = { ...appointment, id };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async listAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  // Treatment Plan methods
  async createTreatmentPlan(plan: InsertTreatmentPlan): Promise<TreatmentPlan> {
    const id = this.currentIds.treatmentPlans++;
    const newPlan = { ...plan, id };
    this.treatmentPlans.set(id, newPlan);
    return newPlan;
  }

  async getTreatmentPlan(id: number): Promise<TreatmentPlan | undefined> {
    return this.treatmentPlans.get(id);
  }

  async listTreatmentPlans(): Promise<TreatmentPlan[]> {
    return Array.from(this.treatmentPlans.values());
  }
}

export const storage = new MemStorage();
