import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { aiCoordinator } from "./services/ai-coordinator";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";
import { generateDiagnosticReport } from './services/report-generator'; // Added import
import path from 'path'; // Added import

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

// Get all patients route
router.get("/patients", requireAuth, async (req, res) => {
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

// Orthodontic AI Routes
router.post("/ai/orthodontic/analyze", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { patientId, images, measurements } = req.body;

    if (!patientId || !images || !images.length) {
      return res.status(400).json({ message: "Patient ID and images are required" });
    }

    const { analyzeOrthodonticCase } = await import('./services/orthodontic-ai');
    const analysis = await analyzeOrthodonticCase(patientId, images, measurements);

    res.json(analysis);
  } catch (error) {
    console.error("Orthodontic analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to analyze orthodontic case" 
    });
  }
});

router.post("/ai/orthodontic/treatment-plan", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { analysis, insuranceProvider } = req.body;

    if (!analysis) {
      return res.status(400).json({ message: "Orthodontic analysis is required" });
    }

    const { generateTreatmentPlan } = await import('./services/orthodontic-ai');
    const treatmentPlan = await generateTreatmentPlan(analysis, insuranceProvider);

    res.json(treatmentPlan);
  } catch (error) {
    console.error("Orthodontic treatment plan error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate orthodontic treatment plan" 
    });
  }
});

router.post("/ai/orthodontic/simulate", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { patientId, treatmentOption, images } = req.body;

    if (!patientId || !treatmentOption || !images || !images.length) {
      return res.status(400).json({ message: "Patient ID, treatment option, and images are required" });
    }

    const { simulate3DTreatmentOutcome } = await import('./services/orthodontic-ai');
    const simulation = await simulate3DTreatmentOutcome(patientId, treatmentOption, images);

    res.json(simulation);
  } catch (error) {
    console.error("Orthodontic simulation error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to simulate orthodontic treatment" 
    });
  }
});

// Imaging AI Routes
router.post("/ai/imaging/analyze", requireAuth, async (req, res) => {
  try {
    const { imageUrls, patientId, analysisType, previousAnalysisId } = req.body;

    if (!imageUrls || !imageUrls.length || !patientId) {
      return res.status(400).json({ message: "Images and patient ID are required" });
    }

    const { analyzeDentalImages } = await import('./services/imaging-analyzer');
    const analysis = await analyzeDentalImages(
      imageUrls, 
      patientId, 
      analysisType || "standard", 
      previousAnalysisId
    );

    res.json(analysis);
  } catch (error) {
    console.error("Imaging analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to analyze images" 
    });
  }
});

router.post("/ai/imaging/cbct", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { cbctImages, patientId } = req.body;

    if (!cbctImages || !cbctImages.length || !patientId) {
      return res.status(400).json({ message: "CBCT images and patient ID are required" });
    }

    const { analyzeCBCT } = await import('./services/imaging-analyzer');
    const analysis = await analyzeCBCT(cbctImages, patientId);

    res.json(analysis);
  } catch (error) {
    console.error("CBCT analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to analyze CBCT" 
    });
  }
});

// Treatment Analytics Routes
router.post("/ai/analytics/comparative-cases", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { diagnosis, treatmentPlan, patientDemographics } = req.body;

    if (!diagnosis || !treatmentPlan || !patientDemographics) {
      return res.status(400).json({ message: "Diagnosis, treatment plan, and patient demographics are required" });
    }

    const { analyzeComparativeCases } = await import('./services/treatment-analytics');
    const analytics = await analyzeComparativeCases(diagnosis, treatmentPlan, patientDemographics);

    res.json(analytics);
  } catch (error) {
    console.error("Comparative case analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to analyze comparative cases" 
    });
  }
});

router.post("/ai/analytics/insurance-optimization", requireAuth, async (req, res) => {
  try {
    const { treatmentPlan, insuranceDetails } = req.body;

    if (!treatmentPlan || !insuranceDetails) {
      return res.status(400).json({ message: "Treatment plan and insurance details are required" });
    }

    const { optimizeForInsurance } = await import('./services/treatment-analytics');
    const optimization = await optimizeForInsurance(treatmentPlan, insuranceDetails);

    res.json(optimization);
  } catch (error) {
    console.error("Insurance optimization error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to optimize for insurance" 
    });
  }
});

router.post("/ai/analytics/long-term-outcomes", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { diagnosis, treatmentPlan, patientCompliance, lifestyleFactors } = req.body;

    if (!diagnosis || !treatmentPlan) {
      return res.status(400).json({ message: "Diagnosis and treatment plan are required" });
    }

    const { predictLongTermOutcomes } = await import('./services/treatment-analytics');
    const outcomes = await predictLongTermOutcomes(
      diagnosis, 
      treatmentPlan, 
      patientCompliance, 
      lifestyleFactors
    );

    res.json(outcomes);
  } catch (error) {
    console.error("Long-term outcome prediction error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to predict long-term outcomes" 
    });
  }
});

router.get("/ai/analytics/practice-performance", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
  try {
    const { procedureType, timeframe } = req.query;

    if (!procedureType) {
      return res.status(400).json({ message: "Procedure type is required" });
    }

    const { analyzePracticePerformance } = await import('./services/treatment-analytics');
    const performance = await analyzePracticePerformance(
      procedureType as string, 
      (timeframe as any) || "last90days"
    );

    res.json(performance);
  } catch (error) {
    console.error("Practice performance analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to analyze practice performance" 
    });
  }
});

// Dashboard Analytics Routes
router.get("/dashboard/analytics", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
  try {
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;
    
    const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    
    const dashboardData = await dashboardAnalytics.generateDashboardData(startDate, endDate);
    const insights = await dashboardAnalytics.generateSmartInsights(dashboardData);
    
    res.json({
      ...dashboardData,
      insights
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate dashboard analytics" 
    });
  }
});

router.get("/dashboard/perio-trends", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const trends = await dashboardAnalytics.getPeriodontalHealthTrends(months);
    
    res.json(trends);
  } catch (error) {
    console.error("Periodontal trends error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get periodontal trends" 
    });
  }
});

router.get("/dashboard/ai-impact", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
  try {
    const metrics = await dashboardAnalytics.getAIImpactMetrics();
    
    res.json(metrics);
  } catch (error) {
    console.error("AI impact metrics error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get AI impact metrics" 
    });
  }
});

// Patient Portal Routes
router.post("/patient-portal/messages", requireAuth, async (req, res) => {
  try {
    const message = await patientPortal.sendMessage(req.body);
    
    res.status(201).json(message);
  } catch (error) {
    console.error("Message sending error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to send message" 
    });
  }
});

router.post("/patient-portal/appointment-requests", requireAuth, async (req, res) => {
  try {
    const request = await patientPortal.requestAppointment(req.body);
    
    res.status(201).json(request);
  } catch (error) {
    console.error("Appointment request error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to request appointment" 
    });
  }
});

router.post("/patient-portal/documents", requireAuth, async (req, res) => {
  try {
    const documentAccess = await patientPortal.shareDocument(req.body);
    
    res.status(201).json(documentAccess);
  } catch (error) {
    console.error("Document sharing error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to share document" 
    });
  }
});

router.get("/patient-portal/timeline/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const timeline = await patientPortal.getPatientTimeline(patientId);
    
    res.json(timeline);
  } catch (error) {
    console.error("Patient timeline error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get patient timeline" 
    });
  }
});

router.get("/patient-portal/education/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const condition = req.query.condition as string;
    const resources = await patientPortal.getPatientEducationResources(patientId, condition);
    
    res.json(resources);
  } catch (error) {
    console.error("Education resources error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get education resources" 
    });
  }
});

// Data Integrity Routes
router.post("/validation/patient", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const validation = await dataIntegrity.validatePatientData(req.body);
    
    res.json(validation);
  } catch (error) {
    console.error("Patient validation error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to validate patient data" 
    });
  }
});

router.post("/validation/dental-chart", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const validation = await dataIntegrity.validateDentalChart(req.body);
    
    res.json(validation);
  } catch (error) {
    console.error("Dental chart validation error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to validate dental chart" 
    });
  }
});

router.post("/validation/appointment", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const validation = await dataIntegrity.validateAppointment(req.body);
    
    res.json(validation);
  } catch (error) {
    console.error("Appointment validation error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to validate appointment" 
    });
  }
});

router.get("/system-integrity", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const integrity = await dataIntegrity.checkSystemIntegrity();
    
    res.json(integrity);
  } catch (error) {
    console.error("System integrity check error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to check system integrity" 
    });
  }
});

// Medical History Analysis
router.get("/patients/:id/medical-history", requireAuth, requireOwnership("id"), async (req, res) => {
  try {
    const patientId = Number(req.params.id);
    const medicalHistory = await storage.getPatientMedicalHistory(patientId);
    res.json(medicalHistory);
  } catch (error) {
    console.error("Medical history fetch error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch medical history" 
    });
  }
});

router.post("/ai/medical-analysis", requireAuth, async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const medicalHistory = await storage.getPatientMedicalHistory(patientId);
    const analysis = await analyzeMedicalHistory(medicalHistory);

    res.json(analysis);
  } catch (error) {
    console.error("Medical analysis error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to analyze medical history" 
    });
  }
});


// Report generation route
router.post('/api/reports/generate', async (req, res) => {
  try {
    const { prediction, options } = req.body;

    if (!prediction) {
      return res.status(400).json({ error: 'Prediction data is required' });
    }

    const reportPath = await generateDiagnosticReport(prediction, options);

    // Send file as download
    res.download(reportPath, `DentaMind-Report-${Date.now()}.pdf`, (err) => {
      if (err) {
        console.error('Error sending report:', err);
      }

      // Cleanup the temporary file after sending
      // fs.unlinkSync(reportPath);
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// X-ray analysis route
router.post('/api/xray/analyze', async (req, res) => {
  try {
    const { imageData, analysisType } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Mock response for now, in production this would call an actual ML model
    const mockFindings = [
      {
        region: "Tooth #36",
        description: "Periapical radiolucency suggesting infection",
        confidence: 0.92,
        boundingBox: { x: 220, y: 150, width: 40, height: 30 }
      },
      {
        region: "Tooth #25",
        description: "Deep carious lesion with possible pulpal involvement",
        confidence: 0.87,
        boundingBox: { x: 320, y: 130, width: 35, height: 25 }
      }
    ];

    // Add some randomized findings based on analysis type
    if (analysisType === 'comprehensive') {
      mockFindings.push({
        region: "Maxillary Sinus",
        description: "Slight mucosal thickening, possible sinusitis",
        confidence: 0.78,
        boundingBox: { x: 380, y: 80, width: 60, height: 40 }
      });
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({
      findings: mockFindings,
      recommendations: [
        "Endodontic evaluation for tooth #36",
        "Consider root canal treatment for tooth #25",
        analysisType === 'comprehensive' ? "Monitor maxillary sinus, correlate with clinical symptoms" : null
      ].filter(Boolean),
      overallAssessment: "Multiple dental pathologies detected. Patient would benefit from comprehensive endodontic and restorative evaluation."
    });
  } catch (error) {
    console.error('Error analyzing X-ray:', error);
    res.status(500).json({ error: 'Failed to analyze X-ray' });
  }
});

// Educational content API
router.get('/api/education', (req, res) => {
  const { category, search } = req.query;

  // Mock educational content
  const educationContent = [
    {
      id: '1',
      title: 'Understanding Periodontal Disease',
      category: 'Periodontal Disease',
      description: 'Learn about the causes, symptoms, and treatments for gum disease.',
      contentType: 'video',
      content: 'https://example.com/videos/periodontal-disease.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/perio.jpg'
    },
    {
      id: '2',
      title: 'Root Canal Therapy Explained',
      category: 'Endodontics',
      description: 'A detailed explanation of what happens during root canal treatment.',
      contentType: 'article',
      content: 'Root canal therapy is a treatment used to repair and save a tooth that is badly decayed or infected...'
    },
    // More content would be here
  ];

  let filtered = [...educationContent];

  if (category && category !== 'all') {
    filtered = filtered.filter(item => item.category === category);
  }

  if (search) {
    const searchStr = String(search).toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(searchStr) || 
      item.description.toLowerCase().includes(searchStr)
    );
  }

  res.json(filtered);
});

// Financial Routes
router.get("/financial/summary", requireAuth, requireRole(["doctor", "admin", "staff"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }
    
    const { financialService } = await import('./services/financial');
    const summary = await financialService.getFinancialSummary(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json(summary);
  } catch (error) {
    console.error("Financial summary error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get financial summary" 
    });
  }
});

router.get("/financial/tax-report/:year", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({ message: "Invalid year" });
    }
    
    const { financialService } = await import('./services/financial');
    const report = await financialService.generateTaxReport(year);
    
    res.json(report);
  } catch (error) {
    console.error("Tax report error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate tax report" 
    });
  }
});

router.post("/financial/payment", requireAuth, async (req, res) => {
  try {
    const { financialService } = await import('./services/financial');
    const payment = await financialService.processPayment(req.body);
    
    res.status(201).json(payment);
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to process payment" 
    });
  }
});

router.post("/financial/insurance/claim", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const { financialService } = await import('./services/financial');
    const claim = await financialService.submitInsuranceClaim(req.body);
    
    res.status(201).json(claim);
  } catch (error) {
    console.error("Insurance claim error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to submit insurance claim" 
    });
  }
});

router.post("/financial/estimate", requireAuth, async (req, res) => {
  try {
    const { treatmentPlanId, insuranceProviderId } = req.body;
    
    if (!treatmentPlanId || !insuranceProviderId) {
      return res.status(400).json({ message: "Treatment plan ID and insurance provider ID are required" });
    }
    
    const { financialService } = await import('./services/financial');
    const estimate = await financialService.estimatePatientCost(
      treatmentPlanId,
      insuranceProviderId
    );
    
    res.json(estimate);
  } catch (error) {
    console.error("Cost estimation error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to estimate patient cost" 
    });
  }
});

// Scheduler Routes
router.get("/scheduler/slots", requireAuth, async (req, res) => {
  try {
    const { doctorId, date, duration } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({ message: "Doctor ID and date are required" });
    }
    
    const { schedulerService } = await import('./services/scheduler');
    const slots = await schedulerService.getAvailableSlots(
      Number(doctorId),
      date as string,
      duration ? Number(duration) : 30
    );
    
    res.json(slots);
  } catch (error) {
    console.error("Available slots error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get available slots" 
    });
  }
});

router.post("/scheduler/appointment", requireAuth, async (req, res) => {
  try {
    const { schedulerService } = await import('./services/scheduler');
    const appointment = await schedulerService.scheduleAppointment(req.body);
    
    res.status(201).json(appointment);
  } catch (error) {
    console.error("Appointment scheduling error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to schedule appointment" 
    });
  }
});

router.put("/scheduler/appointment/:id/reschedule", requireAuth, async (req, res) => {
  try {
    const { newStartTime, newEndTime } = req.body;
    const appointmentId = Number(req.params.id);
    
    if (!appointmentId || !newStartTime || !newEndTime) {
      return res.status(400).json({ message: "Appointment ID, new start time, and new end time are required" });
    }
    
    const { schedulerService } = await import('./services/scheduler');
    const appointment = await schedulerService.rescheduleAppointment(
      appointmentId,
      newStartTime,
      newEndTime
    );
    
    res.json(appointment);
  } catch (error) {
    console.error("Appointment rescheduling error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to reschedule appointment" 
    });
  }
});

router.post("/scheduler/appointment/:id/cancel", requireAuth, async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { reason } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required" });
    }
    
    const { schedulerService } = await import('./services/scheduler');
    const result = await schedulerService.cancelAppointment(appointmentId, reason);
    
    res.json(result);
  } catch (error) {
    console.error("Appointment cancellation error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to cancel appointment" 
    });
  }
});

router.post("/scheduler/availability/recurring", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
  try {
    const { doctorId, startDate, startTime, endTime, recurrencePattern } = req.body;
    
    if (!doctorId || !startDate || !startTime || !endTime || !recurrencePattern) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const { schedulerService } = await import('./services/scheduler');
    const slots = await schedulerService.createRecurringAvailability(
      doctorId,
      startDate,
      startTime,
      endTime,
      recurrencePattern
    );
    
    res.status(201).json(slots);
  } catch (error) {
    console.error("Recurring availability error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to create recurring availability" 
    });
  }
});

// Integration Routes
router.post("/integration/lab/request", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { integrationService } = await import('./services/integration');
    const result = await integrationService.submitLabRequest(req.body);
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Lab request error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to submit lab request" 
    });
  }
});

router.get("/integration/lab/status/:requestId", requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }
    
    const { integrationService } = await import('./services/integration');
    const status = await integrationService.getLabRequestStatus(requestId);
    
    res.json(status);
  } catch (error) {
    console.error("Lab status check error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to check lab status" 
    });
  }
});

router.post("/integration/insurance/eligibility", requireAuth, async (req, res) => {
  try {
    const { integrationService } = await import('./services/integration');
    const eligibility = await integrationService.checkInsuranceEligibility(req.body);
    
    res.json(eligibility);
  } catch (error) {
    console.error("Eligibility check error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to check eligibility" 
    });
  }
});

router.post("/integration/claim/electronic", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  try {
    const { integrationService } = await import('./services/integration');
    const result = await integrationService.submitElectronicClaim(req.body);
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Electronic claim error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to submit electronic claim" 
    });
  }
});

router.post("/integration/prescription", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { integrationService } = await import('./services/integration');
    const result = await integrationService.sendElectronicPrescription(req.body);
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Prescription error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to send electronic prescription" 
    });
  }
});

router.post("/integration/referral", requireAuth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { integrationService } = await import('./services/integration');
    const result = await integrationService.createReferral(req.body);
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Referral error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to create referral" 
    });
  }
});

// Security and Audit Routes
router.post("/security/audit/logs", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { securityService } = await import('./services/security');
    const logs = await securityService.getAuditLogs(req.body);
    
    res.json(logs);
  } catch (error) {
    console.error("Audit logs error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to retrieve audit logs" 
    });
  }
});

router.post("/security/password/validate", async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    
    const { securityService } = await import('./services/security');
    const result = securityService.validatePasswordStrength(password);
    
    res.json(result);
  } catch (error) {
    console.error("Password validation error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to validate password" 
    });
  }
});

router.post("/security/access/check", requireAuth, async (req, res) => {
  try {
    // Add the authenticated user ID to the request
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    
    const { securityService } = await import('./services/security');
    const result = await securityService.checkAccessPermission({
      ...req.body,
      userId,
      role
    });
    
    res.json(result);
  } catch (error) {
    console.error("Access check error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to check access permission" 
    });
  }
});

router.post("/security/hipaa/report", requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const { patientId, startDate, endDate } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }
    
    const { securityService } = await import('./services/security');
    const report = await securityService.generateHIPAAAccessReport(
      patientId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    res.json(report);
  } catch (error) {
    console.error("HIPAA report error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate HIPAA access report" 
    });
  }
});

// Data Import and Migration Routes
router.post("/data/import/csv", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const { dataMigrationService } = await import('./services/data-migration');
    const result = await dataMigrationService.importFromCSV(req.body, userId);
    
    res.json(result);
  } catch (error) {
    console.error("CSV import error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to import data from CSV" 
    });
  }
});

router.post("/data/export/csv", requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const { type, filters } = req.body;
    const userId = (req as any).user.id;
    
    if (!type) {
      return res.status(400).json({ message: "Export type is required" });
    }
    
    const { dataMigrationService } = await import('./services/data-migration');
    const result = await dataMigrationService.exportToCSV(type, filters, userId);
    
    res.json(result);
  } catch (error) {
    console.error("CSV export error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to export data to CSV" 
    });
  }
});

router.post("/data/migrate/external", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { systemType, connectionConfig } = req.body;
    const userId = (req as any).user.id;
    
    if (!systemType || !connectionConfig) {
      return res.status(400).json({ message: "System type and connection config are required" });
    }
    
    const { dataMigrationService } = await import('./services/data-migration');
    const result = await dataMigrationService.migrateFromExternalSystem(
      systemType,
      connectionConfig,
      userId
    );
    
    res.json(result);
  } catch (error) {
    console.error("System migration error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to migrate from external system" 
    });
  }
});

// Backup and Analytics Routes
router.post("/system/backup", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const backup = await storage.createBackup();
    res.json(backup);
  } catch (error) {
    console.error("Backup creation error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create backup" 
    });
  }
});

router.post("/system/restore/:backupId", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { backupId } = req.params;
    
    if (!backupId) {
      return res.status(400).json({ message: "Backup ID is required" });
    }
    
    const result = await storage.restoreFromBackup(backupId);
    res.json(result);
  } catch (error) {
    console.error("Backup restoration error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to restore from backup" 
    });
  }
});

router.get("/analytics/practice", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
  try {
    const { timeframe } = req.query;
    
    const analytics = await storage.getPracticeAnalytics(timeframe as string || "last_30days");
    
    res.json(analytics);
  } catch (error) {
    console.error("Practice analytics error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get practice analytics" 
    });
  }
});

// Notification Routes
router.post("/notifications/send", requireAuth, requireRole(["doctor", "admin", "staff"]), async (req, res) => {
  try {
    const { notificationService } = await import('./services/notifications');
    const result = await notificationService.sendNotification(req.body);
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Notification send error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to send notification" 
    });
  }
});

router.post("/notifications/appointment-reminders", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { days } = req.body;
    
    const { notificationService } = await import('./services/notifications');
    const result = await notificationService.createAppointmentReminders(days);
    
    res.json(result);
  } catch (error) {
    console.error("Appointment reminders error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create appointment reminders" 
    });
  }
});

router.get("/notifications/user", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { unreadOnly, limit } = req.query;
    
    const { notificationService } = await import('./services/notifications');
    const notifications = await notificationService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === "true",
      limit: limit ? Number(limit) : undefined
    });
    
    res.json(notifications);
  } catch (error) {
    console.error("Get user notifications error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get user notifications" 
    });
  }
});

router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = (req as any).user.id;
    
    const { notificationService } = await import('./services/notifications');
    const result = await notificationService.markNotificationRead(notificationId, userId);
    
    res.json(result);
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to mark notification as read" 
    });
  }
});

router.put("/notifications/preferences", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const { notificationService } = await import('./services/notifications');
    const result = await notificationService.updateUserPreferences({
      ...req.body,
      userId
    });
    
    res.json(result);
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to update notification preferences" 
    });
  }
});

router.get("/notifications/preferences", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const { notificationService } = await import('./services/notifications');
    const preferences = await notificationService.getUserPreferences(userId);
    
    res.json(preferences);
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get notification preferences" 
    });
  }
});

// Mount all routes under /api prefix
app.use("/api", router);

export default app;