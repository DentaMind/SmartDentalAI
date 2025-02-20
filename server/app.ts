import express from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// Setup authentication
setupAuth(app);

// Initialize OpenAI
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Protected route middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Patient routes
app.post("/api/patients", requireAuth, async (req, res) => {
  try {
    const patient = await storage.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/patients", requireAuth, async (req, res) => {
  try {
    const patients = await storage.getAllPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Appointment routes
app.post("/api/appointments", requireAuth, async (req, res) => {
  try {
    const appointment = await storage.createAppointment(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/appointments/doctor/:doctorId", requireAuth, async (req, res) => {
  try {
    const appointments = await storage.getDoctorAppointments(Number(req.params.doctorId));
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Treatment Plan routes
app.post("/api/treatment-plans", requireAuth, async (req, res) => {
  try {
    const plan = await storage.createTreatmentPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/treatment-plans/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const plans = await storage.getPatientTreatmentPlans(Number(req.params.patientId));
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// AI Diagnosis routes
app.post("/api/ai/diagnose", requireAuth, async (req, res) => {
  try {
    const { symptoms, radiographUrl, patientHistory } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a dental AI assistant helping with diagnosis. Analyze the provided information and suggest possible diagnoses and treatment options."
        },
        {
          role: "user",
          content: `
Patient Symptoms: ${symptoms}
Medical History: ${patientHistory}
Radiograph Analysis Required: ${Boolean(radiographUrl)}
          `
        }
      ],
      response_format: { type: "json_object" }
    });

    res.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

export default app;
