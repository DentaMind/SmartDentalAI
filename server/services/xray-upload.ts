import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import sharp from 'sharp';
import { XrayUpload, IXrayUpload } from '../models/xray-upload';
import { AuditLogService } from './audit-log';
import { AIModelService } from './ai-model';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'xrays');
    try {
      await mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/dicom'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and DICOM files are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

export class XrayUploadService {
  static async processUpload(
    file: Express.Multer.File,
    patientId: string,
    userId: string,
    metadata: Partial<IXrayUpload['metadata']> = {}
  ): Promise<IXrayUpload> {
    try {
      // Create thumbnail for non-DICOM files
      let thumbnailPath: string | undefined;
      if (file.mimetype !== 'image/dicom') {
        const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
        await mkdir(thumbnailDir, { recursive: true });
        
        const thumbnailFilename = `thumb-${path.basename(file.filename)}`;
        thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
        
        await sharp(file.path)
          .resize(300, 300, { fit: 'inside' })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
      }

      // Create X-ray upload record
      const xrayUpload = new XrayUpload({
        patientId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        thumbnailPath,
        metadata: {
          ...metadata,
          uploadedBy: userId,
          uploadDate: new Date()
        }
      });

      await xrayUpload.save();

      // Process with AI model if available
      if (file.mimetype !== 'image/dicom') {
        try {
          const aiResults = await AIModelService.analyzeXray(file.path);
          xrayUpload.aiFlags = {
            hasAnomalies: aiResults.hasAnomalies,
            confidence: aiResults.confidence,
            findings: aiResults.findings
          };
          xrayUpload.status = 'processed';
          await xrayUpload.save();
        } catch (error) {
          console.error('AI analysis failed:', error);
          xrayUpload.status = 'failed';
          xrayUpload.error = 'AI analysis failed';
          await xrayUpload.save();
        }
      }

      return xrayUpload;
    } catch (error) {
      // Clean up files if upload fails
      if (file.path) {
        await unlink(file.path).catch(console.error);
      }
      throw error;
    }
  }

  static async deleteUpload(xrayId: string, userId: string): Promise<void> {
    const xray = await XrayUpload.findById(xrayId);
    if (!xray) {
      throw new Error('X-ray upload not found');
    }

    // Delete files
    if (xray.path) {
      await unlink(xray.path).catch(console.error);
    }
    if (xray.thumbnailPath) {
      await unlink(xray.thumbnailPath).catch(console.error);
    }

    // Delete record
    await xray.deleteOne();

    // Log deletion
    await AuditLogService.logAction({
      userId,
      action: 'xray_delete',
      entityType: 'XrayUpload',
      entityId: xrayId,
      metadata: {
        patientId: xray.patientId,
        filename: xray.filename
      }
    });
  }
} 