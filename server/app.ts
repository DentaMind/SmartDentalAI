import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { predictFromSymptoms } from "./services/ai-prediction";
import { requireAuth, requireRole, requireOwnership } from "./middleware/auth";
import { insertUserSchema } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const app = express();
const scryptAsync = promisify(scrypt);

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup authentication
setupAuth(app);

// Provider registration endpoint
app.post("/api/providers", async (req, res) => {
  try {
    const providerSchema = insertUserSchema.omit({ 
      role: true, 
      language: true
    });

    const validation = providerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid input data", 
        errors: validation.error.errors 
      });
    }

    const username = `${req.body.firstName.toLowerCase()}${req.body.lastName.toLowerCase()}`;
    const password = Math.random().toString(36).slice(-8);

    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    const user = await storage.createUser({
      ...validation.data,
      role: "doctor",
      language: "en",
      username,
      password: hashedPassword,
    });

    res.status(201).json({ 
      success: true,
      user,
      credentials: {
        username,
        password
      }
    });
  } catch (error) {
    console.error("Provider registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Other API routes
app.get("/api/patients", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  const patients = await storage.getAllPatients();
  res.json(patients);
});

app.get("/api/patients/:id", requireAuth, requireOwnership("id"), async (req, res) => {
  const patient = await storage.getPatient(Number(req.params.id));
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  res.json(patient);
});

app.post("/api/medical-notes", requireAuth, requireRole(["doctor"]), async (req, res) => {
  const note = await storage.createMedicalNote(req.body);
  res.status(201).json(note);
});

app.post("/api/xrays", requireAuth, requireRole(["doctor", "staff"]), async (req, res) => {
  const xray = await storage.createXray(req.body);
  res.status(201).json(xray);
});

app.get("/api/xrays/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  const xrays = await storage.getPatientXrays(Number(req.params.patientId));
  res.json(xrays);
});

app.get("/api/payments/patient/:patientId", requireAuth, requireOwnership("patientId"), async (req, res) => {
  const payments = await storage.getPatientPayments(Number(req.params.patientId));
  res.json(payments);
});

app.post("/api/treatment-plans", requireAuth, requireRole(["doctor"]), async (req, res) => {
  const plan = await storage.createTreatmentPlan(req.body);
  res.status(201).json(plan);
});

app.post("/api/ai/predict", requireAuth, requireRole(["doctor"]), async (req, res) => {
  const { symptoms, patientHistory } = req.body;

  if (!symptoms) {
    return res.status(400).json({ message: "Symptoms are required" });
  }

  const prediction = await predictFromSymptoms(symptoms, patientHistory);
  res.json(prediction);
});

export default app;