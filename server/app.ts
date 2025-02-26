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

// Force JSON responses for all API routes
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Setup authentication
setupAuth(app);

// Patient registration endpoint
app.post("/patients", async (req, res) => {
  try {
    const validation = insertUserSchema.omit({
      role: true,
      language: true,
      specialization: true,
      licenseNumber: true,
      username: true,
      password: true
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid input data", 
        errors: validation.error.errors 
      });
    }

    const username = `${req.body.firstName.toLowerCase()}${req.body.lastName.toLowerCase()}`;
    const password = Math.random().toString(36).slice(-8);

    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    const user = await storage.createUser({
      ...validation.data,
      role: "patient",
      language: "en",
      specialization: null,
      licenseNumber: null,
      username,
      password: hashedPassword,
    });

    return res.status(201).json({ 
      success: true,
      user,
      credentials: {
        username,
        password
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error during registration" });
  }
});

// API Routes
app.get("/api/patients", requireAuth, requireRole(["doctor", "staff"]), async (req, res, next) => {
  try {
    const patients = await storage.getAllPatients();
    res.json(patients);
  } catch (error) {
    next(error);
  }
});

// Get patient data - patients can only access their own data
app.get("/api/patients/:id", requireAuth, requireOwnership("id"), async (req, res, next) => {
  try {
    const patient = await storage.getPatient(Number(req.params.id));
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    next(error);
  }
});

// Medical notes - only doctors can create/edit
app.post("/api/medical-notes", requireAuth, requireRole(["doctor"]), async (req, res, next) => {
  try {
    const note = await storage.createMedicalNote(req.body);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// X-rays - doctors and staff can upload, patients can view their own
app.post("/api/xrays", requireAuth, requireRole(["doctor", "staff"]), async (req, res, next) => {
  try {
    const xray = await storage.createXray(req.body);
    res.status(201).json(xray);
  } catch (error) {
    next(error);
  }
});

// Get patient's x-rays
app.get("/api/xrays/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res, next) => {
  try {
    const xrays = await storage.getPatientXrays(Number(req.params.patientId));
    res.json(xrays);
  } catch (error) {
    next(error);
  }
});

// Payments and insurance
app.get("/api/payments/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res, next) => {
  try {
    const payments = await storage.getPatientPayments(Number(req.params.patientId));
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Treatment plans
app.post("/api/treatment-plans", requireAuth, requireRole(["doctor"]), async (req, res, next) => {
  try {
    const plan = await storage.createTreatmentPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

// AI Prediction route - only accessible by doctors
app.post("/api/ai/predict", requireAuth, requireRole(["doctor"]), async (req, res, next) => {
  try {
    const { symptoms, patientHistory } = req.body;

    if (!symptoms) {
      return res.status(400).json({ message: "Symptoms are required" });
    }

    const prediction = await predictFromSymptoms(symptoms, patientHistory);
    res.json(prediction);
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ 
    message: err.message || "Internal server error"
  });
});

export default app;