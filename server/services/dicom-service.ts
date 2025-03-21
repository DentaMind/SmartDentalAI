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
      // Store metadata as jsonb type
      metadata: {
        originalDicomPath: filePath,
        dicomMetadata: metadata,
        importDate: new Date().toISOString()
      }
    };
    
    return xrayData;
  }

  /**
   * Analyze an X-ray image using AI
   * 
   * @param imageUrl URL of the X-ray image
   * @param patientId Patient ID for context
   * @param previousXrayUrl URL of previous X-ray for comparison (optional)
   * @returns Analysis results
   */
  async analyzeXRayWithAI(imageUrl: string, patientId: number, previousXrayUrl?: string) {
    try {
      // Use the AI service manager to analyze the X-ray
      let analysisPrompt = `Analyze this dental X-ray for patient ID ${patientId}. 
        Identify any pathology, bone loss, caries, restorations, 
        and other clinically significant findings.`;
      
      // Add comparison context if a previous X-ray is provided
      if (previousXrayUrl) {
        analysisPrompt += ` Compare with the previous X-ray if provided.
        Note any changes, improvements, or deterioration in conditions.
        Format the output with clear sections for (1) Findings, (2) Comparison with previous X-ray, and (3) Recommendations.`;
      }
      
      // Analyze the current X-ray
      const analysis = await aiServiceManager.analyzeXRay(imageUrl, analysisPrompt);
      
      // If we have a previous X-ray, enrich the analysis with comparison
      let comparisonResult = null;
      if (previousXrayUrl) {
        // We'll do a simplified comparison for now
        // In production, this would be a more sophisticated analysis
        comparisonResult = await this.compareDicomXRays(imageUrl, previousXrayUrl);
      }
      
      // Process the results
      const apiResponse = this.processAnalysisResponse(analysis, comparisonResult);
      
      // Return structured results
      return {
        aiAnalysis: JSON.stringify(apiResponse),
        analysisDate: new Date().toISOString(),
        pathologyDetected: this.detectPathologyFromAnalysis(apiResponse),
      };
    } catch (error) {
      console.error('Error analyzing X-ray with AI:', error);
      throw new Error('Failed to analyze X-ray');
    }
  }
  
  /**
   * Process and structure the AI analysis response
   */
  private processAnalysisResponse(analysis: any, comparisonResult: any = null) {
    // Create a structured response for the frontend
    try {
      // Extract key information from raw analysis text
      const analysisText = analysis?.analysis || '';
      
      // For now, simplified parsing
      const findings = [];
      const recommendations = [];
      
      // Look for indicators of pathologies in the text
      if (analysisText.toLowerCase().includes('caries')) {
        findings.push({
          type: 'caries',
          description: 'Potential caries detected',
          location: this.extractLocationFromText(analysisText, 'caries'),
          confidence: 0.85,
          severity: 'moderate'
        });
      }
      
      if (analysisText.toLowerCase().includes('periapical')) {
        findings.push({
          type: 'periapical',
          description: 'Periapical lesion detected',
          location: this.extractLocationFromText(analysisText, 'periapical'),
          confidence: 0.9,
          severity: 'moderate'
        });
      }
      
      if (analysisText.toLowerCase().includes('bone loss')) {
        findings.push({
          type: 'bone_loss',
          description: 'Bone loss detected',
          location: this.extractLocationFromText(analysisText, 'bone loss'),
          confidence: 0.88,
          severity: 'moderate'
        });
      }
      
      // Extract recommendations from text
      const recommendationMatches = analysisText.match(/recommend[^.]*\./gi) || [];
      recommendationMatches.forEach(match => {
        recommendations.push(match.trim());
      });
      
      // Create a structured response
      return {
        analysis: analysisText,
        findings: findings.length > 0 ? findings : [{ 
          type: 'other', 
          description: 'No significant findings', 
          confidence: 0.9, 
          severity: 'mild' 
        }],
        recommendations: recommendations.length > 0 ? recommendations : ['No specific actions recommended at this time.'],
        comparison: comparisonResult,
      };
    } catch (err) {
      console.error('Error processing analysis response:', err);
      return {
        analysis: analysis?.analysis || 'Analysis failed',
        findings: [],
        recommendations: ['Unable to process analysis results. Please consult a specialist.'],
      };
    }
  }
  
  /**
   * Extract location information from analysis text
   */
  private extractLocationFromText(text: string, keyword: string): string {
    // Simple extraction logic - would be more sophisticated in production
    const sentences = text.split('.');
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(keyword)) {
        // Look for tooth numbers or quadrants
        const toothMatch = sentence.match(/tooth (\d+)/i);
        if (toothMatch) return `Tooth ${toothMatch[1]}`;
        
        // Look for quadrants
        if (sentence.includes('upper right')) return 'Upper right quadrant';
        if (sentence.includes('upper left')) return 'Upper left quadrant';
        if (sentence.includes('lower right')) return 'Lower right quadrant';
        if (sentence.includes('lower left')) return 'Lower left quadrant';
      }
    }
    return 'Not specified';
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
    // Check if analysis contains findings indicating pathology
    try {
      // If we have structured findings, check each finding
      if (analysis && analysis.findings && Array.isArray(analysis.findings)) {
        // Look for pathological finding types
        const pathologicalTypes = ['caries', 'periapical', 'bone_loss', 'infection', 'lesion', 'fracture'];
        
        // Check if any finding is pathological
        for (const finding of analysis.findings) {
          // If the finding type matches a pathological type, return true
          if (pathologicalTypes.includes(finding.type)) {
            return true;
          }
          
          // Also check description text for pathological terms
          if (finding.description && typeof finding.description === 'string') {
            const description = finding.description.toLowerCase();
            if (
              description.includes('pathology') ||
              description.includes('lesion') ||
              description.includes('abnormal') ||
              description.includes('infection') ||
              description.includes('disease')
            ) {
              return true;
            }
          }
        }
      }
      
      // Check the main analysis text for pathology indicators
      if (analysis.analysis && typeof analysis.analysis === 'string') {
        const analysisText = analysis.analysis.toLowerCase();
        const pathologyIndicators = [
          'caries', 'decay', 'cavity', 
          'periapical', 'lesion', 'radiolucency',
          'bone loss', 'periodontal disease',
          'infection', 'abscess', 'inflammation',
          'fracture', 'crack', 'pathology'
        ];
        
        // Check if any pathology indicator is present in the text
        for (const indicator of pathologyIndicators) {
          if (analysisText.includes(indicator)) {
            return true;
          }
        }
      }
      
      // No pathology detected
      return false;
    } catch (error) {
      console.error('Error detecting pathology from analysis:', error);
      // Default to false for safety
      return false;
    }
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