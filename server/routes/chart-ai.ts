import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate-request';
import { requireAuth, requireRole } from '../middleware/auth';
import { ChartAIService } from '../services/chart-ai-service';
import { storage } from '../storage';
import { log } from '../utils/logger';

const router = Router();
const aiService = new ChartAIService();

// Shared validation schemas
const chartIdSchema = z.object({
  chartId: z.string().regex(/^\d+$/)
});

const analysisRequestSchema = z.object({
  includePrevious: z.boolean().optional(),
  includeXrays: z.boolean().optional()
});

/**
 * POST /api/chart-ai/restorative/:chartId
 * Analyze restorative chart and return AI findings
 */
router.post(
  '/restorative/:chartId',
  requireAuth,
  requireRole(['doctor', 'admin']),
  validateRequest({ 
    params: chartIdSchema,
    query: analysisRequestSchema
  }),
  async (req, res) => {
    try {
      const chartId = Number(req.params.chartId);
      const { includePrevious = true, includeXrays = true } = req.query;

      // Fetch chart
      const chart = await storage.get('restorativeChart', chartId);
      if (!chart) {
        return res.status(404).json({ error: 'Chart not found' });
      }

      // Verify ownership/access
      if (chart.doctorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized access to chart' });
      }

      // Fetch related data
      const [xrays, previousChart] = await Promise.all([
        includeXrays ? storage.find('xray', { patientId: chart.patientId }) : [],
        includePrevious ? storage.findPreviousRestorativeChart(chart.patientId, chartId) : undefined
      ]);

      // Analyze chart
      const result = await aiService.analyzeRestorativeChart(chart, xrays, previousChart);
      
      // Log analysis
      log(`AI analysis completed for restorative chart ${chartId}`, 'info', {
        chartId,
        patientId: chart.patientId,
        doctorId: chart.doctorId
      });

      res.json(result);
    } catch (error) {
      log(`Error analyzing restorative chart: ${error}`, 'error');
      res.status(500).json({ error: 'Failed to analyze chart' });
    }
  }
);

/**
 * POST /api/chart-ai/periodontal/:chartId
 * Analyze periodontal chart and return AI findings
 */
router.post(
  '/periodontal/:chartId',
  requireAuth,
  requireRole(['doctor', 'admin']),
  validateRequest({ 
    params: chartIdSchema,
    query: analysisRequestSchema
  }),
  async (req, res) => {
    try {
      const chartId = Number(req.params.chartId);
      const { includePrevious = true, includeXrays = true } = req.query;

      // Fetch chart
      const chart = await storage.get('periodontalChart', chartId);
      if (!chart) {
        return res.status(404).json({ error: 'Chart not found' });
      }

      // Verify ownership/access
      if (chart.doctorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized access to chart' });
      }

      // Fetch related data
      const [xrays, previousChart] = await Promise.all([
        includeXrays ? storage.find('xray', { patientId: chart.patientId }) : [],
        includePrevious ? storage.findPreviousPeriodontalChart(chart.patientId, chartId) : undefined
      ]);

      // Analyze chart
      const result = await aiService.analyzePeriodontalChart(chart, xrays, previousChart);
      
      // Log analysis
      log(`AI analysis completed for periodontal chart ${chartId}`, 'info', {
        chartId,
        patientId: chart.patientId,
        doctorId: chart.doctorId
      });

      res.json(result);
    } catch (error) {
      log(`Error analyzing periodontal chart: ${error}`, 'error');
      res.status(500).json({ error: 'Failed to analyze chart' });
    }
  }
);

export default router; 