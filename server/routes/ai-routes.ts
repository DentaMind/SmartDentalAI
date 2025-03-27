/**
 * DentaMind AI Routes
 * 
 * This file contains all API routes related to AI functionality across the DentaMind platform.
 * Each route is designed to interface with the centralized AI service integration to provide
 * consistent error handling, logging, and response formatting.
 */

import express from 'express';
import { aiService } from '../services/ai-service-integration';
import { requireAuth, requireRole } from '../middleware/auth';
import { storage } from '../storage';

export function setupAIRoutes(router: express.Router) {
  // AI Services Status
  router.get('/ai/status', requireAuth, async (req, res) => {
    try {
      const status = aiService.getServiceStatus();
      return res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error fetching AI service status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch AI service status'
      });
    }
  });
  
  // Get latest AI X-ray analysis for a patient
  router.get('/ai/xray/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }
      
      // Get the patient's most recent X-ray with analysis
      const xrays = await storage.getPatientXrays(parseInt(patientId));
      
      // Find the most recent X-ray with AI analysis
      const analyzedXrays = xrays.filter(xray => xray.aiAnalysis && xray.analysisDate)
        .sort((a, b) => {
          const dateA = a.analysisDate ? new Date(a.analysisDate).getTime() : 0;
          const dateB = b.analysisDate ? new Date(b.analysisDate).getTime() : 0;
          return dateB - dateA; // Sort descending (most recent first)
        });
      
      if (analyzedXrays.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No analyzed X-rays found for this patient'
        });
      }
      
      const latestXray = analyzedXrays[0];
      
      // Format the findings in a way the frontend component expects
      let analysis = null;
      try {
        analysis = typeof latestXray.aiAnalysis === 'string' 
          ? JSON.parse(latestXray.aiAnalysis)
          : latestXray.aiAnalysis;
      } catch (parseError) {
        console.error('Error parsing X-ray analysis JSON:', parseError);
        return res.status(500).json({
          success: false,
          message: 'Error parsing X-ray analysis data'
        });
      }
      
      // Return formatted analysis
      return res.json({
        success: true,
        imageUrl: latestXray.imageUrl,
        findings: analysis.findings.map((finding: any) => ({
          tooth: finding.toothNumber || 0,
          finding: finding.description || finding.condition || finding,
          confidence: finding.confidence || 0.85 // Default confidence if not provided
        })),
        analysisDate: latestXray.analysisDate,
        xrayId: latestXray.id,
        xrayType: latestXray.type
      });
    } catch (error) {
      console.error('Error fetching X-ray analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch X-ray analysis'
      });
    }
  });

  // AI Health Check - validates all services
  router.get('/ai/health-check', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const status = await aiService.checkAllServices();
      return res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error checking AI service health:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check AI service health'
      });
    }
  });

  // AI Diagnosis
  router.post('/ai/diagnosis', requireAuth, async (req, res) => {
    try {
      const { symptoms, patientHistory } = req.body;
      
      if (!symptoms) {
        return res.status(400).json({
          success: false,
          message: 'Symptoms are required'
        });
      }
      
      const prediction = await aiService.diagnoseSymptoms(symptoms, patientHistory);
      
      return res.json({
        success: true,
        prediction
      });
    } catch (error) {
      console.error('Error generating diagnosis:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate diagnosis'
      });
    }
  });

  // AI Treatment Planning
  router.post('/ai/treatment-plan', requireAuth, async (req, res) => {
    try {
      const { diagnosis, patientHistory, insuranceProvider } = req.body;
      
      if (!diagnosis) {
        return res.status(400).json({
          success: false,
          message: 'Diagnosis is required'
        });
      }
      
      const treatmentPlan = await aiService.generateTreatmentPlan(diagnosis, patientHistory, insuranceProvider);
      
      return res.json({
        success: true,
        treatmentPlan
      });
    } catch (error) {
      console.error('Error generating treatment plan:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate treatment plan'
      });
    }
  });

  // AI Financial Forecast
  router.post('/ai/financial-forecast', requireAuth, requireRole(['admin', 'doctor']), async (req, res) => {
    try {
      const { historicalData, months = 12 } = req.body;
      
      if (!historicalData) {
        return res.status(400).json({
          success: false,
          message: 'Historical data is required'
        });
      }
      
      const forecast = await aiService.generateFinancialForecast(historicalData, months);
      
      return res.json({
        success: true,
        forecast
      });
    } catch (error) {
      console.error('Error generating financial forecast:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate financial forecast'
      });
    }
  });

  // AI Scheduling Optimization
  router.post('/ai/scheduling-optimization', requireAuth, async (req, res) => {
    try {
      const { availability, preferences } = req.body;
      
      if (!availability || !Array.isArray(availability)) {
        return res.status(400).json({
          success: false,
          message: 'Availability array is required'
        });
      }
      
      const recommendations = await aiService.optimizeScheduling(availability, preferences);
      
      return res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error('Error optimizing scheduling:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to optimize scheduling'
      });
    }
  });

  // AI Patient Communication
  router.post('/ai/patient-communication', requireAuth, async (req, res) => {
    try {
      const { purpose, patientInfo, communicationType, tone = 'professional' } = req.body;
      
      if (!purpose || !patientInfo || !communicationType) {
        return res.status(400).json({
          success: false,
          message: 'Purpose, patient info, and communication type are required'
        });
      }
      
      const communication = await aiService.generatePatientCommunication(
        purpose,
        patientInfo,
        communicationType,
        tone
      );
      
      return res.json({
        success: true,
        communication
      });
    } catch (error) {
      console.error('Error generating patient communication:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate patient communication'
      });
    }
  });

  // Note: X-ray analysis is handled separately in dicom-routes.ts using the same AI service integration
}