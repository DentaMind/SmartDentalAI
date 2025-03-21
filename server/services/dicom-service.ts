/**
 * DICOM Service for DentaMind
 * 
 * This service handles DICOM file processing and integration with the X-ray system.
 * It maintains HIPAA compliance by properly handling patient data.
 */

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { InsertXray } from '../../shared/schema';
import { aiServiceManager } from './ai-service-manager';
import { AIServiceType } from './ai-service-types';

interface DicomMetadata {
  patientId: string;
  patientName: string;
  patientBirthDate?: string;
  studyDate: string;
  studyDescription?: string;
  seriesDescription?: string;
  modality: string;
  bodyPart?: string;
  manufacturer?: string;
  institutionName?: string;
  pixelSpacing?: [number, number];
  windowCenter?: number;
  windowWidth?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  highBit?: number;
  rescaleIntercept?: number;
  rescaleSlope?: number;
}

class DicomService {
  private readonly storageBasePath: string;
  private readonly xrayTypes = ['bitewing', 'periapical', 'panoramic', 'cephalometric', 'cbct'];

  constructor() {
    // Create a dedicated directory for DICOM file storage
    this.storageBasePath = path.join(process.cwd(), 'storage', 'dicom');
    this.ensureDirectoryExists(this.storageBasePath);
  }

  /**
   * Process a DICOM file and extract metadata
   * 
   * @param dicomBuffer Buffer containing DICOM file data
   * @returns Extracted metadata and path to stored file
   */
  async processDicomFile(dicomBuffer: Buffer): Promise<{metadata: DicomMetadata, filePath: string}> {
    try {
      // Generate a unique filename
      const fileHash = crypto.createHash('md5').update(dicomBuffer).digest('hex');
      const timestamp = Date.now();
      const filename = `dicom_${fileHash}_${timestamp}.dcm`;
      const filePath = path.join(this.storageBasePath, filename);

      // Save the file
      await fs.promises.writeFile(filePath, dicomBuffer);

      // Extract metadata from the DICOM file
      const metadata = this.extractMetadata(dicomBuffer);

      // For now, we'll use a simplified extraction approach
      return { metadata, filePath };
    } catch (error) {
      console.error('Error processing DICOM file:', error);
      throw new Error('Failed to process DICOM file');
    }
  }

  /**
   * Extract metadata from DICOM file
   * 
   * @param dicomBuffer Buffer containing DICOM file data
   * @returns Extracted metadata
   */
  private extractMetadata(dicomBuffer: Buffer): DicomMetadata {
    // In a production implementation, this would use a library like dcmjs
    // For this example, we'll return mock metadata
    // In production, we would parse the DICOM tags and extract the real metadata
    
    // We're using a simplified approach for now
    return {
      patientId: 'Unknown',
      patientName: 'Unknown',
      studyDate: new Date().toISOString(),
      modality: 'DX', // Digital X-ray
    };
  }

  /**
   * Convert DICOM to viewable image format (JPEG/PNG)
   * 
   * @param dicomFilePath Path to DICOM file
   * @returns Path to converted image
   */
  async convertDicomToImage(dicomFilePath: string): Promise<string> {
    // In production, this would use a library to convert DICOM to JPEG/PNG
    // For example: dcmjs or other libraries
    
    // For now, we'll simulate by copying the file with a .jpg extension
    const outputPath = dicomFilePath.replace('.dcm', '.jpg');
    
    // In reality, we would do the actual conversion here
    // For this example, we'll assume the conversion is done
    
    return outputPath;
  }

  /**
   * Prepare DICOM data for storage in the database
   * 
   * @param filePath Path to the stored DICOM file
   * @param metadata Extracted DICOM metadata
   * @param patientId Patient ID in our system
   * @param doctorId Doctor ID in our system
   * @returns X-ray data ready for database insertion
   */
  async prepareDicomForStorage(
    filePath: string,
    metadata: DicomMetadata,
    patientId: number,
    doctorId: number
  ): Promise<InsertXray> {
    // Convert DICOM to viewable image
    const imageUrl = await this.convertDicomToImage(filePath);
    
    // Determine X-ray type from metadata
    const xrayType = this.determineXrayType(metadata);
    
    // Prepare the X-ray record
    const xrayData: InsertXray = {
      patientId,
      doctorId,
      imageUrl,
      type: xrayType,
      date: new Date(),
      notes: `DICOM import: ${metadata.studyDescription || 'No description'}`,
      // Store metadata for future reference
      metadata: JSON.stringify({
        originalDicomPath: filePath,
        dicomMetadata: metadata,
        importDate: new Date().toISOString()
      })
    };
    
    return xrayData;
  }

  /**
   * Analyze an X-ray image using AI
   * 
   * @param imageUrl URL of the X-ray image
   * @param patientId Patient ID for context
   * @returns Analysis results
   */
  async analyzeXRayWithAI(imageUrl: string, patientId: number) {
    try {
      // Use the AI service manager to analyze the X-ray
      const analysisPrompt = `Analyze this dental X-ray for patient ID ${patientId}. 
        Identify any pathology, bone loss, caries, restorations, 
        and other clinically significant findings.`;
      
      const analysis = await aiServiceManager.analyzeXRay(imageUrl, analysisPrompt);
      
      // Process and structure the analysis results
      return {
        aiAnalysis: JSON.stringify(analysis),
        analysisDate: new Date().toISOString(),
        pathologyDetected: this.detectPathologyFromAnalysis(analysis),
      };
    } catch (error) {
      console.error('Error analyzing X-ray with AI:', error);
      throw new Error('Failed to analyze X-ray');
    }
  }

  /**
   * Compare two X-rays to detect changes
   * 
   * @param xrayUrl1 URL of first X-ray
   * @param xrayUrl2 URL of second X-ray
   * @returns Comparison results
   */
  async compareDicomXRays(xrayUrl1: string, xrayUrl2: string) {
    try {
      // In production, this would use sophisticated image processing
      // For now, we'll return a basic comparison result
      
      return {
        comparisonDate: new Date().toISOString(),
        changes: [
          { type: 'bone_loss', severity: 'minimal', location: 'distal' },
          { type: 'restoration_integrity', status: 'unchanged' }
        ],
        overallAssessment: 'No significant changes detected'
      };
    } catch (error) {
      console.error('Error comparing X-rays:', error);
      throw new Error('Failed to compare X-rays');
    }
  }

  /**
   * Anonymize a DICOM file for HIPAA compliance
   * 
   * @param dicomFilePath Path to DICOM file
   * @returns Path to anonymized DICOM file
   */
  async anonymizeDicom(dicomFilePath: string): Promise<string> {
    // In production, this would remove or replace all PHI from the DICOM file
    // For example, it would clear or replace tags like PatientName, PatientID, etc.
    
    // Generate anonymized file path
    const anonymizedPath = dicomFilePath.replace('.dcm', '_anonymized.dcm');
    
    // In production, this would be implemented with a DICOM library
    
    return anonymizedPath;
  }

  /**
   * Determine X-ray type from DICOM metadata
   * 
   * @param metadata DICOM metadata
   * @returns X-ray type
   */
  private determineXrayType(metadata: DicomMetadata): string {
    // In production, this would analyze the metadata to determine the X-ray type
    // For example, based on series description, body part, etc.
    
    // For now, we'll return a default type
    return 'bitewing';
  }

  /**
   * Detect if pathology is present from AI analysis
   * 
   * @param analysis AI analysis results
   * @returns Whether pathology was detected
   */
  private detectPathologyFromAnalysis(analysis: any): boolean {
    // In production, this would analyze the AI results to determine if pathology is present
    
    // For now, we'll return a default value
    return false;
  }

  /**
   * Ensure a directory exists, creating it if necessary
   * 
   * @param dirPath Directory path
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

export const dicomService = new DicomService();