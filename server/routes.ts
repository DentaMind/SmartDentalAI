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

// Mount all routes under /api prefix
app.use("/api", router);

export default app;