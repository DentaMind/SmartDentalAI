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
