import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { aiCoordinator } from "./services/ai-coordinator";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";
import { analyzeMedicalHistory } from './services/medical-history-ai';
import schedulerRoutes from './routes/scheduler-routes';
import path from 'path';

const app = express();
const router = express.Router();

// Setup middleware
app.use(express.json());

// Setup authentication on the router
setupAuth(router);

// Patient routes
router.post("/patients", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    console.log("Creating new patient:", req.body);
    
    // Create user first (since patients need a user account)
    const userData = {
      username: req.body.username || `${req.body.firstName.toLowerCase()}${req.body.lastName.toLowerCase()}`,
      password: req.body.password || Math.random().toString(36).slice(-8),
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: "patient" as const, // Use a const assertion to fix the type issue
      phoneNumber: req.body.phoneNumber,
      dateOfBirth: req.body.dateOfBirth,
      insuranceProvider: req.body.insuranceProvider,
      insuranceNumber: req.body.insuranceNumber,
      language: req.body.language || "en"
    };

    console.log("Creating user with data:", userData);
    // Create the user
    const user = await storage.createUser(userData);
    console.log("User created successfully:", user);
    
    // Then create patient record linked to the user
    const patientData = {
      userId: user.id,
      medicalHistory: req.body.medicalHistory || null,
      allergies: req.body.allergies || null,
      bloodType: req.body.bloodType || null,
      emergencyContact: req.body.emergencyContact || null
    };
    
    console.log("Creating patient with data:", patientData);
    const patient = await storage.createPatient(patientData);
    console.log("Patient created successfully:", patient);
    
    // Return both user and patient data
    res.status(201).json({ ...patient, user });
  } catch (error) {
    console.error("Error creating patient:", error);
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

// Get all patients route
router.get("/patients", requireAuth, async (req, res) => {
  try {
    console.log("Getting all patients...");
    const patients = await storage.getAllPatients();
    console.log("Patient count:", patients.length);
    console.log("Patients:", JSON.stringify(patients, null, 2));
    res.json(patients);
  } catch (error) {
    console.error("Error getting all patients:", error);
    res.status(500).json({ message: "Failed to get patients" });
  }
});

// AI Prediction route
router.post("/ai/predict", requireAuth, async (req, res) => {
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

// AI Diagnosis route - This is the main endpoint for the AI diagnostics page
router.post("/ai/diagnosis", requireAuth, async (req, res) => {
  try {
    const { symptoms, patientHistory, xrayImages } = req.body;

    if (!symptoms) {
      return res.status(400).json({ message: "Symptoms are required" });
    }

    // Use the aiCoordinator to analyze the diagnosis
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

// Medical History Analysis API
router.post("/ai/medical-analysis", requireAuth, async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const rawMedicalHistory = await storage.getPatientMedicalHistory(patientId);
    console.log("Raw medical history:", rawMedicalHistory);
    
    // Convert string to PatientMedicalHistory object if needed
    let medicalHistory: PatientMedicalHistory = {};
    if (typeof rawMedicalHistory === 'string' && rawMedicalHistory) {
      try {
        medicalHistory = JSON.parse(rawMedicalHistory) as PatientMedicalHistory;
      } catch (e) {
        console.error("Failed to parse medical history:", e);
        // If parsing fails, create a basic structure with the text
        medicalHistory = { 
          systemicConditions: [rawMedicalHistory]
        };
      }
    } else if (typeof rawMedicalHistory === 'object' && rawMedicalHistory !== null) {
      medicalHistory = rawMedicalHistory as PatientMedicalHistory;
    }
    
    console.log("Processed medical history for analysis:", medicalHistory);
    const analysis = await analyzeMedicalHistory(medicalHistory);

    res.json(analysis);
  } catch (error) {
    console.error("Medical analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to analyze medical history" 
    });
  }
});

// Use scheduler routes
router.use('/scheduler', schedulerRoutes);

// Mount all routes under /api prefix
app.use("/api", router);

export default app;