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

      // In a real implementation, this would use an AI model to generate a treatment plan
      // For now, we'll return mock data
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