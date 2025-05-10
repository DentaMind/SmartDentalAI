import { Request, Response } from 'express';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import PDFDocument from 'pdfkit';
import { 
  CrownBridgeAnalysis, 
  CrownBridgeValidation, 
  CrownBridgeSettings,
  Tooth
} from '../types/crown-bridge';

// Helper function to create mock geometry
const createMockGeometry = (): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -1, -1, 0,
    1, -1, 0,
    1, 1, 0,
    -1, 1, 0
  ]);
  const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
};

// Helper function to convert THREE.BufferGeometry to JSON
const geometryToJson = (geometry: THREE.BufferGeometry) => {
  const position = geometry.getAttribute('position');
  const indices = geometry.getIndex();
  return {
    vertices: Array.from(position.array),
    indices: indices ? Array.from(indices.array) : []
  };
};

export const analyzeCrownBridge = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { preparationScan, opposingScan, adjacentTeeth } = req.body;

    // Mock analysis results
    const analysis: CrownBridgeAnalysis = {
      recommendedMaterial: 'zirconia',
      recommendedDesign: 'full-coverage',
      marginLine: createMockGeometry(),
      prepClearance: 1.2,
      confidence: 0.85,
      reasoning: [
        'Adequate preparation height for full coverage',
        'Good margin definition',
        'Sufficient interocclusal space'
      ],
      warnings: [
        'Slight undercut on mesial surface',
        'Consider reducing buccal cusp for better retention'
      ],
      suggestions: [
        {
          id: '1',
          label: 'Use zirconia for optimal strength and esthetics',
          recommended: true,
          settings: {
            material: 'zirconia',
            minimumThickness: 0.5
          }
        },
        {
          id: '2',
          label: 'Consider e.max for better esthetics',
          recommended: false,
          settings: {
            material: 'e-max',
            minimumThickness: 0.7
          }
        }
      ]
    };

    res.json(analysis);
  } catch (error) {
    console.error('Error in analyzeCrownBridge:', error);
    res.status(500).json({ error: 'Failed to analyze crown & bridge case' });
  }
};

export const generateCrownBridge = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const settings: CrownBridgeSettings = req.body;

    // Create mock STL file
    const geometry = createMockGeometry();
    const exporter = new STLExporter();
    const stlString = exporter.parse(geometry);
    const buffer = Buffer.from(stlString);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=crown-bridge.stl');
    res.send(buffer);
  } catch (error) {
    console.error('Error in generateCrownBridge:', error);
    res.status(500).json({ error: 'Failed to generate crown & bridge design' });
  }
};

export const validateCrownBridge = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { preparationScan, settings } = req.body;

    // Mock validation results
    const validation: CrownBridgeValidation = {
      marginFit: 0.92,
      occlusionClearance: 0.85,
      connectorStrength: 0.95,
      warnings: [
        'Margin adaptation could be improved on distal surface',
        'Consider increasing occlusal clearance by 0.2mm'
      ],
      suggestions: [
        'Adjust margin line for better adaptation',
        'Verify connector dimensions meet minimum requirements'
      ]
    };

    res.json(validation);
  } catch (error) {
    console.error('Error in validateCrownBridge:', error);
    res.status(500).json({ error: 'Failed to validate crown & bridge design' });
  }
};

export const exportCrownBridgePDF = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { preparationScan, settings } = req.body;

    const doc = new PDFDocument();
    const buffers: any[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=crown-bridge-report.pdf');
      res.send(pdfData);
    });

    // Title
    doc.fontSize(16).text('Crown & Bridge Design Report', { align: 'center' });
    doc.moveDown();

    // Design Specifications
    doc.fontSize(14).text('Design Specifications', { underline: true });
    doc.fontSize(12);
    doc.text(`Material: ${settings.material}`);
    doc.text(`Design Type: ${settings.designType}`);
    doc.text(`Margin Type: ${settings.marginType}`);
    doc.text(`Minimum Thickness: ${settings.minimumThickness}mm`);
    doc.text(`Occlusion Type: ${settings.occlusionType}`);
    
    if (settings.designType === 'bridge') {
      doc.text(`Connector Size: ${settings.connectorSize}mm`);
      doc.text(`Pontic Design: ${settings.ponticDesign}`);
    }

    doc.moveDown();

    // Validation Metrics
    doc.fontSize(14).text('Validation Metrics', { underline: true });
    doc.fontSize(12);
    doc.text('Margin Fit: 92%');
    doc.text('Occlusion Clearance: 85%');
    doc.text('Connector Strength: 95%');

    doc.end();
  } catch (error) {
    console.error('Error in exportCrownBridgePDF:', error);
    res.status(500).json({ error: 'Failed to export PDF documentation' });
  }
}; 