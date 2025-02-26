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
  users,
  patients,
  appointments,
  treatmentPlans,
  payments,
  medicalNotes,
  xrays,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();

    // If the user is a patient, also create a patient record
    if (insertUser.role === "patient") {
      await this.createPatient({
        userId: user.id,
        medicalHistory: null,
        allergies: null,
        bloodType: null,
        emergencyContact: null,
      });
    }

    return user;
  }

  async getPatient(id: number): Promise<(Patient & { user: User }) | undefined> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id));

    if (!patient) return undefined;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, patient.userId));

    if (!user) return undefined;

    return { ...patient, user };
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    return patient;
  }

  async getAllPatients(): Promise<(Patient & { user: User })[]> {
    const allPatients = await db
      .select()
      .from(patients)
      .leftJoin(users, eq(patients.userId, users.id));

    return allPatients.map(({ patients, users }) => ({
      ...patients,
      user: users,
    }));
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async getDoctorAppointments(doctorId: number): Promise<Appointment[]> {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId));
  }

  async createTreatmentPlan(insertPlan: InsertTreatmentPlan): Promise<TreatmentPlan> {
    const [plan] = await db
      .insert(treatmentPlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  async getPatientTreatmentPlans(patientId: number): Promise<TreatmentPlan[]> {
    return db
      .select()
      .from(treatmentPlans)
      .where(eq(treatmentPlans.patientId, patientId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async getPatientPayments(patientId: number): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.patientId, patientId));
  }

  async createMedicalNote(insertNote: InsertMedicalNote): Promise<MedicalNote> {
    const [note] = await db
      .insert(medicalNotes)
      .values(insertNote)
      .returning();
    return note;
  }

  async getPatientMedicalNotes(
    patientId: number,
    userRole: string
  ): Promise<MedicalNote[]> {
    return db
      .select()
      .from(medicalNotes)
      .where(eq(medicalNotes.patientId, patientId));
  }

  async createXray(insertXray: InsertXray): Promise<Xray> {
    const [xray] = await db
      .insert(xrays)
      .values(insertXray)
      .returning();
    return xray;
  }

  async getPatientXrays(patientId: number): Promise<Xray[]> {
    return db
      .select()
      .from(xrays)
      .where(eq(xrays.patientId, patientId));
  }
}

export const storage = new DatabaseStorage();