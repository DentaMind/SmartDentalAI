import express from 'express';
import { z } from 'zod';
import { storage } from "../storage";
import axios from 'axios';

const router = express.Router();

// Function to generate AI treatment plan based on patient data and diagnosis
async function generateAITreatmentPlan(patientId: number, diagnosisId?: number) {
  try {
    // Get patient's diagnostic information and chart data
    let diagnosis;
    if (diagnosisId) {
      diagnosis = await storage.getDiagnosisById(diagnosisId);
    } else {
      // Get the most recent diagnosis if no specific one provided
      const diagnoses = await storage.getDiagnosesForPatient(patientId);
      if (diagnoses.length > 0) {
        // Sort by most recent
        diagnosis = diagnoses.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )[0];
      }
    }
    
    // Get chart data
    const perioEntries = await storage.getPatientPerioChartEntries(patientId);
    const restorativeEntries = await storage.getPatientRestorativeChartEntries(patientId);
    
    // If no diagnosis exists, cannot generate a treatment plan
    if (!diagnosis) {
      return {
        ai_draft: "No diagnosis available. Please create a diagnosis first.",
        confidence: 0,
        reasoning: "A diagnosis is required to generate a treatment plan."
      };
    }
    
    // Prepare data for AI analysis
    const patientData = {
      diagnosis: {
        condition: diagnosis.condition,
        explanation: diagnosis.explanation,
        modifiedExplanation: diagnosis.modifiedExplanation
      },
      perioData: perioEntries,
      restorativeData: restorativeEntries
    };
    
    // Select the appropriate OpenAI API key based on the treatment context
    const apiKey = process.env.OPENAI_API_KEY_TREATMENT;
    
    if (!apiKey) {
      throw new Error("OpenAI API key not configured for treatment planning");
    }
    
    // Send data to OpenAI API for treatment plan generation
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a dental AI assistant that generates treatment plans based on diagnoses and patient data.'
          },
          {
            role: 'user',
            content: `Generate a detailed dental treatment plan based on the following patient data: ${JSON.stringify(patientData)}`
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse and return AI-generated treatment plan
    const aiResponse = response.data.choices[0].message.content;
    const parsedResponse = JSON.parse(aiResponse);
    
    return {
      ai_draft: parsedResponse.treatment_plan || "",
      confidence: parsedResponse.confidence || 75,
      reasoning: parsedResponse.reasoning || "Based on the diagnosis and chart data"
    };
  } catch (error) {
    console.error("Error generating AI treatment plan:", error);
    
    // Return fallback plan if AI generation fails
    return {
      ai_draft: "Unable to generate AI treatment plan. Please create one manually.",
      confidence: 0,
      reasoning: "There was an error connecting to the AI treatment planning service."
    };
  }
}

// Schema for validating treatment plan approval
const treatmentPlanApprovalSchema = z.object({
  finalPlan: z.string(),
  structuredPlan: z.string().optional(),
  providerId: z.number().optional(),
  diagnosisId: z.number().optional()
});

// Get treatment plan for a patient
router.get('/api/treatment-plan/:patientId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    // Get existing treatment plans
    const existingPlans = await storage.getPatientTreatmentPlans(patientId);
    
    // If there are recent treatment plans, return the most recent one
    if (existingPlans.length > 0) {
      // Sort by most recent
      const sortedPlans = existingPlans.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      const mostRecent = sortedPlans[0];
      
      // If the most recent plan is less than 3 days old, return it
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      if (new Date(mostRecent.createdAt || 0) > threeDaysAgo) {
        return res.json({
          planText: mostRecent.planDetails || "",
          structuredPlan: mostRecent.metadata ? JSON.stringify(mostRecent.metadata) : null,
          confidence: 100,
          reasoning: "Provider-approved treatment plan",
          status: mostRecent.status
        });
      }
    }
    
    // Generate new AI treatment plan
    const aiPlan = await generateAITreatmentPlan(patientId);
    
    res.json({
      planText: aiPlan.ai_draft,
      confidence: aiPlan.confidence,
      reasoning: aiPlan.reasoning,
      status: "draft"
    });
  } catch (error) {
    console.error("Error retrieving treatment plan:", error);
    res.status(500).json({ error: "Failed to retrieve treatment plan" });
  }
});

// Approve or update a treatment plan
router.post('/api/treatment-plan/:patientId/approve', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const validation = treatmentPlanApprovalSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      });
    }
    
    const { finalPlan, structuredPlan, providerId = 1, diagnosisId } = validation.data;
    
    // Get diagnosis if provided
    let diagnosisDetails = null;
    if (diagnosisId) {
      diagnosisDetails = await storage.getDiagnosisById(diagnosisId);
    } else {
      // Get most recent diagnosis
      const diagnoses = await storage.getDiagnosesForPatient(patientId);
      if (diagnoses.length > 0) {
        diagnosisDetails = diagnoses.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )[0];
      }
    }
    
    // Parse structured plan if available
    let structuredData = null;
    let cost = 0;
    let appointmentsRequired = 1;
    let urgency = "normal";
    let complexity = "moderate";
    let procedures = [];
    let insuranceEstimate = 0;
    let patientResponsibility = 0;
    
    if (structuredPlan) {
      try {
        structuredData = JSON.parse(structuredPlan);
        
        // Extract values from structured data
        if (structuredData.estimatedTotalCost) {
          cost = structuredData.estimatedTotalCost;
        }
        
        if (structuredData.appointmentsRequired) {
          appointmentsRequired = structuredData.appointmentsRequired;
        }
        
        if (structuredData.urgency) {
          urgency = structuredData.urgency;
        }
        
        if (structuredData.complexity) {
          complexity = structuredData.complexity;
        }
        
        if (structuredData.proceduresList) {
          procedures = structuredData.proceduresList;
        }
        
        if (structuredData.insuranceEstimate) {
          insuranceEstimate = structuredData.insuranceEstimate;
        }
        
        if (structuredData.patientResponsibility) {
          patientResponsibility = structuredData.patientResponsibility;
        } else if (cost > 0) {
          patientResponsibility = cost - insuranceEstimate;
        }
      } catch (parseError) {
        console.error("Error parsing structured plan data:", parseError);
      }
    }
    
    // Create the treatment plan
    const newPlan = await storage.createTreatmentPlan({
      patientId,
      doctorId: providerId,
      diagnosis: diagnosisDetails ? diagnosisDetails.condition : "Based on clinical examination",
      procedures: procedures.length > 0 ? procedures : [],
      cost: cost,
      planDetails: finalPlan,
      status: "accepted",
      startDate: new Date(),
      endDate: null,
      notes: "Provider approved treatment plan",
      createdAt: new Date(),
      updatedAt: new Date(),
      appointmentsRequired: appointmentsRequired,
      totalAppointments: appointmentsRequired,
      appointmentsCompleted: 0,
      patientAccepted: false,
      paymentPlanOffered: false,
      paymentPlanAccepted: false,
      insuranceVerified: false,
      insuranceStatus: null,
      insuranceApprovalDate: null,
      insuranceRejectionReason: null,
      estimatedInsuranceCoverage: insuranceEstimate,
      patientResponsibility: patientResponsibility,
      urgency: urgency,
      complexity: complexity,
      treatmentType: "restorative",
      isComplete: false,
      completionDate: null,
      followUpRequired: false,
      followUpDate: null,
      followUpNotes: null,
      attachments: [],
      relatedXrayIds: [],
      patientConsent: false,
      patientConsentDate: null,
      consentFormPath: null,
      createdBy: providerId,
      metadata: structuredData // Store the full structured data in metadata field
    });
    
    // Create charting note for the treatment plan approval
    await storage.createChartingNote({
      patientId,
      providerId,
      title: "Treatment Plan Approved",
      noteBody: `Treatment Plan Approved: \n\n${finalPlan}`,
      source: "charting",
      status: "approved",
      approved: true,
      approvedBy: providerId,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json({ 
      success: true, 
      message: "Treatment plan approved",
      plan: newPlan
    });
  } catch (error) {
    console.error("Error approving treatment plan:", error);
    res.status(500).json({ error: "Failed to approve treatment plan" });
  }
});

export default router;