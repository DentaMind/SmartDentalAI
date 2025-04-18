import { z } from 'zod';
import { Xray, InsertXray, XrayAiFinding, InsertXrayAiFinding } from '@shared/schema';
import { AuditLogService } from './audit-log';
import { AIService } from './ai-service';
import { StorageService } from './storage';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
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
        type: request.type,
        notes: request.notes,
        metadata: {
          ...metadata,
          source: request.source,
          sourceDetails: request.sourceDetails,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        }
      };

      const savedXray = await this.storage.createXray(xray);

      // Log the upload
      await this.auditLog.logAction({
        userId: request.doctorId,
        action: 'xray_upload',
        entityType: 'xray',
        entityId: savedXray.id,
        details: {
          patientId: request.patientId,
          type: request.type,
          source: request.source
        }
      });

      // Queue AI analysis
      this.aiService.queueXrayAnalysis(savedXray.id);

      return savedXray;
    } catch (error) {
      console.error('Error processing X-ray upload:', error);
      throw error;
    }
  }

  /**
   * Process a DICOM file and extract image and metadata
   */
  private async processDicomFile(buffer: Buffer): Promise<{ image: Buffer; metadata: Record<string, any> }> {
    try {
      const dicomData = dicomParser.parseDicom(buffer);
      const metadata = this.extractDicomMetadata(dicomData);
      
      // Convert DICOM to PNG
      const image = await this.convertDicomToImage(dicomData);
      
      return { image, metadata };
    } catch (error) {
      console.error('Error processing DICOM file:', error);
      throw new Error('Invalid DICOM file');
    }
  }

  /**
   * Process an image file (JPEG, PNG, etc.)
   */
  private async processImageFile(buffer: Buffer): Promise<Buffer> {
    try {
      // Use sharp to ensure consistent format and optimize
      return await sharp(buffer)
        .png()
        .toBuffer();
    } catch (error) {
      console.error('Error processing image file:', error);
      throw new Error('Invalid image file');
    }
  }

  /**
   * Process a PDF file
   */
  private async processPdfFile(buffer: Buffer): Promise<Buffer> {
    // TODO: Implement PDF processing
    throw new Error('PDF processing not yet implemented');
  }

  /**
   * Get file type based on extension
   */
  private getFileType(filename: string): 'DICOM' | 'IMAGE' | 'PDF' | null {
    const ext = path.extname(filename).toLowerCase();
    
    if (SUPPORTED_FILE_TYPES.DICOM.includes(ext)) return 'DICOM';
    if (SUPPORTED_FILE_TYPES.IMAGE.includes(ext)) return 'IMAGE';
    if (SUPPORTED_FILE_TYPES.PDF.includes(ext)) return 'PDF';
    
    return null;
  }

  /**
   * Extract metadata from DICOM file
   */
  private extractDicomMetadata(dicomData: any): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Extract common DICOM tags
    const tags = {
      patientName: 'x00100010',
      patientId: 'x00100020',
      studyDate: 'x00080020',
      modality: 'x00080060',
      // Add more tags as needed
    };

    for (const [key, tag] of Object.entries(tags)) {
      const element = dicomData.elements[tag];
      if (element) {
        metadata[key] = dicomData.string(tag);
      }
    }

    return metadata;
  }

  /**
   * Convert DICOM to image
   */
  private async convertDicomToImage(dicomData: any): Promise<Buffer> {
    // TODO: Implement DICOM to image conversion
    // This will depend on the specific DICOM parser library used
    throw new Error('DICOM to image conversion not yet implemented');
  }
} 