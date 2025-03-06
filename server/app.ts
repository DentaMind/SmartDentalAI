import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { aiCoordinator } from "./services/ai-coordinator";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";
import { setupSecurityMiddleware } from "./middleware/security";
import { generateDiagnosticReport } from './services/report-generator';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { securityService } from "./services/security";
import { financialService } from "./services/financial";
import path from 'path';

const app = express();
const router = express.Router();

// Setup middleware
app.use(express.json());
setupSecurityMiddleware(app);

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

// Get all patients route (added from edited code)
router.get("/patients", requireAuth, async (req, res) => {
  try {
    const patients = await storage.getAllPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Failed to get patients" });
  }
});


// AI Diagnosis route (simplified from edited code)
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
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate prediction" });
  }
});

// Financial routes (simplified from edited code, removed redundant routes)
router.get("/financial/summary", requireAuth, async (req, res) => {
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

router.get("/financial/tax-report/:year", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
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

router.post("/insurance/claims", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const claim = await financialService.submitInsuranceClaim(req.body);
    res.status(201).json(claim);
  } catch (error) {
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to submit insurance claim" 
    });
  }
});

router.post("/payments", requireAuth, async (req, res) => {
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