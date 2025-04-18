import express from 'express';
import { CrownBridgeAIService } from '../services/crown-bridge-ai.js';
import { CrownBridgeAnalysis, CrownBridgeSettings, CrownBridgeValidation } from '../types/crown-bridge.js';

const router = express.Router();
const aiService = new CrownBridgeAIService();

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

export default router; 