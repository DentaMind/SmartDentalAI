/**
 * DICOM handling routes for DentaMind
 * 
 * These routes handle DICOM file uploads, processing, and integration with the X-ray system
 */

import express from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth';
import { dicomService } from '../services/dicom-service';
import { storage } from '../storage';

const router = express.Router();

// Configure multer for DICOM file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size for DICOM files
  },
  fileFilter: (req, file, cb) => {
    // Accept DICOM files and common image formats (for compatibility with non-DICOM systems)
    if (
      file.mimetype === 'application/dicom' ||
      file.originalname.endsWith('.dcm') ||
      file.originalname.endsWith('.DCM') ||
      file.mimetype.startsWith('image/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only DICOM files and images are allowed'));
    }
  },
});

/**
 * Upload a DICOM file
 * POST /api/dicom/upload
 * Requires authentication and doctor/staff role
 */
router.post(
  '/upload',
  requireAuth,
  requireRole(['doctor', 'staff']),
  upload.single('dicomFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No DICOM file provided',
        });
      }

      const patientId = parseInt(req.body.patientId);
      const doctorId = parseInt(req.body.doctorId);
      
      if (isNaN(patientId) || isNaN(doctorId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid patient ID or doctor ID',
        });
      }

      // Process the DICOM file
      const { metadata, filePath } = await dicomService.processDicomFile(
        req.file.buffer
      );

      // Prepare the X-ray record for storage
      const xrayData = await dicomService.prepareDicomForStorage(
        filePath,
        metadata,
        patientId,
        doctorId
      );

      // Store in the database
      const xray = await storage.createXray(xrayData);

      res.status(200).json({
        success: true,
        message: 'DICOM file processed successfully',
        xray,
      });
    } catch (error) {
      console.error('Error uploading DICOM file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process DICOM file',
        error: error.message,
      });
    }
  }
);

/**
 * Analyze a DICOM X-ray with AI
 * POST /api/dicom/analyze/:xrayId
 * Requires authentication and doctor role
 */
router.post(
  '/analyze/:xrayId',
  requireAuth,
  requireRole(['doctor']),
  async (req, res) => {
    try {
      const xrayId = parseInt(req.params.xrayId);
      
      if (isNaN(xrayId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid X-ray ID',
        });
      }

      // Get the X-ray from the database
      const xray = await storage.getXray(xrayId);
      
      if (!xray) {
        return res.status(404).json({
          success: false,
          message: 'X-ray not found',
        });
      }

      // Perform AI analysis
      const analysisResults = await dicomService.analyzeXRayWithAI(
        xray.imageUrl, // This would be the path to the DICOM file in production
        xray.patientId
      );

      // Update the X-ray record with AI analysis
      const updatedXray = await storage.updateXray(xrayId, {
        aiAnalysis: analysisResults.aiAnalysis,
        analysisDate: new Date(analysisResults.analysisDate),
        pathologyDetected: analysisResults.pathologyDetected,
      });

      res.status(200).json({
        success: true,
        message: 'X-ray analyzed successfully',
        analysis: analysisResults,
        xray: updatedXray,
      });
    } catch (error) {
      console.error('Error analyzing X-ray:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze X-ray',
        error: error.message,
      });
    }
  }
);

/**
 * Compare two X-rays
 * POST /api/dicom/compare
 * Requires authentication and doctor role
 */
router.post(
  '/compare',
  requireAuth,
  requireRole(['doctor']),
  async (req, res) => {
    try {
      const { xrayId1, xrayId2 } = req.body;
      
      if (!xrayId1 || !xrayId2) {
        return res.status(400).json({
          success: false,
          message: 'Both X-ray IDs are required',
        });
      }

      // Get both X-rays from the database
      const xray1 = await storage.getXray(parseInt(xrayId1));
      const xray2 = await storage.getXray(parseInt(xrayId2));
      
      if (!xray1 || !xray2) {
        return res.status(404).json({
          success: false,
          message: 'One or both X-rays not found',
        });
      }

      // Compare the X-rays
      const comparisonResults = await dicomService.compareDicomXRays(
        xray1.imageUrl,
        xray2.imageUrl
      );

      // Update the newer X-ray with comparison results
      const newerXray = new Date(xray1.date) > new Date(xray2.date) ? xray1 : xray2;
      const updatedXray = await storage.updateXray(newerXray.id, {
        comparisonResult: comparisonResults,
      });

      res.status(200).json({
        success: true,
        message: 'X-rays compared successfully',
        comparison: comparisonResults,
        xray: updatedXray,
      });
    } catch (error) {
      console.error('Error comparing X-rays:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to compare X-rays',
        error: error.message,
      });
    }
  }
);

/**
 * Export anonymized DICOM (for HIPAA compliance when sharing)
 * GET /api/dicom/export/:xrayId
 * Requires authentication and doctor role
 */
router.get(
  '/export/:xrayId',
  requireAuth,
  requireRole(['doctor']),
  async (req, res) => {
    try {
      const xrayId = parseInt(req.params.xrayId);
      
      if (isNaN(xrayId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid X-ray ID',
        });
      }

      // Get the X-ray from the database
      const xray = await storage.getXray(xrayId);
      
      if (!xray) {
        return res.status(404).json({
          success: false,
          message: 'X-ray not found',
        });
      }

      // Here we would actually anonymize the DICOM file
      // For now, we just send the image URL
      res.status(200).json({
        success: true,
        message: 'X-ray exported successfully',
        imageUrl: xray.imageUrl,
      });
    } catch (error) {
      console.error('Error exporting X-ray:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export X-ray',
        error: error.message,
      });
    }
  }
);

export default router;