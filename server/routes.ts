// Get all patients route
app.get("/api/patients", requireAuth, async (req, res) => {
  try {
    const patients = await storage.getAllPatients();
    res.json(patients);
  } catch (error) {
    console.error("Failed to get patients:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get patients" 
    });
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
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate prediction" 
    });
  }
});

// Treatment Plan Generation route
app.post("/api/ai/generate-treatment-plan", requireAuth, async (req, res) => {
  try {
    const { diagnosis, patientHistory } = req.body;

    if (!diagnosis) {
      return res.status(400).json({ message: "Diagnosis is required" });
    }

    setTimeout(() => {
      res.json({
        treatmentSteps: [
          "Initial periodontal therapy: Scaling and root planing all quadrants",
          "Re-evaluation at 6 weeks post-therapy",
          "Restore carious lesions on teeth #19 and #30",
          "Endodontic therapy for tooth #30",
          "Crown on tooth #30 following successful endodontic treatment",
          "Maintenance therapy every 3 months"
        ],
        estimatedTimeline: "3-4 months for complete treatment",
        alternativeOptions: [
          "Extract tooth #30 and replace with implant",
          "Extract without replacement and monitor remaining dentition"
        ],
        costEstimate: {
          totalCost: 4250,
          insuranceCoverage: 2500,
          patientResponsibility: 1750
        },
        maintenanceRecommendations: [
          "3-month periodontal maintenance",
          "Daily interdental cleaning",
          "Nightguard to protect restorations"
        ]
      });
    }, 1500);
  } catch (error) {
    console.error("Treatment Plan Generation error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate treatment plan" 
    });
  }
});

// Add patient route
app.post("/api/patients", requireAuth, async (req, res) => {
  try {
    // Create the user first
    const user = await storage.createUser({
      ...req.body,
      role: "patient",
      language: "en",
    });

    // Create the patient record with the new user ID
    const patient = await storage.createPatient({
      userId: user.id,
      medicalHistory: req.body.medicalHistory || null,
      allergies: req.body.allergies || null,
      bloodType: null,
      emergencyContact: req.body.emergencyContact || null
    });

    // Return the combined patient and user data
    res.status(201).json({ ...patient, user });
  } catch (error) {
    console.error("Failed to create patient:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create patient" 
    });
  }
});