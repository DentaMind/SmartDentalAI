import { z } from 'zod';
import { Xray, InsertXray, XrayAiFinding, InsertXrayAiFinding, XrayType, XraySource } from '@shared/schema';
import { AuditLogService } from './audit-log';
import { AIService } from './ai-service';
import { StorageService } from './storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as dicomParser from 'dicom-parser';
import sharp from 'sharp';

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  DICOM: ['.dcm', '.dicom'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.tiff', '.tif'],
  PDF: ['.pdf']
};

// X-ray upload request schema
export const xrayUploadRequestSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  file: z.any(), // This will be handled by multer
  type: z.enum(['bitewing', 'periapical', 'panoramic', 'cbct', 'endodontic', 'fmx']),
  source: z.enum(['upload', 'sensor', 'pacs', 'software']),
  sourceDetails: z.object({
    device: z.string().optional(),
    software: z.string().optional(),
    pacsId: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }).optional(),
  notes: z.string().optional()
});

export type XrayUploadRequest = z.infer<typeof xrayUploadRequestSchema>;

export class XrayUploadService {
  private auditLog: AuditLogService;
  private aiService: AIService;
  private storage: StorageService;

  constructor() {
    this.auditLog = new AuditLogService();
    this.aiService = new AIService();
    this.storage = new StorageService();
  }

  private getFileType(filename: string): keyof typeof SUPPORTED_FILE_TYPES | null {
    const ext = path.extname(filename).toLowerCase();
    for (const [type, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (extensions.includes(ext)) {
        return type as keyof typeof SUPPORTED_FILE_TYPES;
      }
    }
    return null;
  }

  private async processDicomFile(buffer: Buffer): Promise<{ image: Buffer; metadata: Record<string, any> }> {
    const dicomData = dicomParser.parseDicom(buffer);
    const metadata: Record<string, any> = {};

    // Extract DICOM metadata
    dicomData.elements.forEach((element: any) => {
      if (element.tag && element.value) {
        metadata[element.tag] = element.value;
      }
    });

    // Convert DICOM to PNG
    const image = await sharp(buffer)
      .png()
      .toBuffer();

    return { image, metadata };
  }

  private async processImageFile(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  private async processPdfFile(buffer: Buffer): Promise<Buffer> {
    // For now, we'll just return the PDF as is
    // TODO: Implement PDF to image conversion if needed
    return buffer;
  }

  /**
   * Process and store an uploaded X-ray file
   */
  async processUpload(request: XrayUploadRequest, file: Express.Multer.File): Promise<Xray> {
    try {
      // Validate file type
      const fileType = this.getFileType(file.originalname);
      if (!fileType) {
        throw new Error('Unsupported file type');
      }

      // Generate unique filename
      const filename = `${uuidv4()}${path.extname(file.originalname)}`;
      
      // Process based on file type
      let processedFile: Buffer;
      let metadata: Record<string, any> = {};

      switch (fileType) {
        case 'DICOM':
          const dicomData = await this.processDicomFile(file.buffer);
          processedFile = dicomData.image;
          metadata = dicomData.metadata;
          break;
        case 'IMAGE':
          processedFile = await this.processImageFile(file.buffer);
          break;
        case 'PDF':
          processedFile = await this.processPdfFile(file.buffer);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      // Store the file
      const fileUrl = await this.storage.storeFile(processedFile, filename, 'xrays');

      // Create X-ray record
      const xray: InsertXray = {
        patientId: request.patientId,
        doctorId: request.doctorId,
        imageUrl: fileUrl,
        type: request.type as XrayType,
        notes: request.notes,
        metadata: {
          source: request.source as XraySource,
          sourceDetails: request.sourceDetails,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          aiAnalysis: {
            status: 'pending'
          }
        }
      };

      const savedXray = await this.storage.createXray(xray);

      // Queue AI analysis
      this.aiService.analyzeXray(savedXray.id).catch(console.error);

      // Log the upload
      await this.auditLog.logAction({
        userId: request.doctorId,
        action: 'xray_upload',
        entityType: 'xray',
        entityId: savedXray.id,
        metadata: {
          type: request.type,
          source: request.source,
          patientId: request.patientId
        }
      });

      return savedXray;
    } catch (error) {
      console.error('Error processing X-ray upload:', error);
      throw error;
    }
  }

  /**
   * Delete an X-ray and its associated files
   */
  async deleteXray(xrayId: number, userId: number): Promise<void> {
    try {
      const xray = await this.storage.getXray(xrayId);
      if (!xray) {
        throw new Error('X-ray not found');
      }

      // Delete the file from storage
      await this.storage.deleteFile(xray.imageUrl);

      // Delete the X-ray record
      await this.storage.deleteXray(xrayId);

      // Log the deletion
      await this.auditLog.logAction({
        userId,
        action: 'xray_delete',
        entityType: 'xray',
        entityId: xrayId,
        metadata: {
          patientId: xray.patientId
        }
      });
    } catch (error) {
      console.error('Error deleting X-ray:', error);
      throw error;
    }
  }
} 