import { Router } from 'express';
import { db } from '../db';
import { aiTriageResults } from '../../shared/schema';
import { NewAiTriageResult } from '../../shared/types';
import { authenticateToken } from '../middleware/auth';
import { AITriageService } from '../services/ai-triage-service';

const router = Router();

// Get triage results for a specific form
router.get('/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    const result = await db.query.aiTriageResults.findFirst({
      where: (results, { eq }) => eq(results.formId, parseInt(formId)),
    });

    if (!result) {
      return res.status(404).json({ error: 'Triage results not found' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to fetch triage results:', error);
    res.status(500).json({ error: 'Failed to fetch triage results' });
  }
});

// Get all triage results for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const results = await db.query.aiTriageResults.findMany({
      where: (results, { eq }) => eq(results.patientId, parseInt(patientId)),
      orderBy: (results, { desc }) => desc(results.createdAt),
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Failed to fetch patient triage results:', error);
    res.status(500).json({ error: 'Failed to fetch patient triage results' });
  }
});

// Analyze form and compare with previous results
router.post('/analyze', async (req, res) => {
  try {
    const { formId, patientId, formData } = req.body;

    if (!formId || !patientId || !formData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get previous triage results for comparison
    const previousResults = await db.query.aiTriageResults.findMany({
      where: (results, { eq }) => eq(results.patientId, parseInt(patientId)),
      orderBy: (results, { desc }) => desc(results.createdAt),
      limit: 1,
    });

    const previousResult = previousResults[0];

    // Perform AI analysis
    const analysis = {
      riskFactors: [],
      potentialConditions: [],
      urgency: 'low',
      symptoms: formData.symptoms || [],
    };

    // Compare with previous results if available
    let outcome: 'improved' | 'worsened' | 'stable' = 'stable';
    let nextStep = '';

    if (previousResult) {
      const previousSymptoms = previousResult.analysis.symptoms || [];
      const currentSymptoms = analysis.symptoms;

      // Simple comparison logic - can be enhanced based on requirements
      if (currentSymptoms.length < previousSymptoms.length) {
        outcome = 'improved';
        nextStep = 'recall';
      } else if (currentSymptoms.length > previousSymptoms.length) {
        outcome = 'worsened';
        nextStep = 're-eval';
      } else {
        outcome = 'stable';
        nextStep = 'monitor';
      }
    } else {
      // First analysis
      outcome = 'stable';
      nextStep = 'initial-eval';
    }

    const result: NewAiTriageResult = {
      formId,
      patientId,
      analysis,
      outcome,
      nextStep,
      xrayFindings: formData.xrays || null,
    };

    const [triageResult] = await db
      .insert(aiTriageResults)
      .values(result)
      .returning();

    res.status(200).json(triageResult);
  } catch (error) {
    console.error('AI Triage analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyze form' });
  }
});

router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { modelVersion } = req.query;
    const triageResults = await AITriageService.getAllTriageResults(modelVersion as string | undefined);
    res.json(triageResults);
  } catch (error) {
    console.error('Error fetching triage results:', error);
    res.status(500).json({ error: 'Failed to fetch triage results' });
  }
});

export default router; 