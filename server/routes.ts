import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { insertPatientSchema, insertAppointmentSchema, insertTreatmentPlanSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Protected route middleware
  const requireAuth = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Patient routes
  app.post("/api/patients", requireAuth, async (req, res) => {
    try {
      const data = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(data);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/patients", requireAuth, async (_req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // Appointment routes
  app.post("/api/appointments", requireAuth, async (req, res) => {
    try {
      const data = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(data);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/appointments/doctor/:doctorId", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getDoctorAppointments(Number(req.params.doctorId));
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // Treatment Plan routes
  app.post("/api/treatment-plans", requireAuth, async (req, res) => {
    try {
      const data = insertTreatmentPlanSchema.parse(req.body);
      const plan = await storage.createTreatmentPlan(data);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/treatment-plans/patient/:patientId", requireAuth, async (req, res) => {
    try {
      const plans = await storage.getPatientTreatmentPlans(Number(req.params.patientId));
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // Payment routes
  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const data = insertPaymentSchema.parse(req.body);
      const payment = await createPayment(data);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/payments/patient/:patientId", requireAuth, async (req, res) => {
    try {
      const payments = await storage.getPatientPayments(Number(req.params.patientId));
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // AI Prediction route
  app.post("/api/ai/predict", requireAuth, async (req, res) => {
    try {
      const { symptoms, patientHistory } = req.body;

      if (!symptoms) {
        return res.status(400).json({ message: "Symptoms are required" });
      }

      const prediction = await predictFromSymptoms(symptoms, patientHistory);
      res.json(prediction);
    } catch (error) {
      console.error("AI Prediction error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate prediction" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}