import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";
import { errorHandler, notFoundHandler, handleRateLimitError } from "./middleware/error-handler";
import { financialService } from "./services/financial";
import { patientPortal } from "./services/patient-portal";
import { dashboardAnalytics } from "./services/dashboard-analytics";
import { dataIntegrity } from "./services/data-integrity";

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


// Financial routes
router.get("/api/financial/summary", requireAuth, async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    const summary = await financialService.getFinancialSummary(startDate, endDate);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get financial summary" 
    });
  }
});

router.get("/api/financial/tax-report/:year", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const report = await financialService.generateTaxReport(year);
    res.json(report);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate tax report" 
    });
  }
});

router.post("/api/insurance/claims", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const claim = await financialService.submitInsuranceClaim(req.body);
    res.status(201).json(claim);
  } catch (error) {
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to submit insurance claim" 
    });
  }
});

router.post("/api/payments", requireAuth, async (req, res) => {
  try {
    const payment = await financialService.processPayment(req.body);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to process payment" 
    });
  }
});

// Mount all routes under /api prefix
app.use("/api", router);

// Add error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;