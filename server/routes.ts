import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIDiagnosis, generateTreatmentPlan } from "./ai";
import { insertPatientSchema, insertAppointmentSchema, insertTreatmentPlanSchema } from "@shared/schema";

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Patient routes
  app.post("/api/patients", requireAuth, async (req, res) => {
    const data = insertPatientSchema.parse(req.body);
    const patient = await storage.createPatient(data);
    res.status(201).json(patient);
  });

  app.get("/api/patients", requireAuth, async (_req, res) => {
    const patients = await storage.listPatients();
    res.json(patients);
  });

  app.get("/api/patients/:id", requireAuth, async (req, res) => {
    const patient = await storage.getPatient(parseInt(req.params.id));
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  });

  // Appointment routes
  app.post("/api/appointments", requireAuth, async (req, res) => {
    const data = insertAppointmentSchema.parse(req.body);
    const appointment = await storage.createAppointment(data);
    res.status(201).json(appointment);
  });

  app.get("/api/appointments", requireAuth, async (_req, res) => {
    const appointments = await storage.listAppointments();
    res.json(appointments);
  });

  // Treatment plan routes
  app.post("/api/treatment-plans", requireAuth, async (req, res) => {
    const data = insertTreatmentPlanSchema.parse(req.body);
    const plan = await storage.createTreatmentPlan(data);
    res.status(201).json(plan);
  });

  app.get("/api/treatment-plans/:id", requireAuth, async (req, res) => {
    const plan = await storage.getTreatmentPlan(parseInt(req.params.id));
    if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
    res.json(plan);
  });

  // AI routes
  app.post("/api/ai/diagnosis", requireAuth, async (req, res) => {
    const { symptoms, xrayImage } = req.body;
    const diagnosis = await generateAIDiagnosis(symptoms, xrayImage);
    res.json(diagnosis);
  });

  app.post("/api/ai/treatment-plan", requireAuth, async (req, res) => {
    const { diagnosis, patientHistory } = req.body;
    const plan = await generateTreatmentPlan(diagnosis, patientHistory);
    res.json(plan);
  });

  const httpServer = createServer(app);
  return httpServer;
}
