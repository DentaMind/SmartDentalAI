import express from 'express';
import { upload, XrayUploadService } from '../services/xray-upload';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/roles';
import { validateObjectId } from '../middleware/validation';
import { XrayUpload } from '../models/xray-upload';
import { AuditLogService } from '../services/audit-log';

const router = express.Router();

// Upload X-ray for a patient
router.post(
  '/:patientId',
  authenticateToken,
  checkRole(['dentist', 'admin']),
  validateObjectId('patientId'),
  upload.single('xray'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const xrayUpload = await XrayUploadService.processUpload(
        req.file,
        req.params.patientId,
        req.user.id,
        {
          deviceInfo: req.headers['user-agent'],
          location: req.ip,
          notes: req.body.notes
        }
      );

      res.status(201).json(xrayUpload);
    } catch (error) {
      console.error('X-ray upload error:', error);
      res.status(500).json({ error: 'Failed to process X-ray upload' });
    }
  }
);

// Get X-rays for a patient
router.get(
  '/patient/:patientId',
  authenticateToken,
  checkRole(['dentist', 'admin', 'patient']),
  validateObjectId('patientId'),
  async (req, res) => {
    try {
      const xrays = await XrayUpload.find({ patientId: req.params.patientId })
        .sort({ 'metadata.uploadDate': -1 })
        .populate('metadata.uploadedBy', 'name email');

      res.json(xrays);
    } catch (error) {
      console.error('Error fetching X-rays:', error);
      res.status(500).json({ error: 'Failed to fetch X-rays' });
    }
  }
);

// Get single X-ray
router.get(
  '/:id',
  authenticateToken,
  checkRole(['dentist', 'admin', 'patient']),
  validateObjectId('id'),
  async (req, res) => {
    try {
      const xray = await XrayUpload.findById(req.params.id)
        .populate('metadata.uploadedBy', 'name email');

      if (!xray) {
        return res.status(404).json({ error: 'X-ray not found' });
      }

      // Check if user has access to this X-ray
      if (req.user.role === 'patient' && xray.patientId.toString() !== req.user.patientId?.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(xray);
    } catch (error) {
      console.error('Error fetching X-ray:', error);
      res.status(500).json({ error: 'Failed to fetch X-ray' });
    }
  }
);

// Delete X-ray
router.delete(
  '/:id',
  authenticateToken,
  checkRole(['dentist', 'admin']),
  validateObjectId('id'),
  async (req, res) => {
    try {
      await XrayUploadService.deleteUpload(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting X-ray:', error);
      res.status(500).json({ error: 'Failed to delete X-ray' });
    }
  }
);

// Get X-ray file
router.get(
  '/:id/file',
  authenticateToken,
  checkRole(['dentist', 'admin', 'patient']),
  validateObjectId('id'),
  async (req, res) => {
    try {
      const xray = await XrayUpload.findById(req.params.id);

      if (!xray) {
        return res.status(404).json({ error: 'X-ray not found' });
      }

      // Check if user has access to this X-ray
      if (req.user.role === 'patient' && xray.patientId.toString() !== req.user.patientId?.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.sendFile(xray.path);
    } catch (error) {
      console.error('Error serving X-ray file:', error);
      res.status(500).json({ error: 'Failed to serve X-ray file' });
    }
  }
);

// Get X-ray thumbnail
router.get(
  '/:id/thumbnail',
  authenticateToken,
  checkRole(['dentist', 'admin', 'patient']),
  validateObjectId('id'),
  async (req, res) => {
    try {
      const xray = await XrayUpload.findById(req.params.id);

      if (!xray) {
        return res.status(404).json({ error: 'X-ray not found' });
      }

      if (!xray.thumbnailPath) {
        return res.status(404).json({ error: 'Thumbnail not available' });
      }

      // Check if user has access to this X-ray
      if (req.user.role === 'patient' && xray.patientId.toString() !== req.user.patientId?.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.sendFile(xray.thumbnailPath);
    } catch (error) {
      console.error('Error serving X-ray thumbnail:', error);
      res.status(500).json({ error: 'Failed to serve X-ray thumbnail' });
    }
  }
);

export default router; 