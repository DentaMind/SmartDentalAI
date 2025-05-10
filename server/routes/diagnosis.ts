import { Router } from 'express';
import { AIDiagnosisService } from '../services/aiDiagnosisService.js';
import { MemStorage } from '../storage.js';
import { DiagnosisFeedback, DiagnosisAuditLog } from '../types/ai-diagnosis.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'json2csv';

const router = Router();
const storage = new MemStorage();
const diagnosisService = new AIDiagnosisService(storage);

// Get AI diagnosis suggestions for a patient
router.get('/suggestions/:patientId', 
  authenticate,
  authorize(['provider', 'admin']),
  async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const suggestions = await diagnosisService.getSuggestions(patientId);
      res.json(suggestions);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Submit feedback on AI diagnosis
router.post('/feedback/:patientId', 
  authenticate,
  authorize(['provider', 'admin']),
  async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const feedback: DiagnosisFeedback = req.body;
      await diagnosisService.submitFeedback(patientId, feedback);
      res.status(200).json({ message: 'Feedback submitted successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Submit a diagnosis
router.post('/submit/:patientId', 
  authenticate,
  authorize(['provider', 'admin']),
  async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const { diagnosis, notes } = req.body;
      await diagnosisService.submitDiagnosis(patientId, diagnosis, notes);
      res.status(200).json({ message: 'Diagnosis submitted successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Get audit logs and performance metrics
router.get('/audit-logs', 
  authenticate,
  authorize(['provider', 'admin']),
  async (req, res) => {
    try {
      // Get all audit logs
      const logs: DiagnosisAuditLog[] = await diagnosisService.getAllAuditLogs();

      // Get model version
      const modelVersion = await diagnosisService.getModelVersion();

      // Calculate performance metrics
      const metrics = {
        totalSuggestions: logs.length,
        acceptedSuggestions: logs.filter((log: DiagnosisAuditLog) => log.feedback?.correctness === 'correct').length,
        rejectedSuggestions: logs.filter((log: DiagnosisAuditLog) => log.feedback?.correctness === 'incorrect').length,
        overrides: logs.filter((log: DiagnosisAuditLog) => log.override).length,
        modelVersion
      };

      res.json({
        logs,
        metrics
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Export audit logs
router.get('/audit-logs/export', 
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const format = req.query.format as 'csv' | 'json';
      const logs = await diagnosisService.getAllAuditLogs();
      
      if (format === 'csv') {
        const csv = stringify(logs, {
          header: true,
          columns: {
            id: 'ID',
            patientId: 'Patient ID',
            providerId: 'Provider ID',
            diagnosis: 'Diagnosis',
            timestamp: 'Timestamp',
            'feedback.correctness': 'Feedback',
            'feedback.feedback': 'Feedback Details',
            override: 'Override'
          }
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        return res.send(csv);
      } else {
        res.json(logs);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Get provider metrics
router.get('/provider-metrics', 
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const metrics = await diagnosisService.getProviderMetrics();
      res.json(metrics);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Get model version comparison
router.get('/model-versions/compare', 
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const comparison = await diagnosisService.compareModelVersions();
      res.json(comparison);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
