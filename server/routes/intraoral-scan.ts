import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { IntraoralScanService } from '../services/intraoral-scan';
import { CreateIntraoralScan, UpdateIntraoralScan } from '../schema/intraoral-scan';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = express.Router();
const scanService = new IntraoralScanService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['model/stl', 'application/octet-stream', 'application/x-msdownload'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only STL, PLY, and OBJ files are allowed.'));
    }
  }
});

// Create a new scan
router.post(
  '/',
  authenticate,
  upload.single('file'),
  validateRequest({
    body: z.object({
      patientId: z.string(),
      xrayId: z.string().optional(),
      format: z.enum(['STL', 'PLY', 'OBJ', 'DCM']),
      metadata: z.object({
        originalFileName: z.string(),
        fileSize: z.number(),
        scanDate: z.string().optional(),
        scannerType: z.string().optional(),
        notes: z.string().optional()
      }).optional()
    })
  }),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const data: CreateIntraoralScan = {
        ...req.body,
        fileUrl: req.file.buffer.toString('base64'), // In production, upload to cloud storage
        doctorId: req.user.id,
        metadata: {
          ...req.body.metadata,
          fileSize: req.file.size
        }
      };

      const scan = await scanService.createScan(data, req.user.id);
      res.json(scan);
    } catch (error) {
      console.error('Error creating scan:', error);
      res.status(500).json({ error: 'Failed to create scan' });
    }
  }
);

// Get scan by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const scan = await scanService.getScan(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    res.json(scan);
  } catch (error) {
    console.error('Error getting scan:', error);
    res.status(500).json({ error: 'Failed to get scan' });
  }
});

// Get scans by patient
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const scans = await scanService.getScansByPatient(req.params.patientId);
    res.json(scans);
  } catch (error) {
    console.error('Error getting patient scans:', error);
    res.status(500).json({ error: 'Failed to get patient scans' });
  }
});

// Update scan
router.put(
  '/:id',
  authenticate,
  validateRequest({
    body: UpdateIntraoralScan
  }),
  async (req, res) => {
    try {
      const scan = await scanService.updateScan(req.params.id, req.body, req.user.id);
      res.json(scan);
    } catch (error) {
      console.error('Error updating scan:', error);
      res.status(500).json({ error: 'Failed to update scan' });
    }
  }
);

// Delete scan
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await scanService.deleteScan(req.params.id, req.user.id);
    res.json({ message: 'Scan deleted successfully' });
  } catch (error) {
    console.error('Error deleting scan:', error);
    res.status(500).json({ error: 'Failed to delete scan' });
  }
});

// Link scan to X-ray
router.post(
  '/:scanId/link-xray/:xrayId',
  authenticate,
  async (req, res) => {
    try {
      const scan = await scanService.linkScanToXray(
        req.params.scanId,
        req.params.xrayId,
        req.user.id
      );
      res.json(scan);
    } catch (error) {
      console.error('Error linking scan to X-ray:', error);
      res.status(500).json({ error: 'Failed to link scan to X-ray' });
    }
  }
);

// Update scan transform
router.put(
  '/:id/transform',
  authenticate,
  validateRequest({
    body: z.object({
      transform: z.object({
        position: z.object({
          x: z.number(),
          y: z.number(),
          z: z.number()
        }),
        rotation: z.object({
          x: z.number(),
          y: z.number(),
          z: z.number()
        }),
        scale: z.object({
          x: z.number(),
          y: z.number(),
          z: z.number()
        })
      })
    })
  }),
  async (req, res) => {
    try {
      const scan = await scanService.updateTransform(
        req.params.id,
        req.body.transform,
        req.user.id
      );
      res.json(scan);
    } catch (error) {
      console.error('Error updating scan transform:', error);
      res.status(500).json({ error: 'Failed to update scan transform' });
    }
  }
);

export default router; 