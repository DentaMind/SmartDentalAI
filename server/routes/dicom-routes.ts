/**
 * DentaMind DICOM and X-ray Analysis Routes
 * 
 * This file contains routes for handling DICOM files and X-ray image analysis.
 * It interfaces with the AI service integration for analysis using the X-ray AI model.
 */

import express from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage';
import { aiService } from '../services/ai-service-integration';
import { PatientMedicalHistory } from '@shared/schema';
import path from 'path';
import fs from 'fs';

// Helper function to extract patient medical history
async function getPatientMedicalHistory(patientId: number): Promise<PatientMedicalHistory | undefined> {
  try {
    const patient = await storage.getPatient(patientId);
    if (!patient) return undefined;
    
    // Extract medical history from patient record
    const medicalHistory: PatientMedicalHistory = {};
    
    // Parse JSON fields if stored as strings
    if (patient.allergies) {
      try {
        medicalHistory.allergies = JSON.parse(patient.allergies);
      } catch {
        // If not valid JSON, treat as comma-separated string
        medicalHistory.allergies = patient.allergies.split(',').map(a => a.trim());
      }
    }
    
    if (patient.medicalHistory) {
      try {
        const parsedHistory = JSON.parse(patient.medicalHistory);
        // Merge parsed data into medicalHistory
        Object.assign(medicalHistory, parsedHistory);
      } catch {
        // If not valid JSON, do nothing
      }
    }
    
    // Add other relevant medical fields
    if (patient.hypertension) medicalHistory.systemicConditions = [...(medicalHistory.systemicConditions || []), 'Hypertension'];
    if (patient.diabetes) medicalHistory.systemicConditions = [...(medicalHistory.systemicConditions || []), 'Diabetes'];
    if (patient.heartDisease) medicalHistory.systemicConditions = [...(medicalHistory.systemicConditions || []), 'Heart Disease'];
    
    return medicalHistory;
  } catch (error) {
    console.error('Error fetching patient medical history:', error);
    return undefined;
  }
}

export function setupDICOMRoutes(router: express.Router) {
  // Analyze an X-ray image
  router.post('/dicom/analyze/:xrayId', requireAuth, async (req, res) => {
    try {
      const { xrayId } = req.params;
      const { patientId, previousXRayId } = req.body;
      
      if (!xrayId || !patientId) {
        return res.status(400).json({
          success: false,
          message: 'X-ray ID and patient ID are required'
        });
      }
      
      // Get X-ray data
      const xray = await storage.getXray(parseInt(xrayId));
      if (!xray) {
        return res.status(404).json({
          success: false,
          message: 'X-ray not found'
        });
      }
      
      // Get previous X-ray if specified
      let previousXRay;
      if (previousXRayId) {
        previousXRay = await storage.getXray(parseInt(previousXRayId));
      }
      
      // Get patient medical history
      const medicalHistory = await getPatientMedicalHistory(parseInt(patientId));
      
      // Process the X-ray with AI
      const analysis = await aiService.analyzeXRay(
        xray.imageUrl || '', 
        // Use the type field for the X-ray position/type
        xray.type || 'unknown',
        medicalHistory,
        previousXRay?.imageUrl
      );
      
      // Store analysis results
      await storage.updateXray(parseInt(xrayId), {
        aiAnalysis: analysis,
        analysisDate: new Date(),
        pathologyDetected: analysis.findings ? analysis.findings.length > 0 : false
      });
      
      return res.json({
        success: true,
        message: 'X-ray analysis completed',
        analysis,
        xray
      });
    } catch (error) {
      console.error('Error analyzing X-ray:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze X-ray'
      });
    }
  });

  // Get all X-rays for a patient
  router.get('/dicom/patient/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }
      
      const xrays = await storage.getPatientXrays(parseInt(patientId));
      
      return res.json({
        success: true,
        xrays
      });
    } catch (error) {
      console.error('Error fetching patient X-rays:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch patient X-rays'
      });
    }
  });

  // Get a specific X-ray by ID
  router.get('/dicom/:xrayId', requireAuth, async (req, res) => {
    try {
      const { xrayId } = req.params;
      
      if (!xrayId) {
        return res.status(400).json({
          success: false,
          message: 'X-ray ID is required'
        });
      }
      
      const xray = await storage.getXray(parseInt(xrayId));
      
      if (!xray) {
        return res.status(404).json({
          success: false,
          message: 'X-ray not found'
        });
      }
      
      return res.json({
        success: true,
        xray
      });
    } catch (error) {
      console.error('Error fetching X-ray:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch X-ray'
      });
    }
  });
}

// Export is already defined above