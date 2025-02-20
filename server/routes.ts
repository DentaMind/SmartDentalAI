import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertPatientSchema, insertAppointmentSchema, insertTreatmentPlanSchema } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Protected route middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/patients", requireAuth, async (_req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Appointment routes
  app.post("/api/appointments", requireAuth, async (req, res) => {
    try {
      const data = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(data);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/appointments/doctor/:doctorId", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getDoctorAppointments(Number(req.params.doctorId));
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Treatment Plan routes
  app.post("/api/treatment-plans", requireAuth, async (req, res) => {
    try {
      const data = insertTreatmentPlanSchema.parse(req.body);
      const plan = await storage.createTreatmentPlan(data);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/treatment-plans/patient/:patientId", requireAuth, async (req, res) => {
    try {
      const plans = await storage.getPatientTreatmentPlans(Number(req.params.patientId));
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Diagnosis route
  app.post("/api/ai/diagnose", requireAuth, async (req, res) => {
    try {
      const { symptoms, patientHistory } = req.body;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a dental AI assistant helping with diagnosis. Analyze the provided information and suggest possible diagnoses and treatment options."
          },
          {
            role: "user",
            content: `
Patient Symptoms: ${symptoms}
Medical History: ${patientHistory}
`
          }
        ],
        response_format: { type: "json_object" }
      });

      res.json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
