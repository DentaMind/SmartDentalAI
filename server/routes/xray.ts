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
 * Get X-rays for a patient
 * GET /api/xrays/patient/:patientId
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

      const xrays = await storage.getPatientXrays(patientId);
      res.json(xrays);
    } catch (error) {
      console.error('Error fetching patient X-rays:', error);
      res.status(500).json({ error: 'Failed to fetch X-rays' });
    }
  }
);

/**
 * Get a specific X-ray
 * GET /api/xrays/:id
 */
router.get(
  '/:id',
  authenticate,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid X-ray ID' });
      }

      const xray = await storage.getXray(id);
      if (!xray) {
        return res.status(404).json({ error: 'X-ray not found' });
      }

      res.json(xray);
    } catch (error) {
      console.error('Error fetching X-ray:', error);
      res.status(500).json({ error: 'Failed to fetch X-ray' });
    }
  }
);

/**
 * Delete an X-ray
 * DELETE /api/xrays/:id
 */
router.delete(
  '/:id',
  authenticate,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid X-ray ID' });
      }

      await xrayUploadService.deleteXray(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting X-ray:', error);
      res.status(500).json({ error: 'Failed to delete X-ray' });
    }
  }
);

export default router; 