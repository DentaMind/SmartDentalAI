import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { aiCoordinator } from "./services/ai-coordinator";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";

const app = express();
const router = express.Router();

// Setup middleware
app.use(express.json());

// Setup authentication on the router
setupAuth(router);

// Patient routes
app.post("/patients", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const patient = await storage.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

// Get patient data - patients can only access their own data
app.get("/patients/:id", requireAuth, requireOwnership("id"), async (req, res) => {
  try {
    const patient = await storage.getPatient(Number(req.params.id));
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
  }
});

// Get all patients route
app.get("/api/patients", requireAuth, async (req, res) => {
  try {
    const patients = await storage.getAllPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Failed to get patients" });
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
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate prediction" });
  }
});

// AI Analysis Routes
router.post("/ai/comprehensive-analysis", requireAuth, async (req, res) => {
  try {
    const { patientId, symptoms, xrayImages } = req.body;

    if (!patientId || !symptoms) {
      return res.status(400).json({ message: "Patient ID and symptoms are required" });
    }

    const analysis = await aiCoordinator.generateComprehensivePlan(
      patientId,
      symptoms,
      xrayImages
    );

    res.json(analysis);
  } catch (error) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate analysis" 
    });
  }
});

router.post("/ai/diagnosis", requireAuth, async (req, res) => {
  try {
    const { symptoms, patientHistory, xrayImages } = req.body;

    if (!symptoms) {
      return res.status(400).json({ message: "Symptoms are required" });
    }

    const diagnosis = await aiCoordinator.analyzeDiagnosis(
      symptoms,
      patientHistory || "",
      xrayImages
    );

    res.json(diagnosis);
  } catch (error) {
    console.error("Diagnosis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate diagnosis" 
    });
  }
});

router.post("/ai/treatment-plan", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { diagnosis, patientHistory, insuranceProvider } = req.body;

    if (!diagnosis) {
      return res.status(400).json({ message: "Diagnosis is required" });
    }

    const treatmentPlan = await aiCoordinator.generateTreatmentPlan(
      diagnosis,
      patientHistory || "",
      insuranceProvider
    );

    res.json(treatmentPlan);
  } catch (error) {
    console.error("Treatment Plan error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate treatment plan" 
    });
  }
});

router.post("/ai/treatment-sequence", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { treatmentPlan, patientAvailability } = req.body;

    if (!treatmentPlan) {
      return res.status(400).json({ message: "Treatment plan is required" });
    }

    const sequence = await aiCoordinator.createTreatmentSequence(
      treatmentPlan,
      patientAvailability
    );

    res.json(sequence);
  } catch (error) {
    console.error("Sequence Generation error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate treatment sequence" 
    });
  }
});

router.post("/ai/cost-analysis", requireAuth, async (req, res) => {
  try {
    const { treatmentPlan, insuranceDetails } = req.body;

    if (!treatmentPlan) {
      return res.status(400).json({ message: "Treatment plan is required" });
    }

    const costAnalysis = await aiCoordinator.analyzeCosts(
      treatmentPlan,
      insuranceDetails
    );

    res.json(costAnalysis);
  } catch (error) {
    console.error("Cost Analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate cost analysis" 
    });
  }
});

// Mount all routes under /api prefix
app.use("/api", router);

export default app;