import express from 'express';
import { OpenAI } from 'openai';
import { getPatientById } from '../services/patientService';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/diagnose/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await getPatientById(patientId);

    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const prompt = `Given this patient's history:\n
Chief complaint: ${patient.chiefComplaint}
Symptoms: ${patient.currentSymptoms}
Past surgeries: ${patient.pastSurgeries}
Current medications: ${patient.currentMedications}
Allergies: ${patient.allergies}
Medical history: hypertension=${patient.hypertension}, diabetes=${patient.diabetes}

Give your best diagnosis explanation.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const diagnosis = response.choices[0].message.content;
    return res.json({ diagnosis });

  } catch (err) {
    console.error('Diagnosis error:', err);
    res.status(500).json({ error: 'Failed to generate diagnosis' });
  }
});

export default router;
