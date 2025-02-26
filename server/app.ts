import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";

const app = express();
const router = express.Router();

// Setup middleware
app.use(express.json());

// Setup authentication on the router
setupAuth(router);

// Patient routes
router.post("/patients", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const patient = await storage.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

// Get patient data - patients can only access their own data
router.get("/patients/:id", requireAuth, requireOwnership("id"), async (req, res) => {
  try {
    const patient = await storage.getPatient(Number(req.params.id));
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
  }
});

// Medical notes - only doctors can create/edit
router.post("/medical-notes", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const note = await storage.createMedicalNote(req.body);
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

// X-rays - doctors and staff can upload, patients can view their own
router.post("/xrays", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const xray = await storage.createXray(req.body);
    res.status(201).json(xray);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

// Get patient's x-rays
router.get("/xrays/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  try {
    const xrays = await storage.getPatientXrays(Number(req.params.patientId));
    res.json(xrays);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
  }
});

// Payments and insurance
router.get("/payments/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  try {
    const payments = await storage.getPatientPayments(Number(req.params.patientId));
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
  }
});

// Appointments
router.post("/appointments", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const appointment = await storage.createAppointment(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

// Treatment plans
router.post("/treatment-plans", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const plan = await storage.createTreatmentPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

// AI Prediction route - only accessible by doctors
router.post("/ai/predict", requireAuth, requireRole(["doctor"]), async (req, res) => {
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

// Mount all routes under /api prefix
app.use("/api", router);

export default app;