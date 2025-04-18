import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { XrayUploadService, xrayUploadRequestSchema } from '../services/xray-upload-service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { StorageService } from '../services/storage';

const router = express.Router();
const storage = new StorageService();
const xrayUploadService = new XrayUploadService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!ext) {
      return cb(new Error('Invalid file extension'));
    }

    const allowedTypes = [
      ...XrayUploadService.SUPPORTED_FILE_TYPES.DICOM,
      ...XrayUploadService.SUPPORTED_FILE_TYPES.IMAGE,
      ...XrayUploadService.SUPPORTED_FILE_TYPES.PDF
    ];

    if (!allowedTypes.includes(`.${ext}`)) {
      return cb(new Error('Unsupported file type'));
    }

    cb(null, true);
  }
});

/**
 * Upload a new X-ray
 * POST /api/xrays/upload
 */
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  validateRequest(xrayUploadRequestSchema),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const request = {
        ...req.body,
        file: req.file,
        doctorId: req.user.id
      };

      const xray = await xrayUploadService.processUpload(request, req.file);
      res.status(201).json(xray);
    } catch (error) {
      console.error('Error uploading X-ray:', error);
      res.status(500).json({ error: 'Failed to upload X-ray' });
    }
  }
);

/**
 * Get X-ray by ID
 * GET /api/xrays/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const xray = await storage.getXray(parseInt(req.params.id));
    if (!xray) {
      return res.status(404).json({ error: 'X-ray not found' });
    }

    // Check if user has access to this X-ray
    if (xray.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(xray);
  } catch (error) {
    console.error('Error fetching X-ray:', error);
    res.status(500).json({ error: 'Failed to fetch X-ray' });
  }
});

/**
 * Get X-rays for a patient
 * GET /api/xrays/patient/:patientId
 */
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const xrays = await storage.getXraysByPatient(parseInt(req.params.patientId));
    res.json(xrays);
  } catch (error) {
    console.error('Error fetching patient X-rays:', error);
    res.status(500).json({ error: 'Failed to fetch patient X-rays' });
  }
});

/**
 * Delete X-ray
 * DELETE /api/xrays/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const xray = await storage.getXray(parseInt(req.params.id));
    if (!xray) {
      return res.status(404).json({ error: 'X-ray not found' });
    }

    // Check if user has access to this X-ray
    if (xray.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await storage.deleteXray(xray.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting X-ray:', error);
    res.status(500).json({ error: 'Failed to delete X-ray' });
  }
});

export default router; 