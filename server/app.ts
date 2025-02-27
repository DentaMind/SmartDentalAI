import express, { NextFunction, Request, Response } from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";
import { insertUserSchema } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const app = express();
const scryptAsync = promisify(scrypt);

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup authentication
setupAuth(app);

// Provider registration endpoint
app.post("/providers", async (req, res) => {
  try {
    // Validate provider-specific fields
    const providerSchema = insertUserSchema.omit({ 
      role: true, 
      language: true
    });

    const validation = providerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid input data", 
        errors: validation.error.errors 
      });
    }

    // Generate credentials
    const username = `${req.body.firstName.toLowerCase()}${req.body.lastName.toLowerCase()}`;
    const password = Math.random().toString(36).slice(-8);

    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    // Create provider user
    const user = await storage.createUser({
      ...validation.data,
      role: "doctor",
      language: "en",
      username,
      password: hashedPassword,
    });

    res.status(201).json({ 
      success: true,
      user,
      credentials: {
        username,
        password
      }
    });
  } catch (error) {
    console.error("Provider registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// API Routes
app.get("/patients", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  const patients = await storage.getAllPatients();
  res.json(patients);
});

// Get patient data - patients can only access their own data
app.get("/patients/:id", requireAuth, requireOwnership("id"), async (req, res) => {
  const patient = await storage.getPatient(Number(req.params.id));
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  res.json(patient);
});

// Medical notes - only doctors can create/edit
app.post("/medical-notes", requireAuth, requireRole(["doctor"]), async (req, res) => {
  const note = await storage.createMedicalNote(req.body);
  res.status(201).json(note);
});

// X-rays - doctors and staff can upload, patients can view their own
app.post("/xrays", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  const xray = await storage.createXray(req.body);
  res.status(201).json(xray);
});

// Get patient's x-rays
app.get("/xrays/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  const xrays = await storage.getPatientXrays(Number(req.params.patientId));
  res.json(xrays);
});

// Payments and insurance
app.get("/payments/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  const payments = await storage.getPatientPayments(Number(req.params.patientId));
  res.json(payments);
});

// Treatment plans
app.post("/treatment-plans", requireAuth, requireRole(["doctor"]), async (req, res) => {
  const plan = await storage.createTreatmentPlan(req.body);
  res.status(201).json(plan);
});

// AI Prediction route - only accessible by doctors
app.post("/ai/predict", requireAuth, requireRole(["doctor"]), async (req, res) => {
  const { symptoms, patientHistory } = req.body;

  if (!symptoms) {
    return res.status(400).json({ message: "Symptoms are required" });
  }

  const prediction = await predictFromSymptoms(symptoms, patientHistory);
  res.json(prediction);
});

export default app;