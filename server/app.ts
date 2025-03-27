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
import insuranceRoutes from './routes/insurance-routes';
import treatmentRoutes from './routes/treatment-routes';
import medicalNotesRoutes from './routes/medical-notes-routes';
import prescriptionRoutes from './routes/prescription-routes';
import postOpRoutes from './routes/post-op-routes';
import { setupCertificationRoutes } from './routes/certification-routes';
import { setupTrainingNotesRoutes } from './routes/training-notes-routes';
import { setupEmailAIRoutes } from './routes/email-ai-routes';
import { setupEmailReaderRoutes } from './routes/email-reader-routes-fixed';
import { setupEmailSchedulerRoutes } from './routes/email-scheduler-routes';
import { setupVoiceAssistantRoutes } from './routes/voice-assistant-routes';
import { setupAIRoutes } from './routes/ai-routes';
import { setupDICOMRoutes } from './routes/dicom-routes';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Setup directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const router = express.Router();

// Tell Express app to trust proxies (important for rate limiting in cloud environments)
app.set('trust proxy', 1);

// Setup middleware
app.use(express.json());
setupSecurityMiddleware(app);

// Add a simple health check route
app.get('/api-health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// API documentation route
router.get('/docs', (req, res) => {
  res.json({
    message: 'Welcome to DentaMind AI API',
    version: '1.0.0',
    endpoints: {
      patients: '/api/patients',
      appointments: '/api/appointments',
      ai: '/api/ai/predict',
      financial: '/api/financial/summary',
    }
  });
});

// Mount auth routes directly (no /api prefix)
app.use(router);

// Mount other routes under /api prefix
app.use("/api", insuranceRoutes);
app.use("/api", treatmentRoutes);
app.use("/api", medicalNotesRoutes);
app.use("/api", prescriptionRoutes);
app.use("/api", postOpRoutes);
// Setup certification routes
const certificationRouter = express.Router();
setupCertificationRoutes(certificationRouter);
app.use("/api", certificationRouter);

// Setup training notes routes
const trainingNotesRouter = express.Router();
setupTrainingNotesRoutes(trainingNotesRouter);
app.use("/api", trainingNotesRouter);

app.use("/api", setupEmailAIRoutes(express.Router()));
app.use("/api", setupEmailReaderRoutes(express.Router()));
app.use("/api", setupEmailSchedulerRoutes(express.Router(), storage));

// Setup AI routes
const aiRouter = express.Router();
setupAIRoutes(aiRouter);
app.use("/api", aiRouter);

// Setup DICOM routes
const dicomRouter = express.Router();
setupDICOMRoutes(dicomRouter);
app.use("/api", dicomRouter);

// Setup voice assistant routes
setupVoiceAssistantRoutes(app);

// Add a route for static demo version
app.get('/static', (req, res) => {
  try {
    const staticPath = path.resolve(__dirname, '..', 'client', 'static', 'index.html');
    if (fs.existsSync(staticPath)) {
      const html = fs.readFileSync(staticPath, 'utf8');
      res.send(html);
    } else {
      res.redirect('/'); // Fallback to main page if static version isn't available
    }
  } catch (error) {
    console.error('Error serving static page:', error);
    res.status(500).send('Server error loading the static application');
  }
});

// Root path handler - serves the main React application
app.get('/', (req, res, next) => {
  // Redirect to static version if query param is set
  if (req.query.static === 'true') {
    res.redirect('/static');
    return;
  }
  
  // Log that the root route was requested
  console.log('Root route requested, method:', req.method, 'query:', req.query);
  
  // For development mode, we'll let Vite middleware handle the request in index.ts
  // For production, we'd serve static files
  if (process.env.NODE_ENV === 'production') {
    const indexPath = path.resolve(__dirname, '..', 'client', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send('Application not built. Please run build script first.');
    }
  } else {
    // In development, pass to next middleware (which will be Vite)
    console.log('Passing to next middleware (Vite) for development mode');
    next();
  }
});

// Catch-all route to handle client-side routing
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Log the catch-all route
  console.log('Catch-all route handling:', req.path);
  
  // For development mode, we'll let Vite middleware handle the request
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // For production, serve the index.html for client-side routing
  const indexPath = path.resolve(__dirname, '..', 'client', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Application not built. Please run build script first.');
  }
});

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Not found handler should be last
app.use('/api', notFoundHandler);
app.use('/api', errorHandler);

export default app;