import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";

const app = express();
const router = express.Router();
app.use(express.json());

// Setup authentication
setupAuth(router);

// Protected route middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Patient routes
router.post("/patients", requireAuth, async (req, res) => {
  try {
    const patient = await storage.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

router.get("/patients", requireAuth, async (req, res) => {
  try {
    const patients = await storage.getAllPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
  }
});

// Appointment routes
router.post("/appointments", requireAuth, async (req, res) => {
  try {
    const appointment = await storage.createAppointment(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

router.get("/appointments/doctor/:doctorId", requireAuth, async (req, res) => {
  try {
    const appointments = await storage.getDoctorAppointments(Number(req.params.doctorId));
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
  }
});

// Treatment Plan routes
router.post("/treatment-plans", requireAuth, async (req, res) => {
  try {
    const plan = await storage.createTreatmentPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
  }
});

router.get("/treatment-plans/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const plans = await storage.getPatientTreatmentPlans(Number(req.params.patientId));
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
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
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to generate prediction"
    });
  }
});

app.use("/api", router); //Use the router for all API routes


const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

export default app;