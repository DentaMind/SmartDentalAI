import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const router = express.Router();

// Get all AI insights for a patient
router.get('/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // In a real implementation, we would query the database
    // For now, return mock data for testing
    const aiInsights = {
      summary: "Patient shows moderate periodontal risk and has overdue treatments that should be addressed. Insurance benefits expire soon.",
      questions: [
        "Has the patient been experiencing any sensitivity to hot or cold?",
        "Is the patient following the recommended homecare routine?",
        "Has the patient scheduled the recommended follow-up for periodontal treatment?"
      ],
      flags: [
        {
          text: "Missed periodontal follow-up appointment from last visit",
          level: "medium"
        },
        {
          text: "Insurance benefits remaining: $850 (expires in 45 days)",
          level: "high"
        },
        {
          text: "Radiographic evidence of interproximal caries at #14-15",
          level: "medium"
        }
      ],
      recommendations: [
        "Schedule periodontal maintenance within 30 days",
        "Recommend restoring incipient caries at #14-15 before they progress",
        "Utilize remaining insurance benefits before year-end"
      ]
    };
    
    res.json(aiInsights);
  } catch (error) {
    console.error(`Error fetching AI insights for patient ${req.params.patientId}:`, error);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});

// Get risk assessment for a patient
router.get('/:patientId/risk-assessment', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Mock risk assessment data
    const riskAssessment = {
      perioRisk: {
        level: "moderate",
        factors: [
          "4-5 mm pocket depths in posterior regions",
          "Bleeding on probing: 22%",
          "Moderate plaque accumulation",
          "Previous history of periodontitis"
        ],
        recommendations: [
          "3-month recall interval",
          "Advanced home care protocol with interdental brushes",
          "Consider local antibiotic therapy at sites with persistent inflammation"
        ]
      },
      cariesRisk: {
        level: "high",
        factors: [
          "Multiple new lesions in past 24 months",
          "Frequent snacking on carbohydrates",
          "Inadequate fluoride exposure",
          "Reduced salivary flow"
        ],
        recommendations: [
          "High-fluoride toothpaste (5000 ppm)",
          "Xylitol gum after meals",
          "Calcium phosphate paste before bedtime",
          "Dietary counseling"
        ]
      },
      systemicRisk: {
        level: "low",
        factors: [
          "Well-controlled diabetes (HbA1c 6.2%)",
          "No smoking history",
          "Regular exercise routine",
          "Medication: Lisinopril for hypertension"
        ],
        recommendations: [
          "Continue monitoring blood pressure",
          "Annual physician check-up",
          "Maintain current health regimen"
        ]
      }
    };
    
    res.json(riskAssessment);
  } catch (error) {
    console.error(`Error fetching risk assessment for patient ${req.params.patientId}:`, error);
    res.status(500).json({ error: "Failed to fetch risk assessment" });
  }
});

// Get treatment insights for a patient
router.get('/:patientId/treatment-insights', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Mock treatment insights data
    const treatmentInsights = {
      missedTreatments: [
        {
          id: 1,
          treatment: "Crown on tooth #30",
          recommendedDate: "3 months ago",
          urgency: "high",
          financialImpact: 1200,
          insuranceCoverage: 60
        },
        {
          id: 2,
          treatment: "Scaling and Root Planing - Lower Right Quadrant",
          recommendedDate: "2 months ago",
          urgency: "medium",
          financialImpact: 350,
          insuranceCoverage: 80
        },
        {
          id: 3,
          treatment: "Restoration on tooth #14",
          recommendedDate: "1 month ago",
          urgency: "low",
          financialImpact: 275,
          insuranceCoverage: 70
        }
      ],
      treatmentSequence: [
        "Periodontal therapy",
        "Caries control",
        "Definitive restorations",
        "Replacement of missing teeth"
      ],
      insuranceOptimization: {
        remainingBenefits: 1500,
        expiringBenefits: "Coverage period ends on December 31, 2025",
        recommendations: [
          "Complete periodontal treatment this year",
          "Schedule crown on #30 before year-end",
          "Split treatment between benefit years for maximum coverage"
        ]
      },
      schedulingRecommendations: {
        nextAppointment: "Periodontal therapy",
        followUpNeeded: true,
        recommendedTimeFrame: "Within 2 weeks",
        reasons: [
          "Prevent progression of periodontal disease",
          "Address areas with active inflammation",
          "Necessary before restorative treatment"
        ]
      }
    };
    
    res.json(treatmentInsights);
  } catch (error) {
    console.error(`Error fetching treatment insights for patient ${req.params.patientId}:`, error);
    res.status(500).json({ error: "Failed to fetch treatment insights" });
  }
});

// Get financial insights for a patient
router.get('/:patientId/financial-insights', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Mock financial insights data
    const financialInsights = {
      estimatedTotal: 3500,
      insuranceCoverage: 2100,
      patientResponsibility: 1400,
      paymentOptions: [
        "Pay in full (5% discount)",
        "3-month payment plan (no interest)",
        "6-month payment plan (5% interest)",
        "CareCredit financing (12 months, no interest)"
      ],
      financingAvailable: true,
      insuranceOptimization: [
        "Complete scaling and root planing this year (80% coverage)",
        "Schedule crown on #30 in January (new benefit year)",
        "Use FSA funds for patient portion before year-end",
        "Downgrade restoration material on #14-15 for better coverage"
      ]
    };
    
    res.json(financialInsights);
  } catch (error) {
    console.error(`Error fetching financial insights for patient ${req.params.patientId}:`, error);
    res.status(500).json({ error: "Failed to fetch financial insights" });
  }
});

// Get doctor feedback for a patient
router.get('/:patientId/doctor-feedback', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Mock doctor feedback data
    const doctorFeedback = {
      "perioRisk": true,
      "cariesRisk": true,
      "systemicRisk": false,
      "treatmentPlan": true,
      "financialRecommendation": false
    };
    
    res.json(doctorFeedback);
  } catch (error) {
    console.error(`Error fetching doctor feedback for patient ${req.params.patientId}:`, error);
    res.status(500).json({ error: "Failed to fetch doctor feedback" });
  }
});

// Save doctor feedback for a patient
router.post('/:patientId/doctor-feedback', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { insightId, approved } = req.body;
    
    if (!insightId) {
      return res.status(400).json({ error: "Missing insightId" });
    }
    
    // In a real implementation, we would save to the database
    // For now, just return success
    res.json({ 
      patientId,
      insightId,
      approved,
      message: "Doctor feedback saved successfully"
    });
  } catch (error) {
    console.error(`Error saving doctor feedback for patient ${req.params.patientId}:`, error);
    res.status(500).json({ error: "Failed to save doctor feedback" });
  }
});

// Send a reminder to a patient about missed treatment
router.post('/:patientId/send-reminder', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { treatmentId } = req.body;
    
    if (!treatmentId) {
      return res.status(400).json({ error: "Missing treatmentId" });
    }
    
    // In a real implementation, we would send an email/SMS and log to the database
    // For now, just return success
    res.json({ 
      patientId,
      treatmentId,
      message: "Reminder sent successfully",
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error sending reminder for patient ${req.params.patientId}:`, error);
    res.status(500).json({ error: "Failed to send reminder" });
  }
});

export default router;