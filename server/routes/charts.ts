import express from 'express';
import { ChartManagementService } from '../services/chart-management-service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { 
  restorativeChartSchema, 
  periodontalChartSchema, 
  chartingNoteSchema 
} from '../services/chart-management-service';

const router = express.Router();
const chartService = new ChartManagementService();

/**
 * Save a restorative chart
 * POST /api/charts/restorative
 */
router.post(
  '/restorative',
  authenticate,
  validateRequest(restorativeChartSchema),
  async (req, res) => {
    try {
      const chart = await chartService.saveRestorativeChart(req.body, req.user.id);
      res.status(201).json(chart);
    } catch (error) {
      console.error('Error saving restorative chart:', error);
      res.status(500).json({ error: 'Failed to save restorative chart' });
    }
  }
);

/**
 * Save a periodontal chart
 * POST /api/charts/periodontal
 */
router.post(
  '/periodontal',
  authenticate,
  validateRequest(periodontalChartSchema),
  async (req, res) => {
    try {
      const chart = await chartService.savePeriodontalChart(req.body, req.user.id);
      res.status(201).json(chart);
    } catch (error) {
      console.error('Error saving periodontal chart:', error);
      res.status(500).json({ error: 'Failed to save periodontal chart' });
    }
  }
);

/**
 * Create a charting note
 * POST /api/charts/notes
 */
router.post(
  '/notes',
  authenticate,
  validateRequest(chartingNoteSchema),
  async (req, res) => {
    try {
      const note = await chartService.createChartingNote(req.body, req.user.id);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating charting note:', error);
      res.status(500).json({ error: 'Failed to create charting note' });
    }
  }
);

/**
 * Approve a charting note
 * POST /api/charts/notes/:id/approve
 */
router.post(
  '/notes/:id/approve',
  authenticate,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid note ID' });
      }

      const note = await chartService.approveChartingNote(id, req.user.id);
      res.json(note);
    } catch (error) {
      console.error('Error approving charting note:', error);
      res.status(500).json({ error: 'Failed to approve charting note' });
    }
  }
);

/**
 * Get all charts for a patient
 * GET /api/charts/patient/:patientId
 */
router.get(
  '/patient/:patientId',
  authenticate,
  async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }

      const charts = await chartService.getPatientCharts(patientId);
      res.json(charts);
    } catch (error) {
      console.error('Error fetching patient charts:', error);
      res.status(500).json({ error: 'Failed to fetch patient charts' });
    }
  }
);

/**
 * Link an X-ray to a chart
 * POST /api/charts/link-xray
 */
router.post(
  '/link-xray',
  authenticate,
  async (req, res) => {
    try {
      const { xrayId, chartId, chartType } = req.body;
      
      if (!xrayId || !chartId || !chartType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (chartType !== 'restorative' && chartType !== 'periodontal') {
        return res.status(400).json({ error: 'Invalid chart type' });
      }

      await chartService.linkXrayToChart(xrayId, chartId, chartType, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error linking X-ray to chart:', error);
      res.status(500).json({ error: 'Failed to link X-ray to chart' });
    }
  }
);

export default router; 