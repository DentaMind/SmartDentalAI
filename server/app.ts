import express, { NextFunction, Request, Response } from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";

const app = express();

// Setup basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Setup authentication
setupAuth(app);

// Patient routes
app.get("/api/patients", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const patients = await storage.getAllPatients();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch patients" 
    });
  }
});

// Get patient data - patients can only access their own data
app.get("/api/patients/:id", requireAuth, requireOwnership("id"), async (req, res) => {
  try {
    const patient = await storage.getPatient(Number(req.params.id));
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch patient" 
    });
  }
});

// Medical notes - only doctors can create/edit
app.post("/api/medical-notes", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const note = await storage.createMedicalNote(req.body);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating medical note:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create medical note" 
    });
  }
});

// X-rays - doctors and staff can upload, patients can view their own
app.post("/api/xrays", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const xray = await storage.createXray(req.body);
    res.status(201).json(xray);
  } catch (error) {
    console.error('Error creating x-ray:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create x-ray" 
    });
  }
});

// Get patient's x-rays
app.get("/api/xrays/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  try {
    const xrays = await storage.getPatientXrays(Number(req.params.patientId));
    res.json(xrays);
  } catch (error) {
    console.error('Error fetching x-rays:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch x-rays" 
    });
  }
});

// Payments and insurance
app.get("/api/payments/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  try {
    const payments = await storage.getPatientPayments(Number(req.params.patientId));
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch payments" 
    });
  }
});

// Treatment plans
app.post("/api/treatment-plans", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const plan = await storage.createTreatmentPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating treatment plan:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create treatment plan" 
    });
  }
});

// AI Prediction route - only accessible by doctors
app.post("/api/ai/predict", requireAuth, requireRole(["doctor"]), async (req, res) => {
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

// Error handling middleware must be the last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  // Ensure we only send JSON responses
  res.status(500).json({ 
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;