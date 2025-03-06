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
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Setup directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const router = express.Router();

// Setup middleware
app.use(express.json());
setupSecurityMiddleware(app);

// Add a simple health check route
app.get('/api-health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Direct route to serve the entry point in development
// This serves the HTML directly while we debug Vite issues
app.get('/', (req, res) => {
  try {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>DentaMind - Dental Practice Management</title>
          <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/htmx.org@1.9.3"></script>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f9fafb;
              color: #111827;
            }
            .app {
              display: flex;
              min-height: 100vh;
            }
            .sidebar {
              width: 240px;
              background-color: white;
              border-right: 1px solid #e5e7eb;
              padding: 1.5rem;
            }
            .main-content {
              flex: 1;
              padding: 2rem;
            }
            .header {
              margin-bottom: 2rem;
            }
            .logo {
              font-weight: bold;
              font-size: 1.5rem;
              color: #3b82f6;
              margin-bottom: 2rem;
              display: block;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 0.75rem 1.5rem;
              text-decoration: none;
              border-radius: 0.375rem;
              font-weight: bold;
              margin-top: 1rem;
            }
            .nav-item {
              display: flex;
              align-items: center;
              padding: 0.5rem 0.75rem;
              border-radius: 0.375rem;
              margin-bottom: 0.25rem;
              color: #4b5563;
              text-decoration: none;
              font-size: 0.875rem;
            }
            .nav-item:hover {
              background-color: #f3f4f6;
            }
            .nav-item.active {
              background-color: #eff6ff;
              color: #3b82f6;
              font-weight: 500;
            }
            .card {
              background-color: white;
              border-radius: 0.5rem;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              padding: 1.5rem;
              margin-bottom: 1.5rem;
            }
            .card-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 1rem;
            }
            .button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 0.375rem;
              font-weight: 500;
              padding: 0.5rem 1rem;
              background-color: #3b82f6;
              color: white;
              border: none;
              cursor: pointer;
              font-size: 0.875rem;
              transition: background-color 0.2s;
            }
            .button:hover {
              background-color: #2563eb;
            }
            h1 {
              font-size: 1.5rem;
              font-weight: 600;
              margin-top: 0;
            }
            h2 {
              font-size: 1.25rem;
              font-weight: 600;
              margin-top: 0;
            }
            .text-muted {
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="app">
            <div class="sidebar">
              <div class="logo">DentaMind</div>
              <nav>
                <a href="#" class="nav-item active">Dashboard</a>
                <a href="#" class="nav-item">Patients</a>
                <a href="#" class="nav-item">Appointments</a>
                <a href="#" class="nav-item">Diagnostics AI</a>
                <a href="#" class="nav-item">Financial</a>
                <a href="#" class="nav-item">Reports</a>
                <a href="#" class="nav-item">Settings</a>
              </nav>
            </div>
            <div class="main-content">
              <div class="header">
                <h1>Welcome to DentaMind AI</h1>
                <p class="text-muted">Your AI-powered dental practice management dashboard</p>
              </div>
              
              <div class="card-grid">
                <div class="card">
                  <h2>Patient Overview</h2>
                  <p>You have 52 active patients and 3 new appointment requests.</p>
                  <button class="button" hx-get="/api-health" hx-target="#api-status">Check API Status</button>
                </div>
                <div class="card">
                  <h2>Financial Summary</h2>
                  <p>This month's revenue: $24,500</p>
                  <p>Outstanding claims: $12,350</p>
                </div>
                <div class="card">
                  <h2>AI Diagnostics</h2>
                  <p>15 AI-assisted diagnoses this month</p>
                  <p>Accuracy rate: 97.5%</p>
                </div>
                <div class="card">
                  <h2>System Status</h2>
                  <p id="api-status">API Status: Checking...</p>
                  <p>Last backup: 2 hours ago</p>
                </div>
              </div>
              
              <div class="card">
                <h2>Development Notes</h2>
                <p>This is a temporary static page while we resolve the Vite integration issues.</p>
                <p>The API is working correctly. You can verify by checking the API Status in the System Status card.</p>
                <a href="/static" class="button" style="margin-right: 10px;">Static Demo Login</a>
                <a href="/?static=true" class="button" style="background-color: #34a853;">Alternative Static Version</a>
              </div>
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              // Simulate API status check
              fetch('/api-health')
                .then(response => response.json())
                .then(data => {
                  document.getElementById('api-status').innerText = 'API Status: ' + 
                    (data.status === 'ok' ? 'Online' : 'Offline');
                })
                .catch(error => {
                  document.getElementById('api-status').innerText = 'API Status: Error connecting';
                });
            });
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error serving index page:', error);
    res.status(500).send('Server error loading the application');
  }
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
router.get('/', (req, res) => {
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

// Mount all routes under /api prefix
app.use("/api", router);

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

// Update the main app page to link to static version
app.get('/', (req, res, next) => {
  // Add a link to the static version in the main app
  if (req.query.static === 'true') {
    res.redirect('/static');
    return;
  }
  next();
});

// IMPORTANT: Error handlers should be last, after Vite middleware is set up in index.ts
// We'll only use them for API routes here
app.use('/api', notFoundHandler);
app.use('/api', errorHandler);

export default app;