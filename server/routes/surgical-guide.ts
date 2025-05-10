import express from 'express';
import { z } from 'zod';
import { SurgicalGuideAIService } from '../services/surgical-guide-ai';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import * as THREE from 'three';

const router = express.Router();
const guideService = SurgicalGuideAIService.getInstance();

// Request validation schemas
const analyzeGuideSchema = z.object({
  implants: z.array(z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    rotation: z.tuple([z.number(), z.number(), z.number()]),
    diameter: z.number(),
    length: z.number(),
    system: z.string(),
    sleeveHeight: z.number()
  })),
  tissueSurface: z.object({
    vertices: z.array(z.number()),
    indices: z.array(z.number())
  }),
  nerveTraces: z.array(z.object({
    points: z.array(z.object({
      x: z.number(),
      y: z.number(),
      z: z.number()
    })),
    diameter: z.number(),
    confidence: z.number()
  }))
});

const generateGuideSchema = analyzeGuideSchema.extend({
  settings: z.object({
    shellThickness: z.number(),
    offset: z.number(),
    sleeveDiameter: z.number(),
    drillClearance: z.number(),
    ventilationHoles: z.boolean(),
    holeSpacing: z.number(),
    holeDiameter: z.number()
  })
});

const validateGuideSchema = generateGuideSchema.extend({
  guideGeometry: z.object({
    vertices: z.array(z.number()),
    indices: z.array(z.number())
  })
});

const nerveHeatmapSchema = z.object({
  nerveTraces: z.array(z.object({
    points: z.array(z.object({
      x: z.number(),
      y: z.number(),
      z: z.number()
    })),
    diameter: z.number(),
    confidence: z.number()
  })),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number()
  })
});

// Convert JSON geometry to THREE.BufferGeometry
function jsonToBufferGeometry(json: any): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(json.vertices, 3));
  geometry.setIndex(json.indices);
  return geometry;
}

// Convert THREE.BufferGeometry to JSON
function bufferGeometryToJson(geometry: THREE.BufferGeometry): any {
  const position = geometry.getAttribute('position');
  const indices = geometry.getIndex();
  return {
    vertices: Array.from(position.array),
    indices: indices ? Array.from(indices.array) : []
  };
}

// Analyze guide and get recommendations
router.post(
  '/analyze',
  authenticate,
  validateRequest(analyzeGuideSchema),
  async (req, res) => {
    try {
      const { implants, tissueSurface, nerveTraces } = req.body;
      
      const analysis = await guideService.analyzeGuide(
        implants,
        jsonToBufferGeometry(tissueSurface),
        nerveTraces
      );

      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing guide:', error);
      res.status(500).json({ error: 'Failed to analyze guide' });
    }
  }
);

// Generate surgical guide
router.post(
  '/generate',
  authenticate,
  validateRequest(generateGuideSchema),
  async (req, res) => {
    try {
      const { implants, tissueSurface, nerveTraces, settings } = req.body;
      
      const guideGeometry = await guideService.generateGuide(
        implants,
        jsonToBufferGeometry(tissueSurface),
        settings
      );

      // Convert to STL
      const exporter = new STLExporter();
      const stlString = exporter.parse(new THREE.Mesh(guideGeometry));

      // Set response headers for STL download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename=surgical-guide.stl');
      res.send(stlString);
    } catch (error) {
      console.error('Error generating guide:', error);
      res.status(500).json({ error: 'Failed to generate guide' });
    }
  }
);

// Validate guide design
router.post(
  '/validate',
  authenticate,
  validateRequest(validateGuideSchema),
  async (req, res) => {
    try {
      const { guideGeometry, implants, nerveTraces } = req.body;
      
      const validation = await guideService.validateGuide(
        jsonToBufferGeometry(guideGeometry),
        implants,
        nerveTraces
      );

      res.json(validation);
    } catch (error) {
      console.error('Error validating guide:', error);
      res.status(500).json({ error: 'Failed to validate guide' });
    }
  }
);

// Generate nerve heatmap
router.post(
  '/nerve-heatmap',
  authenticate,
  validateRequest(nerveHeatmapSchema),
  async (req, res) => {
    try {
      const { nerveTraces, dimensions } = req.body;
      
      const heatmap = await guideService.generateNerveHeatmap(
        nerveTraces,
        dimensions
      );

      res.json(heatmap);
    } catch (error) {
      console.error('Error generating nerve heatmap:', error);
      res.status(500).json({ error: 'Failed to generate nerve heatmap' });
    }
  }
);

export default router; 