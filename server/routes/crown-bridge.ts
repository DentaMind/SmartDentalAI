import express from 'express';
import { CrownBridgeAIService } from '../services/crown-bridge-ai.js';
import { CrownBridgeAnalysis, CrownBridgeSettings, CrownBridgeValidation } from '../types/crown-bridge.js';
import { CrownBridgeService } from '../services/crown-bridge';
import * as THREE from 'three';

const router = express.Router();
const aiService = new CrownBridgeAIService();
const crownBridgeService = new CrownBridgeService();

// Helper function to validate material type
const isValidMaterial = (material: string): boolean => {
  const validMaterials = ['zirconia', 'lithium-disilicate', 'metal-ceramic', 'gold'];
  return validMaterials.includes(material);
};

// Helper function to validate required settings
const validateSettings = (settings: CrownBridgeSettings): string | null => {
  if (!settings.material || !isValidMaterial(settings.material)) {
    return 'Invalid or missing material type';
  }
  if (!settings.designType) {
    return 'Missing design type';
  }
  if (!settings.marginType) {
    return 'Missing margin type';
  }
  if (!settings.occlusionType) {
    return 'Missing occlusion type';
  }
  if (settings.minimumThickness === undefined || settings.minimumThickness <= 0) {
    return 'Invalid minimum thickness';
  }
  if (settings.designType === 'bridge') {
    if (settings.connectorSize === undefined || settings.connectorSize <= 0) {
      return 'Invalid connector size for bridge design';
    }
    if (!settings.ponticDesign) {
      return 'Missing pontic design for bridge';
    }
  }
  return null;
};

// Analyze crown & bridge case
router.post('/analyze', async (req: express.Request, res: express.Response) => {
  try {
    const { scan, settings } = req.body;
    
    if (!scan || !settings) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const analysis = await aiService.analyze(scan, settings);
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze crown/bridge case' });
  }
});

// Generate crown & bridge design
router.post('/generate', async (req: express.Request, res: express.Response) => {
  try {
    const { scan, settings } = req.body;
    
    if (!scan || !settings) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const validationError = validateSettings(settings);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const stlBuffer = await aiService.generate(scan, settings);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=crown-bridge.stl');
    res.send(stlBuffer);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate crown/bridge design' });
  }
});

// Validate crown & bridge design
router.post('/validate', async (req: express.Request, res: express.Response) => {
  try {
    const { design, settings } = req.body;
    
    if (!design || !settings) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const validation = await aiService.validate(design, settings);
    res.json(validation);
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Failed to validate crown/bridge design' });
  }
});

// Export PDF documentation
router.post('/export-pdf', async (req: express.Request, res: express.Response) => {
  try {
    const { design, settings } = req.body;
    
    if (!design || !settings) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const pdfBuffer = await aiService.exportPDF(design, settings);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=crown-bridge-report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export PDF report' });
  }
});

router.post('/save-case', async (req, res) => {
  try {
    const { patientId, preparationScan, settings, design } = req.body;
    
    // Convert JSON geometry back to THREE.BufferGeometry
    const geometry = new THREE.BufferGeometry().fromJSON(preparationScan);
    
    const caseId = await crownBridgeService.saveCase({
      patientId,
      preparationScan: geometry,
      settings,
      design: design ? new THREE.BufferGeometry().fromJSON(design) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, caseId });
  } catch (error) {
    console.error('Error saving case:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save case' 
    });
  }
});

// Get a specific case
router.get('/:caseId', async (req: express.Request, res: express.Response) => {
  try {
    const caseId = req.params.caseId;
    const caseData = await crownBridgeService.getCase(caseId);
    
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(caseData);
  } catch (error) {
    console.error('Error getting case:', error);
    res.status(500).json({ error: 'Failed to get case' });
  }
});

// Get all cases for a patient
router.get('/patient/:patientId', async (req: express.Request, res: express.Response) => {
  try {
    const patientId = req.params.patientId;
    const cases = await crownBridgeService.getCasesByPatient(patientId);
    res.json(cases);
  } catch (error) {
    console.error('Error getting patient cases:', error);
    res.status(500).json({ error: 'Failed to get patient cases' });
  }
});

// Update a case
router.put('/:caseId', async (req: express.Request, res: express.Response) => {
  try {
    const caseId = req.params.caseId;
    const { preparationScan, settings, design } = req.body;
    
    // Convert JSON geometry back to THREE.BufferGeometry
    const geometry = preparationScan ? new THREE.BufferGeometry().fromJSON(preparationScan) : null;
    const designGeometry = design ? new THREE.BufferGeometry().fromJSON(design) : null;
    
    const updatedCase = await crownBridgeService.updateCase(caseId, {
      preparationScan: geometry,
      settings,
      design: designGeometry,
      updatedAt: new Date()
    });

    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// Delete a case
router.delete('/:caseId', async (req: express.Request, res: express.Response) => {
  try {
    const caseId = req.params.caseId;
    await crownBridgeService.deleteCase(caseId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// Export cases as CSV
router.get('/patient/:patientId/export/csv', async (req: express.Request, res: express.Response) => {
  try {
    const patientId = req.params.patientId;
    const csv = await crownBridgeService.exportCasesToCSV(patientId);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=crown-bridge-cases-${patientId}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting cases:', error);
    res.status(500).json({ error: 'Failed to export cases' });
  }
});

// Export cases as PDF
router.get('/patient/:patientId/export/pdf', async (req: express.Request, res: express.Response) => {
  try {
    const patientId = req.params.patientId;
    const pdf = await crownBridgeService.exportCasesToPDF(patientId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=crown-bridge-cases-${patientId}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error exporting cases:', error);
    res.status(500).json({ error: 'Failed to export cases' });
  }
});

export default router; 