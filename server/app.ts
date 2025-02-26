import express, { NextFunction, Request, Response } from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";

const app = express();

// Setup basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup CORS headers - must be before auth middleware
app.use((req, res, next) => {
  // Allow specific origins in production
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Setup authentication
setupAuth(app);

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

// Error handling middleware must be the last middleware before Vite
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.message
    });
  }

  // Generic error response
  res.status(500).json({ 
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;