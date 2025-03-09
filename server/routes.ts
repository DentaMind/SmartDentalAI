import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { aiCoordinator } from "./services/ai-coordinator";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";
import { analyzeMedicalHistory } from './services/medical-history-ai';
import { financialService } from './services/financial';
import { aiServiceManager } from './services/ai-service-manager';
import schedulerRoutes from './routes/scheduler-routes';
import path from 'path';
import { PatientMedicalHistory } from '../shared/schema';

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
    
    if (!user || !user.id) {
      throw new Error("Failed to create user account for patient");
    }
    
    console.log("User created successfully:", user);
    
    // Then create patient record linked to the user
    const patientData = {
      userId: user.id, // This is the critical field that needs to be set correctly
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      dateOfBirth: req.body.dateOfBirth,
      insuranceProvider: req.body.insuranceProvider || null,
      insuranceNumber: req.body.insuranceNumber || null,
      medicalHistory: req.body.medicalHistory || null,
      allergies: req.body.allergies || null,
      bloodType: req.body.bloodType || null,
      emergencyContact: req.body.emergencyContact || null
    };
    
    console.log("Creating patient with data:", patientData);
    try {
      const patient = await storage.createPatient(patientData);
      console.log("Patient created successfully:", patient);
      
      // Return both user and patient data
      res.status(201).json({ ...patient, user });
    } catch (patientError) {
      console.error("Error creating patient record:", patientError);
      
      // If creating the patient record fails, we should clean up the user we just created
      // to avoid orphaned user accounts
      try {
        // Here we would ideally delete the user we just created
        console.log("Would delete user:", user.id);
      } catch (cleanupError) {
        console.error("Error cleaning up user after patient creation failure:", cleanupError);
      }
      
      throw patientError;
    }
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

// AI Status endpoint - provides metrics about AI service health and usage
router.get("/ai/status", requireAuth, async (req, res) => {
  try {
    // Get AI services status from the AI service manager
    const aiStatus = aiServiceManager.getAIStatus();
    
    // Add additional metrics to the status like request counts and lastUsed
    const enhancedStatus = Object.entries(aiStatus).reduce((acc, [service, status]) => {
      const now = Date.now();
      const lastUsed = now - Math.floor(Math.random() * 600000); // Simulate last used timestamp (within last 10 minutes)
      
      // Add data for enhanced status display
      acc[service] = {
        ...status,
        requestCount: Math.floor(Math.random() * 100),  // Simulated request count
        lastUsed: new Date(lastUsed).toISOString(),
        backupAvailable: Math.random() > 0.3, // Randomly show backup availability for demo purposes
        primaryKey: `...${service.substring(0, 4)}` // Just show a service prefix for demo
      };
      
      return acc;
    }, {} as Record<string, any>);
    
    res.json(enhancedStatus);
  } catch (error) {
    console.error("Error getting AI status:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get AI status" 
    });
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

// AI Services Status Endpoint
router.get('/ai/status', requireAuth, async (req, res) => {
  try {
    const aiStatus = aiServiceManager.getAIStatus();
    res.json(aiStatus);
  } catch (error) {
    console.error('AI Status error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to get AI service status' 
    });
  }
});

// AI Queue Status Endpoint
router.get('/ai/queue', requireAuth, async (req, res) => {
  try {
    const queueStatus = aiServiceManager.getQueueStatus();
    res.json(queueStatus);
  } catch (error) {
    console.error('AI Queue error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to get AI queue status' 
    });
  }
});

// AI Forecasting Endpoints
router.post('/ai/financial-forecast', requireAuth, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { months = 12, historicalData } = req.body;
    
    if (!historicalData) {
      return res.status(400).json({ message: 'Historical data is required for forecasting' });
    }
    
    const forecast = await aiServiceManager.generateFinancialForecast(historicalData, months);
    res.json(forecast);
  } catch (error) {
    console.error('Financial forecast error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate financial forecast' 
    });
  }
});

// Financial routes
router.get('/financial/summary', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const summary = await financialService.getFinancialSummary(startDate, endDate);
    res.json(summary);
  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to get financial summary'
    });
  }
});

router.get('/financial/forecast', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const months = req.query.months ? Number(req.query.months) : 12;
    
    const forecast = await financialService.generateFinancialForecast(months);
    res.json(forecast);
  } catch (error) {
    console.error('Financial forecast error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate financial forecast'
    });
  }
});

router.get('/financial/aging-report', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const agingReport = await financialService.generateAgingReport();
    res.json(agingReport);
  } catch (error) {
    console.error('Aging report error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate aging report'
    });
  }
});

router.get('/financial/profitability/:year', requireAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (isNaN(year)) {
      return res.status(400).json({ message: 'Invalid year provided' });
    }
    
    const profitabilityReport = await financialService.generateProfitabilityReport(year);
    res.json(profitabilityReport);
  } catch (error) {
    console.error('Profitability report error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate profitability report'
    });
  }
});

router.get('/financial/tax-report/:year', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (isNaN(year)) {
      return res.status(400).json({ message: 'Invalid year provided' });
    }
    
    const taxReport = await financialService.generateTaxReport(year);
    res.json(taxReport);
  } catch (error) {
    console.error('Tax report error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate tax report'
    });
  }
});

router.post('/financial/payment', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const payment = await financialService.processPayment(req.body);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to process payment'
    });
  }
});

router.post('/financial/insurance-claim', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const claim = await financialService.submitInsuranceClaim(req.body);
    res.status(201).json(claim);
  } catch (error) {
    console.error('Insurance claim submission error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to submit insurance claim'
    });
  }
});

router.get('/financial/patient-cost-estimate/:treatmentPlanId', requireAuth, async (req, res) => {
  try {
    const treatmentPlanId = Number(req.params.treatmentPlanId);
    const insuranceProviderId = req.query.insuranceProviderId as string;
    
    if (isNaN(treatmentPlanId)) {
      return res.status(400).json({ message: 'Invalid treatment plan ID' });
    }
    
    if (!insuranceProviderId) {
      return res.status(400).json({ message: 'Insurance provider ID is required' });
    }
    
    const estimate = await financialService.estimatePatientCost(treatmentPlanId, insuranceProviderId);
    res.json(estimate);
  } catch (error) {
    console.error('Cost estimate error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate cost estimate'
    });
  }
});

// Mount all routes under /api prefix
app.use("/api", router);

export default app;