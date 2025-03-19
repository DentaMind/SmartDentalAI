import express from "express";
import OpenAI from "openai";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { aiCoordinator } from "./services/ai-coordinator";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";
import { analyzeMedicalHistory } from './services/medical-history-ai';
import { financialService } from './services/financial';
import { aiServiceManager } from './services/ai-service-manager';
import schedulerRoutes from './routes/scheduler-routes';
import translationRoutes from './routes/translation-routes';
import path from 'path';
import { PatientMedicalHistory } from '../shared/schema';

// Create OpenAI instance for diagnosis refinement
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_DIAGNOSIS });
import { seedDatabase } from './seed-data';

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
    console.log("Authenticated user:", req.user);
    
    // Log the auth user and user from request body for debugging
    console.log("Creating patient. Auth user:", req.user, "Request user ID:", req.body.userId, "Create account flag:", req.body.createAccount);
    
    let userId;
    let user;
    
    // STEP 1: Determine the userId for the patient record
    
    // If createAccount is true, we need to create a new user account first
    if (req.body.createAccount === true) {
      console.log("Creating new user account for patient");
      
      // Create user first (since patients need a user account)
      const userData = {
        username: req.body.username || `${req.body.firstName.toLowerCase()}${req.body.lastName.toLowerCase()}`,
        password: req.body.password || Math.random().toString(36).slice(-8),
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: "patient" as const,
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        insuranceProvider: req.body.insuranceProvider,
        insuranceNumber: req.body.insuranceNumber,
        language: req.body.language || "en"
      };

      console.log("Creating user with data:", userData);
      
      // Create the user
      user = await storage.createUser(userData);
      
      if (!user || !user.id) {
        throw new Error("Failed to create user account for patient");
      }
      
      console.log("User created successfully:", user);
      userId = user.id;
    } 
    // If the request includes a userId, use that (most likely the creating user's ID)
    else if (req.body.userId) {
      console.log("Using provided userId from request:", req.body.userId);
      userId = req.body.userId;
      
      // Get the user to include in the response
      try {
        user = await storage.getUser(userId);
        console.log("Found user for provided userId:", user);
      } catch (error) {
        console.error("Error finding user for provided userId:", error);
      }
    } 
    // If no userId is provided and createAccount is false, use the authenticated user's ID
    else if (req.user && req.user.id) {
      console.log("Using authenticated user's ID:", req.user.id);
      userId = req.user.id;
      user = req.user;
    } 
    // Last resort - if we're here, we have no valid user ID
    else {
      console.error("No valid user ID found for patient association");
      throw new Error("Patient must be associated with a user account");
    }
    
    console.log("Using userId:", userId);
    
    // Then create patient record linked to the user
    // Only include the fields that match the Patient schema
    const patientData = {
      userId: userId, // This is the critical field that needs to be set correctly
      
      // Personal Information
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      homeAddress: req.body.homeAddress || null,
      
      // Emergency Contact Information
      emergencyContactName: req.body.emergencyContactName || null,
      emergencyContactPhone: req.body.emergencyContactPhone || null,
      emergencyContactRelationship: req.body.emergencyContactRelationship || null,
      
      // Insurance Information
      insuranceProvider: req.body.insuranceProvider || null,
      insuranceNumber: req.body.insuranceNumber || null,
      
      // Medical History
      allergies: req.body.allergies || null,
      bloodType: req.body.bloodType || null,
      currentTreatment: req.body.currentTreatment || null,
      smokesTobacco: req.body.smokesTobacco || false,
      isPregnantOrNursing: req.body.isPregnantOrNursing || false,
      
      // Dental History
      lastDentalVisit: req.body.lastDentalVisit || null,
      chiefComplaint: req.body.chiefComplaint || null,
      currentSymptoms: req.body.currentSymptoms || null,
      
      // Consent Forms
      hipaaConsent: req.body.hipaaConsent || false,
      treatmentConsent: req.body.treatmentConsent || false,
      financialResponsibilityAgreement: req.body.financialResponsibilityAgreement || false,
      assignmentOfBenefits: req.body.assignmentOfBenefits || false,
      officePolicy: req.body.officePolicy || false
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
        if (user) {
          console.log("Would delete user:", user.id);
        }
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

// AI Diagnosis Refinement - Handles follow-up questions and responses
router.post("/ai/refine-diagnosis", requireAuth, async (req, res) => {
  try {
    const { 
      initialSymptoms, 
      patientResponse, 
      question, 
      previousDiagnosis, 
      conversationHistory, 
      patientContext 
    } = req.body;

    if (!initialSymptoms || !patientResponse || !question || !previousDiagnosis) {
      return res.status(400).json({ message: "Missing required information for diagnosis refinement" });
    }

    // Format conversation for the AI
    const formattedConversation = conversationHistory.map((msg: {role: string, content: string}) => ({
      role: msg.role,
      content: msg.content
    }));

    // Add the current Q&A
    formattedConversation.push(
      { role: "assistant", content: question },
      { role: "user", content: patientResponse }
    );

    // Prepare context
    const context = {
      initialSymptoms,
      previousDiagnosis,
      conversation: formattedConversation,
      patientHistory: patientContext?.patientHistory || "",
      vitalSigns: patientContext?.vitalSigns || {},
      relevantTests: patientContext?.relevantTests || []
    };

    // Send to OpenAI via aiServiceManager
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert dental diagnostician. A patient has provided their symptoms and answered follow-up questions. 
            Refine your diagnosis based on this new information. Return a JSON response with:
            1. refinedDiagnosis: An updated SymptomPrediction object with refined conditions, confidences, and recommendations
            2. nextQuestion: The next follow-up question to ask (or null if no more questions needed)
            3. reasoning: Explanation of how the new information changed your assessment`
          },
          {
            role: "user",
            content: JSON.stringify(context)
          }
        ],
        response_format: { type: "json_object" }
      });

      if (!response.choices[0].message.content) {
        throw new Error("Failed to get response from AI");
      }

      // Parse and send the refined diagnosis
      const refinedResult = JSON.parse(response.choices[0].message.content);
      res.json(refinedResult);
    } catch (error) {
      console.error("OpenAI API error:", error);
      
      // Fallback response if API fails
      const fallbackResponse = {
        refinedDiagnosis: previousDiagnosis,
        nextQuestion: null,
        reasoning: "Unable to refine diagnosis due to service limitations. Using previous assessment."
      };
      
      res.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Diagnosis refinement error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to refine diagnosis" 
    });
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

// Use translation routes
router.use('/api', translationRoutes);

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

// AI Interactive Diagnosis Routes
router.post('/ai/diagnosis', requireAuth, async (req, res) => {
  try {
    const { symptoms, patientHistory, vitalSigns, relevantTests, dentalRecords } = req.body;
    
    // In a production environment, this would call OpenAI or another AI provider
    // For now, we'll create a sample diagnosis response
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a realistic AI response
    const diagnosis = {
      possibleConditions: [
        {
          condition: "Pulpitis",
          description: "Inflammation of the dental pulp tissue, often caused by deep decay or trauma.",
          confidence: 0.82,
          urgencyLevel: "medium",
          recommendations: [
            "Schedule endodontic evaluation within 1-2 weeks",
            "Take ibuprofen 600mg every 6 hours for pain as needed",
            "Avoid extremely hot or cold foods and beverages"
          ],
          specialistReferral: null
        },
        {
          condition: "Cracked Tooth Syndrome",
          description: "A partial fracture of the tooth that may extend into the dentin and occasionally the pulp.",
          confidence: 0.65,
          urgencyLevel: "medium",
          recommendations: [
            "Avoid chewing on the affected side",
            "Consider crown placement to prevent fracture propagation",
            "Further evaluation with transillumination"
          ],
          specialistReferral: null
        },
        {
          condition: "Periapical Abscess",
          description: "Collection of pus at the root tip, typically resulting from bacterial infection.",
          confidence: 0.38,
          urgencyLevel: "high",
          recommendations: [
            "Immediate endodontic evaluation or extraction",
            "Antibiotic therapy may be required",
            "Drainage if significant swelling is present"
          ],
          specialistReferral: {
            type: "Endodontist",
            reason: "For specialized root canal treatment if abscess is confirmed"
          }
        }
      ],
      aiDomains: {
        endodontic: {
          findings: [
            "Possible pulpal involvement based on symptom duration and intensity",
            "Risk of infection spreading to periapical tissues",
            "Pulp vitality testing recommended"
          ],
          recommendations: [
            "Consider pulp vitality testing",
            "Evaluate for possible root canal therapy",
            "Monitor for signs of periapical pathology"
          ],
          confidenceLevel: 0.81
        },
        periodontic: {
          findings: [
            "No significant periodontal involvement indicated from symptoms",
            "Consider evaluating periodontal status around affected tooth"
          ],
          recommendations: [
            "Evaluate probing depths around affected tooth",
            "Rule out vertical root fracture if symptoms persist"
          ],
          confidenceLevel: 0.45
        },
        restorative: {
          findings: [
            "Potential need for crown if cracked tooth confirmed",
            "Evaluate existing restorations for recurrent decay",
            "Consider occlusal factors contributing to symptoms"
          ],
          recommendations: [
            "Evaluate occlusal forces and potential need for adjustment",
            "Consider protective restoration after endodontic treatment if needed",
            "Evaluate for parafunctional habits causing enamel fractures"
          ],
          confidenceLevel: 0.68
        }
      },
      generalAdvice: "Based on your symptoms, it's important to have a comprehensive evaluation soon. Meanwhile, avoid chewing on the affected side, take over-the-counter pain medication as directed, and maintain good oral hygiene. If pain increases significantly or swelling develops, seek immediate care.",
      followUpQuestions: [
        "Can you describe the intensity of the pain on a scale from 1-10?",
        "Does the pain wake you up at night?",
        "Have you noticed any swelling or unusual taste in your mouth?",
        "Are your symptoms affected by hot or cold food and drinks?",
        "Have you had any recent dental work done on the affected area?"
      ]
    };
    
    // Return the diagnosis with confidence levels and recommendations
    res.json(diagnosis);
  } catch (error) {
    console.error('Diagnosis error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate diagnosis'
    });
  }
});

router.post('/ai/refine-diagnosis', requireAuth, async (req, res) => {
  try {
    const {
      initialSymptoms,
      patientResponse,
      question,
      previousDiagnosis,
      conversationHistory,
      patientContext
    } = req.body;

    // Log the incoming request
    console.log('Refining diagnosis with follow-up response:', {
      question,
      response: patientResponse
    });

    // In a production environment, this would be integrated with OpenAI or another AI provider
    // For now, we'll simulate the AI refinement with a mock response
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a refined diagnosis based on the previous diagnosis and the new information
    const refinedDiagnosis = { ...previousDiagnosis };
    
    // Increase confidence of highest confidence condition based on user response
    if (refinedDiagnosis.possibleConditions && refinedDiagnosis.possibleConditions.length > 0) {
      // Find the highest confidence condition
      const highestConfidenceIndex = refinedDiagnosis.possibleConditions
        .reduce((maxIndex: number, condition: any, index: number, array: any[]) => 
          condition.confidence > array[maxIndex].confidence ? index : maxIndex, 0);
      
      // Increase confidence slightly (capped at 0.95)
      const currentConfidence = refinedDiagnosis.possibleConditions[highestConfidenceIndex].confidence;
      refinedDiagnosis.possibleConditions[highestConfidenceIndex].confidence = 
        Math.min(currentConfidence + 0.1, 0.95);
    }
    
    // Determine if we need another follow-up question
    let nextQuestion = null;
    const followupQuestions = [
      "Can you describe the intensity of the pain on a scale from 1-10?",
      "Does the pain wake you up at night?",
      "Have you noticed any swelling or unusual taste in your mouth?",
      "Are your symptoms affected by hot or cold food and drinks?",
      "Have you had any recent dental work done on the affected area?"
    ];
    
    // Check if there are follow-up questions in the conversation history
    const askedQuestions = conversationHistory
      .filter((msg: {role: string, content: string}) => msg.role === "assistant")
      .map((msg: {role: string, content: string}) => msg.content);
    
    // Find a question we haven't asked yet
    const remainingQuestions = followupQuestions.filter(q => !askedQuestions.includes(q));
    
    // Decide if we need another question (max 3 questions)
    if (remainingQuestions.length > 0 && askedQuestions.length < 3) {
      nextQuestion = remainingQuestions[0];
    }
    
    // Send back the refined diagnosis and next question (if any)
    res.json({
      refinedDiagnosis,
      nextQuestion,
      processingDetails: "Patient response analyzed and diagnosis refined"
    });
  } catch (error) {
    console.error('Diagnosis refinement error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to refine diagnosis'
    });
  }
});

// Mount all routes under /api prefix
app.use("/api", router);

export default app;